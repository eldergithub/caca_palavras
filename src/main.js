// src/main.js
// Ponto de entrada principal do Caça-Palavras. Liga Core, UI, Persistência e Wake Lock (§14).

import { calcularLayout } from './ui/layout.js';
import {
  criarEstruturaUI,
  renderizarGrade,
  desenharCapsulaSVG,
  renderizarLista,
  obterCorCiclo
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
  obterNivelEfetivo
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
  carregarAjustes
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
  if (document.visibilityState === 'visible') {
    solicitarWakeLock();
  }
});

// 2. Estado Global da Aplicação
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

// Carregar tabuleiros de reserva para fallback silencioso (§7.2)
fetch('./tabuleiros-reserva.json')
  .then(res => res.json())
  .then(dados => { reservaCache = dados; })
  .catch(() => {});

// 3. Funções de Layout e Redesenho
function atualizarDimensoesLayout() {
  const nDesejado = partidaAtiva ? partidaAtiva.tabuleiro.n : 10;
  configLayout = calcularLayout(window.innerWidth, window.innerHeight, nDesejado, ajustes.deltaFontePx);

  if (partidaAtiva) {
    renderizarGrade(elementosUI, partidaAtiva.tabuleiro.grade, configLayout);
    elementosUI.rotuloTema.style.display = configLayout.exibirTema ? 'block' : 'none';
    elementosUI.rotuloTema.textContent = `TEMA: ${partidaAtiva.tabuleiro.tema.toUpperCase()}`;

    redesenharTodasAsCapsulas();
    atualizarListaUI();
  }
}

