// src/ui/dialogo.js
// Diálogos de confirmação com duas saídas por extenso (§1.1, item 8, §5.4).
// Saída segura primeiro e destacada em verde. Sem "OK/Cancelar", sem "X" no canto.

export function exibirDialogo(containerModal, { titulo, mensagem, textoSeguro, textoAcao, onSeguro, onAcao }) {
  containerModal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialogo" role="dialog" aria-modal="true">
        <h2>${titulo}</h2>
        ${mensagem ? `<p>${mensagem}</p>` : ''}
        <div class="botoes-dialogo">
          <button id="btn-dialogo-seguro" class="btn-dialogo seguro">${textoSeguro}</button>
          <button id="btn-dialogo-acao" class="btn-dialogo secundario">${textoAcao}</button>
        </div>
      </div>
    </div>
  `;
  containerModal.style.display = 'flex';

  const btnSeguro = containerModal.querySelector('#btn-dialogo-seguro');
  const btnAcao = containerModal.querySelector('#btn-dialogo-acao');

  function fechar() {
    containerModal.style.display = 'none';
    containerModal.innerHTML = '';
  }

  btnSeguro.addEventListener('click', () => {
    fechar();
    if (onSeguro) onSeguro();
  });

  btnAcao.addEventListener('click', () => {
    fechar();
    if (onAcao) onAcao();
  });
}

export function fecharDialogo(containerModal) {
  containerModal.style.display = 'none';
  containerModal.innerHTML = '';
}
