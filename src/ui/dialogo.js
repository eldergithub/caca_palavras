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

export function exibirTelaSaida(containerModal, onVoltar) {
  containerModal.innerHTML = `
    <div class="modal-backdrop" style="background: rgba(18, 20, 24, 0.94);">
      <div class="modal-dialogo" role="dialog" aria-modal="true" style="text-align: center; max-width: 380px;">
        <div style="font-size: 54px; margin-bottom: 4px;">👋</div>
        <h2 style="font-size: 24px; color: var(--cor-tinta);">Até Logo!</h2>
        <p style="font-size: 16px; color: #4a453e; line-height: 1.5; margin: 8px 0 16px 0;">
          Sua partida está <strong>salva com segurança</strong>.<br>
          Você já pode fechar esta aba no navegador ou pressionar o botão Início do aparelho.
        </p>
        <button id="btn-retornar-ao-jogo" class="btn-dialogo seguro" style="width: 100%; min-height: 60px;">
          Voltar ao Jogo
        </button>
      </div>
    </div>
  `;
  containerModal.style.display = 'flex';

  const btnVoltar = containerModal.querySelector('#btn-retornar-ao-jogo');
  btnVoltar.addEventListener('click', () => {
    containerModal.style.display = 'none';
    containerModal.innerHTML = '';
    if (onVoltar) onVoltar();
  });
}

export function fecharDialogo(containerModal) {
  containerModal.style.display = 'none';
  containerModal.innerHTML = '';
}