function redesenharTodasAsCapsulas() {
  elementosUI.svgCapsulas.innerHTML = '';
  if (!partidaAtiva) return;

  // Redesenhar cápsulas das palavras encontradas com o ciclo de cores (§9.4)
  partidaAtiva.ordemEncontradas.forEach((palavraTexto, idx) => {
    const celulas = partidaAtiva.celulasEncontradas.get(palavraTexto);
    if (celulas) {
      const cor = obterCorCiclo(idx);
      desenharCapsulaSVG(elementosUI.svgCapsulas, celulas, cor, null, configLayout);
    }
  });

  // Atualizar marcas visuais de dicas ativas (§8)
  for (const [palavra, degrau] of Object.entries(partidaAtiva.degrausDicas)) {
    if (partidaAtiva.pendentes.has(palavra)) {
      const col = partidaAtiva.tabuleiro.palavrasColocadas.find(p => p.texto === palavra);
      if (col) {
        if (degrau >= 1) {
          const celEl = document.getElementById(`cel-${col.celulas[0].l}-${col.celulas[0].c}`);
          if (celEl) celEl.classList.add('dica-marcada');
        }
        if (degrau >= 2) {
          desenharCapsulaSVG(elementosUI.svgCapsulas, col.celulas.slice(0, 2), '#ffd9a0', null, configLayout);
        }
      }
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

// 4. Inicialização de Partida
function iniciarPartida(estadoSalvo = null) {
  if (tutorialFantasma) {
    tutorialFantasma.parar();
    tutorialFantasma = null;
  }

  const nivelEfetivo = obterNivelEfetivo(estadoEscada);
  const layoutPrevio = calcularLayout(window.innerWidth, window.innerHeight, 10, ajustes.deltaFontePx);

  let tabuleiro = null;

  if (estadoSalvo) {
    // Reconstrói tabuleiro a partir da semente salva (§7.6)
    tabuleiro = gerarTabuleiro(estadoSalvo.semente, estadoSalvo.n, estadoSalvo.nivel, estadoSalvo.tema);
  }

  if (!tabuleiro) {
    // Gera nova semente e nova partida
    const semente = hash32(Date.now(), stats.concluidas, nivelEfetivo, Math.random());
    const reservaFallback = reservaCache ? reservaCache[Math.floor(Math.random() * reservaCache.length)] : null;
    tabuleiro = gerarTabuleiro(semente, layoutPrevio.nMax, nivelEfetivo, null, reservaFallback);
  }

  partidaAtiva = criarPartida(tabuleiro, estadoSalvo);
  salvarPartida(partidaAtiva.obterDadosParaSalvar());

  atualizarDimensoesLayout();

  // Reinicia capturador tátil
  if (capturadorSelecao) capturadorSelecao.destruir();
  capturadorSelecao = iniciarCapturaSelecao(elementosUI, configLayout, aoResolverSelecao);

  // Dedo fantasma demonstrativo se for a primeira vez (§5.7)
  if (!stats.ensinoConcluido && partidaAtiva.tabuleiro.palavrasColocadas.length > 0) {
    const palavraCurta = [...partidaAtiva.tabuleiro.palavrasColocadas].sort((a, b) => a.texto.length - b.texto.length)[0];
    tutorialFantasma = iniciarDedoFantasma(elementosUI.containerGrade, palavraCurta, configLayout);
  }
}

// 5. Resolução de Seleção e os 4 Desfechos (§3.4)
function aoResolverSelecao(segmento) {
  const resultado = partidaAtiva.resolverSelecao(segmento);

  if (resultado.desfecho === 'acertou') {
    // 1. Acertou: cápsula no ciclo de cores, vibração 40ms, riscar da lista (§3.4)
    if ('vibrate' in navigator) {
      try { navigator.vibrate(40); } catch {}
    }

    if (tutorialFantasma) {
      tutorialFantasma.parar();
      tutorialFantasma = null;
      stats.ensinoConcluido = true;
      salvarStats(stats);
    }

    redesenharTodasAsCapsulas();
    atualizarListaUI();
    salvarPartida(partidaAtiva.obterDadosParaSalvar());

    if (resultado.completo) {
      // Vitória! (§9.7)
      finalizarPartida(false);
    }
  } else if (resultado.desfecho === 'palavra_real') {
    // 2. Palavra real fora da lista: lampejo âmbar de 500 ms (§3.4)
    const elFlash = desenharCapsulaSVG(elementosUI.svgCapsulas, resultado.segmento, 'var(--cor-real-ambar)', null, configLayout);
    setTimeout(() => {
      if (elFlash) elFlash.remove();
    }, 500);
  } else if (resultado.desfecho === 'errou') {
    // 4. Errou: cápsula cinza-neutra balança 200 ms e some. Sem vermelho, sem som (§3.4)
    const elErro = desenharCapsulaSVG(elementosUI.svgCapsulas, resultado.segmento, 'var(--cor-erro-cinza)', null, configLayout);
    elementosUI.containerGrade.classList.add('anim-erro');
    setTimeout(() => {
      if (elErro) elErro.remove();
      elementosUI.containerGrade.classList.remove('anim-erro');
    }, 200);
  }
}

function finalizarPartida(abandonada = false) {
  const segundos = partidaAtiva.obterTempoGastoSegundos();
  const dicas = partidaAtiva.dicasUsadas;

  if (!abandonada) {
    stats.concluidas++;
    salvarStats(stats);
  }

  // Atualiza escada de dificuldade (§6.3)
  estadoEscada = processarFimDePartida(estadoEscada, {
    segundos,
    dicas,
    abandonada
  });
  salvarEscada(estadoEscada);
  limparPartidaSalva();

  if (!abandonada) {
    exibirVitoria(elementosUI.camadaModal, {
      onJogarOutra: () => {
        iniciarPartida(null);
      }
    });
  }
}

// 6. Configuração dos Controles da UI (§5.4)
configurarControles(elementosUI, {
  aoPedirDica: () => {
    if (!partidaAtiva || partidaAtiva.estaCompleto()) return;
    const res = partidaAtiva.aplicarDica();
    if (!res) return;

    if (res.degrau === 1) {
      // 1º Toque: primeira letra pulsa em dourado (§8)
      const cel = res.celulas[0];
      const celEl = document.getElementById(`cel-${cel.l}-${cel.c}`);
      if (celEl) {
        celEl.classList.add('anim-dica');
        setTimeout(() => {
          celEl.classList.remove('anim-dica');
          celEl.classList.add('dica-marcada');
        }, 1800);
      }
    } else if (res.degrau === 2) {
      // 2º Toque: direção estende 2 células (§8)
      desenharCapsulaSVG(elementosUI.svgCapsulas, res.celulas, '#ffd9a0', null, configLayout);
    } else if (res.degrau === 3) {
      // 3º Toque: palavra inteira revelada e riscada (§8)
      redesenharTodasAsCapsulas();
      atualizarListaUI();
      if (res.completo) {
        finalizarPartida(false);
        return;
      }
    }

    salvarPartida(partidaAtiva.obterDadosParaSalvar());
  },

  temPartidaEmAndamento: () => {
    return partidaAtiva && !partidaAtiva.estaCompleto() && partidaAtiva.encontradas.size > 0;
  },

  aoIniciarNovoJogo: (abandonou) => {
    if (abandonou) {
      const metade = Math.ceil(partidaAtiva.tabuleiro.palavras.length / 2);
      const menosQueMetade = partidaAtiva.encontradas.size < metade;
      finalizarPartida(menosQueMetade);
    }
    iniciarPartida(null);
  },

  aoSair: () => {
    if (partidaAtiva) {
      salvarPartida(partidaAtiva.obterDadosParaSalvar());
    }
    try { window.close(); } catch {}
  },

  aoAbrirAjustes: () => {
    abrirModalAjustes(elementosUI.camadaModal, {
      estadoEscada,
      ajustes,
      partidasConcluidas: stats.concluidas,
      onSalvarAjustes: (novosAjustes) => {
        ajustes = { ...ajustes, ...novosAjustes };
        salvarAjustes(ajustes);
        atualizarDimensoesLayout();
      },
      onMudarNivel: (delta) => {
        estadoEscada.ajusteManual = (estadoEscada.ajusteManual || 0) + delta;
        salvarEscada(estadoEscada);
      }
    });
  }
});

// Redimensionamento de janela resiliente
window.addEventListener('resize', () => {
  atualizarDimensoesLayout();
});

// 7. Arranque: Recupera partida guardada ou começa nova (§7.6)
const partidaSalva = carregarPartida();
iniciarPartida(partidaSalva);
