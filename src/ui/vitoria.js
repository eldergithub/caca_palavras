// src/ui/vitoria.js
// Comemoração e tela de vitória com celebração do avanço na Esteira de Fases (§9.7).

import { INFORMACOES_FASES } from './esteira.js';
import { tocarSomVitoriaFase } from './audio.js';

export function exibirVitoria(containerModal, { faseAtual, tempoSegundos, dicasUsadas, onAvancarFase, onJogarNovamente }) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(200); } catch {}
  }
  tocarSomVitoriaFase();

  const proximaFase = Math.min(12, faseAtual + 1);
  const infoAtual = INFORMACOES_FASES[faseAtual] || INFORMACOES_FASES[1];
  const infoProxima = INFORMACOES_FASES[proximaFase] || INFORMACOES_FASES[12];
  const ehUltimaFase = faseAtual >= 12;

  const minutos = Math.floor(tempoSegundos / 60);
  const segundos = tempoSegundos % 60;
  const tempoFormatado = minutos > 0 ? `${minutos}min ${segundos}s` : `${segundos} segundos`;

  containerModal.innerHTML = `
    <div class="modal-backdrop" style="background: rgba(22, 24, 28, 0.8);">
      <div class="modal-vitoria" role="dialog" aria-modal="true">
        <div class="vitoria-icone-grande">🎉</div>
        <h2 class="titulo-vitoria">Parabéns!</h2>
        <div class="subtitulo-vitoria">Você completou a <strong>Fase ${faseAtual}</strong> (${infoAtual.nome})!</div>

        <div class="resumo-partida">
          <div class="resumo-item">
            <span class="resumo-label">Tempo</span>
            <span class="resumo-valor">${tempoFormatado}</span>
          </div>
          <div class="resumo-item">
            <span class="resumo-label">Dicas</span>
            <span class="resumo-valor">${dicasUsadas === 0 ? 'Nenhuma ⭐' : dicasUsadas}</span>
          </div>
        </div>

        ${!ehUltimaFase ? `
          <div class="caixa-proxima-fase">
            <div class="proxima-tag">PRÓXIMA FASE NA ESTEIRA</div>
            <div class="proxima-titulo">${infoProxima.icone} Fase ${proximaFase}: ${infoProxima.nome}</div>
            <div class="proxima-detalhe">Direções: ${infoProxima.direcoesTexto}</div>
          </div>

          <button id="btn-avancar-fase" class="btn-jogar-outra">
            Avançar para a Fase ${proximaFase} ➔
          </button>
        ` : `
          <div class="caixa-proxima-fase">
            <div class="proxima-tag">CONQUISTA MÁXIMA</div>
            <div class="proxima-titulo">👑 Você completou todas as 12 fases!</div>
          </div>
        `}

        <button id="btn-repetir-fase" class="btn-dialogo secundario" style="width: 100%; min-height: 52px; font-size: 16px;">
          Jogar outra partida nesta fase
        </button>
      </div>
    </div>
  `;
  containerModal.style.display = 'flex';

  const btnAvancar = containerModal.querySelector('#btn-avancar-fase');
  if (btnAvancar) {
    btnAvancar.addEventListener('click', () => {
      containerModal.style.display = 'none';
      containerModal.innerHTML = '';
      if (onAvancarFase) onAvancarFase(proximaFase);
    });
  }

  const btnRepetir = containerModal.querySelector('#btn-repetir-fase');
  if (btnRepetir) {
    btnRepetir.addEventListener('click', () => {
      containerModal.style.display = 'none';
      containerModal.innerHTML = '';
      if (onJogarNovamente) onJogarNovamente(faseAtual);
    });
  }
}
