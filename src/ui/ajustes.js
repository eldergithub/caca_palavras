// src/ui/ajustes.js
// Engrenagem do cuidador (§5.4): exatamente dois itens, o número de partidas
// concluídas, e um botão enorme "Voltar ao jogo". Nada destrutivo aqui dentro.

const AJUSTE_CELULA_PX = 3; // move o piso de célula em ±3 px (§5.4)

export function abrirModalAjustes(containerModal, contexto) {
  const { obterEstado, onMudarCelula, onMudarNivel, onFechar } = contexto;

  function desenhar() {
    const { deltaCelulaPx, nivelEfetivo, partidasConcluidas } = obterEstado();

    containerModal.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-dialogo modal-ajustes" role="dialog" aria-modal="true">
          <h2>Ajustes</h2>

          <div class="ajuste-bloco">
            <div class="ajuste-rotulo">Tamanho das letras</div>
            <div class="ajuste-botoes">
              <button id="btn-letras-menores" class="btn-ajuste" ${deltaCelulaPx <= -AJUSTE_CELULA_PX ? 'disabled' : ''}>Menores</button>
              <button id="btn-letras-maiores" class="btn-ajuste" ${deltaCelulaPx >= AJUSTE_CELULA_PX ? 'disabled' : ''}>Maiores</button>
            </div>
          </div>

          <div class="ajuste-bloco">
            <div class="ajuste-rotulo">Jogo <span class="ajuste-valor">(nível ${nivelEfetivo} de 12)</span></div>
            <div class="ajuste-botoes">
              <button id="btn-mais-facil" class="btn-ajuste" ${nivelEfetivo <= 1 ? 'disabled' : ''}>Mais fácil</button>
              <button id="btn-mais-dificil" class="btn-ajuste" ${nivelEfetivo >= 12 ? 'disabled' : ''}>Mais difícil</button>
            </div>
            <div class="ajuste-nota">Vale a partir da próxima partida.</div>
          </div>

          <div class="ajuste-contador">
            Partidas concluídas: <strong>${partidasConcluidas}</strong>
          </div>

          <button id="btn-fechar-ajustes" class="btn-dialogo seguro">Voltar ao jogo</button>
        </div>
      </div>
    `;

    containerModal.style.display = 'flex';

    const liga = (id, acao) => {
      const el = containerModal.querySelector(id);
      if (el && !el.disabled) el.addEventListener('click', acao);
    };

    liga('#btn-letras-menores', () => { onMudarCelula(-AJUSTE_CELULA_PX); desenhar(); });
    liga('#btn-letras-maiores', () => { onMudarCelula(+AJUSTE_CELULA_PX); desenhar(); });
    liga('#btn-mais-facil', () => { onMudarNivel(-1); desenhar(); });
    liga('#btn-mais-dificil', () => { onMudarNivel(+1); desenhar(); });

    containerModal.querySelector('#btn-fechar-ajustes').addEventListener('click', () => {
      containerModal.style.display = 'none';
      containerModal.innerHTML = '';
      if (onFechar) onFechar();
    });
  }

  desenhar();
}
