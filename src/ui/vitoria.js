// src/ui/vitoria.js
// Comemoração e tela de vitória com acendimento em onda, confete em CSS e botão gigante (§9.7).

export function exibirVitoria(containerModal, { onJogarOutra }) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(200); } catch {}
  }

  containerModal.innerHTML = `
    <div class="modal-backdrop" style="background: rgba(22, 24, 28, 0.75);">
      <div class="modal-vitoria" role="dialog" aria-modal="true">
        <div style="font-size: 48px; line-height: 1;">🌟</div>
        <h2 class="titulo-vitoria">Parabéns!</h2>
        <p class="mensagem-vitoria">Você encontrou todas as palavras!</p>
        <button id="btn-jogar-outra" class="btn-jogar-outra">Jogar Outra</button>
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
