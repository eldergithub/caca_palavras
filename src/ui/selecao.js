// src/ui/selecao.js
// Captura de gestos, máquina de estados unificada (arrasto e 2 toques) e projeção sobre 8 direções (§3.1, §3.2, §3.3).

import { DIRECOES, MAPA_DIRECOES } from '../core/dificuldade.js';
import { calcularCentroCelula, desenharCapsulaSVG, obterCorCiclo } from './render.js';

export const LIMIAR_DE_ARRASTO = 10; // px CSS (§3.2)
export const TIMEOUT_SEGUNDO_TOQUE = 15000; // 15 s (§3.2)

// Direções com vetores normalizados e ângulos para projeção
const DIRECOES_VETORIAIS = DIRECOES.map(d => {
  const angulo = Math.atan2(d.dl, d.dc);
  const norma = Math.hypot(d.dc, d.dl);
  return {
    id: d.id,
    dl: d.dl,
    dc: d.dc,
    ux: d.dc / norma,
    uy: d.dl / norma,
    angulo,
    isDiagonal: d.dl !== 0 && d.dc !== 0
  };
});

// Encontra a célula sob a coordenada de toque sem pixel morto (§3.3, itens 1 e 2)
export function pontoParaCelula(x, y, configLayout) {
  const { n, celula, vao, tamanhoGrade } = configLayout;
  const padding = (tamanhoGrade - (n * celula + (n - 1) * vao)) / 2;

  // Clampa coordenadas dentro da grade útil
  const clampedX = Math.max(padding, Math.min(tamanhoGrade - padding - 1, x));
  const clampedY = Math.max(padding, Math.min(tamanhoGrade - padding - 1, y));

  const passo = celula + vao;
  const c = Math.floor((clampedX - padding) / passo);
  const l = Math.floor((clampedY - padding) / passo);

  return {
    l: Math.max(0, Math.min(n - 1, l)),
    c: Math.max(0, Math.min(n - 1, c))
  };
}

// Projeção escalar geométrica pura sobre as 8 direções (§3.1)
export function calcularSegmentoProjetado(ancora, pontoAtual, configLayout) {
  const centroAncora = calcularCentroCelula(ancora.l, ancora.c, configLayout);
  const dx = pontoAtual.x - centroAncora.x;
  const dy = pontoAtual.y - centroAncora.y;

  const distanciaPonteiro = Math.hypot(dx, dy);
  if (distanciaPonteiro < configLayout.celula * 0.4) {
    // Ainda muito próximo do centro da âncora
    return [ancora];
  }

  const anguloPonteiro = Math.atan2(dy, dx);

  // Encontra a direção de menor desvio angular
  let melhorDir = DIRECOES_VETORIAIS[0];
  let menorDiff = Infinity;

  for (const dir of DIRECOES_VETORIAIS) {
    let diff = Math.abs(anguloPonteiro - dir.angulo);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    if (diff < menorDiff) {
      menorDiff = diff;
      melhorDir = dir;
    }
  }

  // Passo da célula dependendo se é diagonal
  const passo = melhorDir.isDiagonal
    ? (configLayout.celula + configLayout.vao) * Math.SQRT2
    : (configLayout.celula + configLayout.vao);

  // Projeção escalar do vetor sobre a direção unitária
  const projecao = dx * melhorDir.ux + dy * melhorDir.uy;
  let comprimento = Math.round(Math.max(0, projecao) / passo);

  // Limita até a borda da grade naquela direção (§3.1, §3.3 item 3)
  const n = configLayout.n;
  let maxPassosL = Infinity;
  if (melhorDir.dl > 0) maxPassosL = n - 1 - ancora.l;
  else if (melhorDir.dl < 0) maxPassosL = ancora.l;

  let maxPassosC = Infinity;
  if (melhorDir.dc > 0) maxPassosC = n - 1 - ancora.c;
  else if (melhorDir.dc < 0) maxPassosC = ancora.c;

  const maxPassos = Math.min(maxPassosL, maxPassosC);
  comprimento = Math.max(0, Math.min(comprimento, maxPassos));

  const segmento = [];
  for (let k = 0; k <= comprimento; k++) {
    segmento.push({
      l: ancora.l + k * melhorDir.dl,
      c: ancora.c + k * melhorDir.dc
    });
  }

  return segmento;
}

// Conecta dois toques em linha reta caso formem uma das 8 direções
export function conectarDoisToques(ancora, destino) {
  const dl = destino.l - ancora.l;
  const dc = destino.c - ancora.c;

  if (dl === 0 && dc === 0) return [ancora];

  const passosL = Math.abs(dl);
  const passosC = Math.abs(dc);

  // Horizontal pura
  if (dl === 0) {
    const sgnC = Math.sign(dc);
    const seg = [];
    for (let k = 0; k <= passosC; k++) seg.push({ l: ancora.l, c: ancora.c + k * sgnC });
    return seg;
  }

  // Vertical pura
  if (dc === 0) {
    const sgnL = Math.sign(dl);
    const seg = [];
    for (let k = 0; k <= passosL; k++) seg.push({ l: ancora.l + k * sgnL, c: ancora.c });
    return seg;
  }

  // Diagonal pura (45 graus)
  if (passosL === passosC) {
    const sgnL = Math.sign(dl);
    const sgnC = Math.sign(dc);
    const seg = [];
    for (let k = 0; k <= passosL; k++) seg.push({ l: ancora.l + k * sgnL, c: ancora.c + k * sgnC });
    return seg;
  }

  // Não forma direção reta perfeita: projeta destino na direção mais próxima
  return null;
}

