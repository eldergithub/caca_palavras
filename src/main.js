// src/main.js
// Ponto de entrada principal do Caça-Palavras. Liga Core, UI, Persistência e Wake Lock (§14).

import { calcularLayout } from './ui/layout.js';
import {
  criarEstruturaUI,
  aplicarMedidas,
  renderizarGrade,
  desenharCapsulaSVG,
  renderizarLista,
  renderizarSetasDirecoes,
  obterCorCiclo,
} from './ui/render.js';
import { iniciarCapturaSelecao } from './ui/selecao.js';
import { configurarControles } from './ui/controles.js';
import { iniciarDedoFantasma } from './ui/ensino.js';
import { exibirVitoria } from './ui/vitoria.js';
import { abrirModalAjustes } from './ui/ajustes.js';

import { gerarTabuleiro } from './core/gerador.js';
import { criarPartida } from './core/partida.js';
import {
  criarEstadoEscadaInicial,
  processarFimDePartida,
  obterNivelEfetivo,
  ajustarNivelManualmente,
} from './core/escada.js';
import { hash32 } from './core/prng.js';
import {
  salvarPartida,
  carregarPartida,
  limparPartidaSalva,
  salvarEscada,
  carregarEscada,
  salvarStats,
  carregarStats,
  salvarAjustes,
  carregarAjustes,
} from './storage.js';

// 1. Wake Lock resiliente (§11.2)
let wakeLockSentinel = null;
async function solicitarWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
    } catch {}
  }
}
solicitarWakeLock();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') solicitarWakeLock();
});

// 2. Estado global
const appEl = document.getElementById('app');
const elementosUI = criarEstruturaUI(appEl);

let ajustes = carregarAjustes();
let estadoEscada = carregarEscada() || criarEstadoEscadaInicial();
let stats = carregarStats();

let partidaAtiva = null;
let configLayout = null;
let capturadorSelecao = null;
let tutorialFantasma = null;
let reservaCache = null;

// Tabuleiros de reserva para o fallback silencioso (§7.2). O Service Worker
// já os tem em pré-cache, então isto resolve rápido inclusive sem internet.
fetch('./tabuleiros-reserva.json')
  .then(res => res.json())
  .then(dados => { reservaCache = dados; })
  .catch(() => {});

// 3. Layout e redesenho
function atualizarDimensoesLayout() {
  const nDesejado = partidaAtiva ? partidaAtiva.tabuleiro.n : 10;
  const qtdPalavras = partidaAtiva ? partidaAtiva.tabuleiro.palavras.length : 10;

  configLayout = calcularLayout(
    window.innerWidth,
    window.innerHeight,
    nDesejado,
    ajustes.deltaCelulaPx || 0,
    qtdPalavras
  );

  aplicarMedidas(elementosUI, configLayout);

  if (!partidaAtiva) return;

  renderizarGrade(elementosUI, partidaAtiva.tabuleiro.grade, configLayout);
  elementosUI.textoTema.textContent = `TEMA: ${partidaAtiva.tabuleiro.tema.toUpperCase()}`;
  renderizarSetasDirecoes(elementosUI.setasDirecoes, partidaAtiva.tabuleiro.palavrasColocadas);

  redesenharTodasAsCapsulas();
  atualizarListaUI();
}

function redesenharTodasAsCapsulas() {
  elementosUI.svgCapsulas.innerHTML = '';
  if (!partidaAtiva) return;

  // Cápsulas das palavras encontradas, no ciclo de cores (§9.4)
  partidaAtiva.ordemEncontradas.forEach((palavraTexto, idx) => {
    const celulas = partidaAtiva.celulasEncontradas.get(palavraTexto);
    if (celulas) {
      desenharCapsulaSVG(elementosUI.svgCapsulas, celulas, obterCorCiclo(idx), null, configLayout);
    }
  });

  // Marcas discretas e permanentes deixadas pelas dicas (§8)
  for (const [palavra, degrau] of Object.entries(partidaAtiva.degrausDicas)) {
    if (!partidaAtiva.pendentes.has(palavra)) continue;
    const col = partidaAtiva.tabuleiro.palavrasColocadas.find(p => p.texto === palavra);
    if (!col) continue;

    if (degrau >= 1) {
      const celEl = document.getElementById(`cel-${col.celulas[0].l}-${col.celulas[0].c}`);
      if (celEl) celEl.classList.add('dica-marcada');
    }
    if (degrau >= 2) {
      desenharCapsulaSVG(elementosUI.svgCapsulas, col.celulas.slice(0, 2), '#ffd9a0', null, configLayout);
    }
  }
}

function atualizarListaUI() {
  renderizarLista(
    elementosUI.containerLista,
    partidaAtiva.tabuleiro.palavras,
    partidaAtiva.encontradas,
    partidaAtiva.palavraMarcada,
    (palavraClicada) => {
      partidaAtiva.marcarPalavra(palavraClicada);
      atualizarListaUI();
    }
  );
}

