// src/ui/vitoria.js
// Comemoração: cápsulas acendem em onda, confete em CSS e botão gigante (§9.7).
// Sem tempo, sem dicas, sem placar — nada que ela leia como avaliação (§5.5, §8).

const QTD_CONFETE = 18;

export function exibirVitoria(containerModal, { onJogarOutra, aoAcenderOnda }) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(200); } catch {}
  }

  // Onda de acendimento da primeira à última palavra encontrada (§9.7)
  if (aoAcenderOnda) aoAcenderOnda();

  const semMovimento = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let confete = '';
  if (!semMovimento) {
    for (let i = 0; i < QTD_CONFETE; i++) {
      const esquerda = Math.round((i / QTD_CONFETE) * 100);
      const atraso = (i % 6) * 0.18;
      const giro = (i % 2 === 0 ? 1 : -1) * (180 + i * 12);
      confete += `<span class="confete confete-${i % 5}" style="left:${esquerda}%;animation-delay:${atraso}s;--giro:${giro}deg"></span>`;
    }
  }

  containerModal.innerHTML = `
    <div class="modal-backdrop">
      <div class="camada-confete" aria-hidden="true">${confete}</div>
      <div class="modal-vitoria" role="dialog" aria-modal="true">
        <h2 class="titulo-vitoria">Parabéns!</h2>
        <p class="mensagem-vitoria">Você encontrou todas as palavras.</p>
        <button id="btn-jogar-outra" class="btn-jogar-outra">Jogar outra</button>
      </div>
    </div>
  `;
  containerModal.style.display = 'flex';

  const btnJogar = containerModal.querySelector('#btn-jogar-outra');
  btnJogar.addEventListener('click', () => {
    containerModal.style.display = 'none';
    containerModal.innerHTML = '';
    if (onJogarOutra) onJogarOutra();
  });
}