// Inicializa a máquina de estados tátil (§3.2)
export function iniciarCapturaSelecao(elementos, configLayout, onResolverSelecao) {
  const { containerGrade, svgCapsulas } = elementos;

  let estado = 'OCIOSO'; // OCIOSO, ANCORADO, ARRASTANDO, ESPERANDO_SEGUNDO_TOQUE
  let ancora = null;
  let pontoInicial = { x: 0, y: 0 };
  let segmentoAtual = [];
  let timerSegundoToque = null;
  let elCapsulaAtiva = null;

  function limparSelecaoVisual() {
    if (elCapsulaAtiva) {
      elCapsulaAtiva.remove();
      elCapsulaAtiva = null;
    }
  }

  function desenharSelecao(segmento, cor = 'var(--cor-selecao)') {
    limparSelecaoVisual();
    if (segmento && segmento.length > 0) {
      elCapsulaAtiva = desenharCapsulaSVG(svgCapsulas, segmento, cor, 'capsula-ativa', configLayout);
    }
  }

  function obterPosicaoRelativa(e) {
    const rect = containerGrade.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function resolver(segmento) {
    limparSelecaoVisual();
    if (timerSegundoToque) {
      clearTimeout(timerSegundoToque);
      timerSegundoToque = null;
    }
    estado = 'OCIOSO';
    ancora = null;
    segmentoAtual = [];

    if (!segmento || segmento.length <= 1) return;
    onResolverSelecao(segmento);
  }

  function onPointerDown(e) {
    e.preventDefault();
    const pos = obterPosicaoRelativa(e);
    const celula = pontoParaCelula(pos.x, pos.y, configLayout);

    if (estado === 'ESPERANDO_SEGUNDO_TOQUE') {
      if (celula.l === ancora.l && celula.c === ancora.c) {
        // Toque na própria âncora -> cancela (§3.2)
        resolver(null);
        return;
      }

      // Toque em outra célula -> resolve(âncora -> célula) (§3.2)
      let seg = conectarDoisToques(ancora, celula);
      if (!seg) {
        // Projeta caso não seja estritamente alinhado
        seg = calcularSegmentoProjetado(ancora, pos, configLayout);
      }
      resolver(seg);
      return;
    }

    // Início normal de seleção
    estado = 'ANCORADO';
    ancora = celula;
    pontoInicial = pos;
    segmentoAtual = [ancora];
    desenharSelecao(segmentoAtual);
  }

  function onPointerMove(e) {
    if (estado !== 'ANCORADO' && estado !== 'ARRASTANDO') return;
    e.preventDefault();
    const pos = obterPosicaoRelativa(e);
    const distPercorrida = Math.hypot(pos.x - pontoInicial.x, pos.y - pontoInicial.y);

    if (estado === 'ANCORADO') {
      if (distPercorrida > LIMIAR_DE_ARRASTO) {
        estado = 'ARRASTANDO';
      } else {
        return;
      }
    }

    if (estado === 'ARRASTANDO') {
      segmentoAtual = calcularSegmentoProjetado(ancora, pos, configLayout);
      desenharSelecao(segmentoAtual);
    }
  }

  function onPointerUp(e) {
    if (estado === 'ANCORADO') {
      // Menos de 10px percorridos -> vai para ESPERANDO_SEGUNDO_TOQUE (§3.2)
      estado = 'ESPERANDO_SEGUNDO_TOQUE';
      desenharSelecao([ancora]);

      timerSegundoToque = setTimeout(() => {
        resolver(null); // 15s sem ação -> desliga âncora silenciosamente
      }, TIMEOUT_SEGUNDO_TOQUE);
      return;
    }

    if (estado === 'ARRASTANDO') {
      resolver(segmentoAtual);
    }
  }

  function onPointerCancel(e) {
    // pointercancel resolve em vez de descartar (§3.2)
    if (estado === 'ARRASTANDO' && segmentoAtual.length > 1) {
      resolver(segmentoAtual);
    } else {
      resolver(null);
    }
  }

  // Toque fora da grade apaga ESPERANDO_SEGUNDO_TOQUE (§3.2)
  function onPointerDownFora(e) {
    if (estado === 'ESPERANDO_SEGUNDO_TOQUE' && !containerGrade.contains(e.target)) {
      resolver(null);
    }
  }

  containerGrade.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);
  window.addEventListener('pointerdown', onPointerDownFora);

  return {
    destruir: () => {
      containerGrade.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('pointerdown', onPointerDownFora);
      if (timerSegundoToque) clearTimeout(timerSegundoToque);
    }
  };
}