// 4. Início de partida
// A semente é derivada do nível, do índice da partida e do ciclo de temas (§7.2),
// e o tema roda sem repetir enquanto o ciclo não fecha.
function proximoTemaDoCiclo() {
  stats.indiceTema = (Number(stats.indiceTema) || 0) + 1;
  return stats.indiceTema;
}

function iniciarPartida(estadoSalvo = null) {
  if (tutorialFantasma) {
    tutorialFantasma.parar();
    tutorialFantasma = null;
  }

  const nivel = obterNivelEfetivo(estadoEscada);
  const layoutPrevio = calcularLayout(
    window.innerWidth, window.innerHeight, 10, ajustes.deltaCelulaPx || 0
  );

  let tabuleiro = null;

  if (estadoSalvo) {
    // O tabuleiro é reconstruído idêntico a partir da semente salva (§7.6).
    // Se ele não revalidar, descarta-se em silêncio e começa partida nova —
    // ela nunca vê erro.
    tabuleiro = gerarTabuleiro(estadoSalvo.semente, estadoSalvo.n, estadoSalvo.nivel, estadoSalvo.tema);
    const palavrasBatem = tabuleiro
      && estadoSalvo.encontradas.every(p => tabuleiro.palavras.some(x => x.n === p));
    if (!tabuleiro || !palavrasBatem) {
      tabuleiro = null;
      estadoSalvo = null;
      limparPartidaSalva();
    }
  }

  if (!tabuleiro) {
    const indiceTema = proximoTemaDoCiclo();
    const semente = hash32(nivel, stats.concluidas, indiceTema);
    const reserva = reservaCache && reservaCache.length
      ? reservaCache[semente % reservaCache.length]
      : null;
    tabuleiro = gerarTabuleiro(semente, layoutPrevio.nMax, nivel, null, reserva);
    salvarStats(stats);
  }

  partidaAtiva = criarPartida(tabuleiro, estadoSalvo);
  salvarPartida(partidaAtiva.obterDadosParaSalvar());

  atualizarDimensoesLayout();
  reiniciarCapturaSelecao();

  // Dedo fantasma só no primeiro tabuleiro de uma instalação nova (§5.7)
  if (!stats.ensinoConcluido && partidaAtiva.tabuleiro.palavrasColocadas.length > 0) {
    const palavraCurta = [...partidaAtiva.tabuleiro.palavrasColocadas]
      .sort((a, b) => a.texto.length - b.texto.length)[0];
    tutorialFantasma = iniciarDedoFantasma(elementosUI.containerGrade, palavraCurta, configLayout);
  }
}

function reiniciarCapturaSelecao() {
  if (capturadorSelecao) capturadorSelecao.destruir();
  capturadorSelecao = iniciarCapturaSelecao(elementosUI, configLayout, aoResolverSelecao);
}

// 5. Os quatro desfechos de uma seleção (§3.4)
function aoResolverSelecao(segmento) {
  const resultado = partidaAtiva.resolverSelecao(segmento);

  if (resultado.desfecho === 'acertou') {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(40); } catch {}
    }

    // O dedo fantasma para para sempre na primeira seleção bem-sucedida dela (§5.7)
    if (tutorialFantasma) {
      tutorialFantasma.parar();
      tutorialFantasma = null;
      stats.ensinoConcluido = true;
      salvarStats(stats);
    }

    redesenharTodasAsCapsulas();
    atualizarListaUI();
    salvarPartida(partidaAtiva.obterDadosParaSalvar());

    if (resultado.completo) concluirPartida();
    return;
  }

  if (resultado.desfecho === 'palavra_real') {
    // Ela foi professora de Português: palavra real no enchimento é reconhecida,
    // não recusada. Lampejo âmbar de 500 ms, sem uma única palavra escrita (§3.4)
    const elFlash = desenharCapsulaSVG(
      elementosUI.svgCapsulas, resultado.segmento, 'var(--cor-real-ambar)', null, configLayout
    );
    setTimeout(() => { if (elFlash) elFlash.remove(); }, 500);
    return;
  }

  if (resultado.desfecho === 'errou') {
    // Cápsula cinza-neutra, balança 200 ms e some. Sem vermelho, sem som, sem mensagem (§3.4)
    const elErro = desenharCapsulaSVG(
      elementosUI.svgCapsulas, resultado.segmento, 'var(--cor-erro-cinza)', null, configLayout
    );
    if (elErro) elErro.classList.add('capsula-erro');
    setTimeout(() => { if (elErro) elErro.remove(); }, 200);
  }
}

// Fim de partida por vitória: comemora e alimenta a escada
function concluirPartida() {
  registrarNaEscada({ abandonada: false, concluida: true });
  stats.concluidas++;
  salvarStats(stats);
  limparPartidaSalva();

  exibirVitoria(elementosUI.camadaModal, {
    aoAcenderOnda: acenderCapsulasEmOnda,
    onJogarOutra: () => iniciarPartida(null),
  });
}

