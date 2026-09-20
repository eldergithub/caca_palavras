// src/ui/instrucoes.js
// Modal ilustrado de instruções "Como Jogar" e orientações das palavras.

export function abrirModalInstrucoes(containerModal) {
  containerModal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialogo modal-instrucoes" role="dialog" aria-modal="true">
        <div class="modal-cabecalho" style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="./icons/icon.svg" alt="Caça-Palavras Logo" style="width: 34px; height: 34px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.12);" />
            <h2 style="margin: 0; font-size: 1.25rem;">Como Jogar</h2>
          </div>
          <button id="btn-fechar-instrucoes-x" class="btn-fechar-modal" aria-label="Fechar">✕</button>
        </div>

        <div class="conteudo-instrucoes">
          <!-- 1. Como Selecionar -->
          <div class="bloco-instrucao">
            <div class="icone-instrucao">👆</div>
            <div class="texto-instrucao">
              <strong>Como marcar as palavras:</strong>
              <p>Você pode <strong>arrastar o dedo</strong> da primeira letra até a última letra, ou simplesmente <strong>dar um toque na primeira letra e outro toque na última letra</strong>. A linha reta é calculada automaticamente com alta tolerância para mãos trêmulas!</p>
            </div>
          </div>

          <!-- 2. Direções -->
          <div class="bloco-instrucao">
            <div class="icone-instrucao">🧭</div>
            <div class="texto-instrucao">
              <strong>Onde as palavras estão escondidas:</strong>
              <p>As palavras podem estar na horizontal (→ ou ←), na vertical (↓ ou ↑) ou na diagonal (↘, ↗, etc.). As direções permitidas aumentam a cada fase da <strong>Esteira de Fases</strong>.</p>
            </div>
          </div>

          <!-- 3. Acentos e Português -->
          <div class="bloco-instrucao">
            <div class="icone-instrucao">✍️</div>
            <div class="texto-instrucao">
              <strong>Acentuação e Grafia:</strong>
              <p>No tabuleiro, as letras aparecem <strong>sem acento</strong> (como nos caça-palavras impressos tradicionais, evitando entregar as respostas). Na lista de palavras abaixo, todas estão com a acentuação correta da língua portuguesa.</p>
            </div>
          </div>

          <!-- 4. Foco na Palavra -->
          <div class="bloco-instrucao">
            <div class="icone-instrucao">🎯</div>
            <div class="texto-instrucao">
              <strong>Focar em uma palavra da lista:</strong>
              <p>Toque em qualquer palavra da lista para destacá-la em dourado. Assim você foca sua atenção nela e, se pedir ajuda, a dica será dada especificamente para ela.</p>
            </div>
          </div>

          <!-- 5. Como Funciona a Dica -->
          <div class="bloco-instrucao">
            <div class="icone-instrucao">💡</div>
            <div class="texto-instrucao">
              <strong>Como funciona o botão DICA:</strong>
              <p>As dicas são gentis e divididas em 3 toques:</p>
              <ul>
                <li><strong>1º toque:</strong> A 1ª letra da palavra pisca em dourado.</li>
                <li><strong>2º toque:</strong> Uma linha mostra o início e a direção.</li>
                <li><strong>3º toque:</strong> A palavra inteira é revelada e riscada.</li>
              </ul>
            </div>
          </div>

          <!-- 6. Esteira de Fases -->
          <div class="bloco-instrucao">
            <div class="icone-instrucao">🛤️</div>
            <div class="texto-instrucao">
              <strong>Esteira de Fases (1 a 12):</strong>
              <p>O jogo possui 12 fases com progressão inteligente. Cada fase concluída desbloqueia novos desafios linguísticos. Você pode tocar na esteira no topo a qualquer momento para ver o mapa das fases.</p>
            </div>
          </div>
        </div>

        <button id="btn-fechar-instrucoes" class="btn-dialogo seguro" style="width: 100%; margin-top: 16px;">
          Entendido, Vamos Jogar!
        </button>
      </div>
    </div>
  `;

  containerModal.style.display = 'flex';

  function fechar() {
    containerModal.style.display = 'none';
    containerModal.innerHTML = '';
  }

  containerModal.querySelector('#btn-fechar-instrucoes').addEventListener('click', fechar);
  containerModal.querySelector('#btn-fechar-instrucoes-x').addEventListener('click', fechar);
}
