// src/ui/ajustes.js
// Modal da engrenagem para o cuidador (§5.4).
// Permite ajustar tamanho de fonte, nível da escada e exibe total de partidas concluídas.

export function abrirModalAjustes(containerModal, { estadoEscada, ajustes, partidasConcluidas, onSalvarAjustes, onMudarNivel }) {
  const deltaAtual = ajustes.deltaFontePx || 0;
  const ajusteNivelAtual = estadoEscada.ajusteManual || 0;
  const nivelEfetivo = Math.max(1, Math.min(12, estadoEscada.nivel + ajusteNivelAtual));

  containerModal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialogo" role="dialog" aria-modal="true" style="text-align: left;">
        <h2 style="text-align: center; margin-bottom: 8px;">Configurações (Cuidador)</h2>

        <div style="background: #f0ebe0; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px;">
          <div style="font-size: 14px; color: var(--cor-tema); text-transform: uppercase;">Partidas Concluídas</div>
          <div style="font-size: 26px; font-weight: 700; color: var(--cor-tinta);">${partidasConcluidas}</div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Tamanho das Letras:</div>
          <div style="display: flex; gap: 8px;">
            <button id="btn-fonte-menor" class="btn-dialogo secundario" style="flex: 1; min-height: 48px; font-size: 16px;">Menores (-3px)</button>
            <button id="btn-fonte-padrao" class="btn-dialogo secundario" style="flex: 1; min-height: 48px; font-size: 16px;">Padrão</button>
            <button id="btn-fonte-maior" class="btn-dialogo secundario" style="flex: 1; min-height: 48px; font-size: 16px;">Maiores (+3px)</button>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Dificuldade (Nível ${nivelEfetivo} de 12):</div>
          <div style="display: flex; gap: 8px;">
            <button id="btn-nivel-facil" class="btn-dialogo secundario" style="flex: 1; min-height: 48px; font-size: 15px;">Mais Fácil (-1)</button>
            <button id="btn-nivel-dificil" class="btn-dialogo secundario" style="flex: 1; min-height: 48px; font-size: 15px;">Mais Difícil (+1)</button>
          </div>
        </div>

        <button id="btn-fechar-ajustes" class="btn-dialogo seguro" style="width: 100%; min-height: 64px;">Voltar ao Jogo</button>
      </div>
    </div>
  `;
  containerModal.style.display = 'flex';

  containerModal.querySelector('#btn-fonte-menor').addEventListener('click', () => {
    onSalvarAjustes({ deltaFontePx: -3 });
    abrirModalAjustes(containerModal, { estadoEscada, ajustes: { deltaFontePx: -3 }, partidasConcluidas, onSalvarAjustes, onMudarNivel });
  });

  containerModal.querySelector('#btn-fonte-padrao').addEventListener('click', () => {
    onSalvarAjustes({ deltaFontePx: 0 });
    abrirModalAjustes(containerModal, { estadoEscada, ajustes: { deltaFontePx: 0 }, partidasConcluidas, onSalvarAjustes, onMudarNivel });
  });

  containerModal.querySelector('#btn-fonte-maior').addEventListener('click', () => {
    onSalvarAjustes({ deltaFontePx: 3 });
    abrirModalAjustes(containerModal, { estadoEscada, ajustes: { deltaFontePx: 3 }, partidasConcluidas, onSalvarAjustes, onMudarNivel });
  });

  containerModal.querySelector('#btn-nivel-facil').addEventListener('click', () => {
    onMudarNivel(-1);
    const novoAjuste = ajusteNivelAtual - 1;
    abrirModalAjustes(containerModal, { estadoEscada: { ...estadoEscada, ajusteManual: novoAjuste }, ajustes, partidasConcluidas, onSalvarAjustes, onMudarNivel });
  });

  containerModal.querySelector('#btn-nivel-dificil').addEventListener('click', () => {
    onMudarNivel(1);
    const novoAjuste = ajusteNivelAtual + 1;
    abrirModalAjustes(containerModal, { estadoEscada: { ...estadoEscada, ajusteManual: novoAjuste }, ajustes, partidasConcluidas, onSalvarAjustes, onMudarNivel });
  });

  containerModal.querySelector('#btn-fechar-ajustes').addEventListener('click', () => {
    containerModal.style.display = 'none';
    containerModal.innerHTML = '';
  });
}