// Fim de partida por JOGO NOVO: nunca comemora, nunca conta como concluída.
// "Abandonada" é só o que alimenta a escada (§6.3).
function encerrarPartidaSemVitoria() {
  const metade = Math.ceil(partidaAtiva.tabuleiro.palavras.length / 2);
  registrarNaEscada({ abandonada: partidaAtiva.encontradas.size < metade, concluida: false });
  limparPartidaSalva();
}

function registrarNaEscada({ abandonada, concluida }) {
  estadoEscada = processarFimDePartida(estadoEscada, {
    segundos: partidaAtiva.obterTempoGastoSegundos(),
    dicas: partidaAtiva.dicasUsadas,
    abandonada,
    concluida,
  });
  salvarEscada(estadoEscada);
}

// §9.7: as cápsulas acendem em onda, da primeira à última encontrada
function acenderCapsulasEmOnda() {
  const capsulas = [...elementosUI.svgCapsulas.children];
  capsulas.forEach((el, idx) => {
    el.classList.add('capsula-onda');
    el.style.animationDelay = `${idx * 90}ms`;
  });
}

// 6. Controles (§5.4)
const controles = configurarControles(elementosUI, {
  aoPedirDica: () => {
    if (!partidaAtiva || partidaAtiva.estaCompleto()) return;
    const res = partidaAtiva.aplicarDica();
    if (!res) return;

    if (res.degrau === 1) {
      // 1º toque: a primeira letra pulsa em dourado, sem direção (§8)
      const cel = res.celulas[0];
      const celEl = document.getElementById(`cel-${cel.l}-${cel.c}`);
      if (celEl) {
        celEl.classList.add('anim-dica');
        // Depois de pulsar, deixa a marca discreta e permanente (§8)
        setTimeout(() => {
          celEl.classList.remove('anim-dica');
          celEl.classList.add('dica-marcada');
        }, 3000);
      }
    } else if (res.degrau === 2) {
      // 2º toque: a cápsula se estende 2 células a partir da primeira letra (§8)
      desenharCapsulaSVG(elementosUI.svgCapsulas, res.celulas, '#ffd9a0', null, configLayout);
    } else if (res.degrau === 3) {
      // 3º toque: palavra inteira revelada e contada como encontrada (§8)
      redesenharTodasAsCapsulas();
      atualizarListaUI();
      if (res.completo) {
        concluirPartida();
        return;
      }
    }

    salvarPartida(partidaAtiva.obterDadosParaSalvar());
  },

  temPartidaEmAndamento: () =>
    Boolean(partidaAtiva) && !partidaAtiva.estaCompleto() && partidaAtiva.encontradas.size > 0,

  aoIniciarNovoJogo: (haviaPartida) => {
    if (haviaPartida) encerrarPartidaSemVitoria();
    iniciarPartida(null);
  },

  aoSair: () => {
    if (partidaAtiva) salvarPartida(partidaAtiva.obterDadosParaSalvar());
    fecharAplicativo();
  },

  aoAbrirAjustes: () => {
    abrirModalAjustes(elementosUI.camadaModal, {
      obterEstado: () => ({
        deltaCelulaPx: ajustes.deltaCelulaPx || 0,
        nivelEfetivo: obterNivelEfetivo(estadoEscada),
        partidasConcluidas: stats.concluidas,
      }),
      onMudarCelula: (delta) => {
        ajustes = { ...ajustes, deltaCelulaPx: delta };
        salvarAjustes(ajustes);
        atualizarDimensoesLayout();
        reiniciarCapturaSelecao();
      },
      onMudarNivel: (delta) => {
        estadoEscada = ajustarNivelManualmente(estadoEscada, delta);
        salvarEscada(estadoEscada);
      },
      onFechar: () => {},
    });
  },
});

// Fechar de verdade ao tocar em SAIR. No aplicativo instalado (display:
// standalone) o window.close() fecha; numa aba comum de navegador o Chrome
// recusa fechar uma página que o próprio usuário abriu, e aí não sobra nada
// na tela além do jogo.
function fecharAplicativo() {
  // A armadilha do botão voltar empilha estados no histórico e atrapalha o
  // fechamento: desfaz ela antes de tentar.
  controles.desarmarVoltar();

  try { window.close(); } catch {}

  // Segunda tentativa: alguns Androids só fecham uma janela que um script
  // "adotou" antes.
  setTimeout(() => {
    try {
      window.open('', '_self');
      window.close();
    } catch {}
  }, 60);
}

// A grade muda de tamanho junto com a janela, e o capturador tátil precisa
// das medidas novas — senão o toque passa a cair na célula errada.
window.addEventListener('resize', () => {
  atualizarDimensoesLayout();
  reiniciarCapturaSelecao();
});

// 7. Arranque: recupera a partida guardada ou começa uma nova (§7.6)
iniciarPartida(carregarPartida());
