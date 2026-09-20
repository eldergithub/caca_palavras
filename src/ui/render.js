// src/ui/render.js
// Renderização do DOM e desenho de cápsulas SVG (§5.1, §9.3, §9.4).
// Uma <div> por célula, reaproveitada por id.

export const CORES_CICLO = [
  '#a8e6a3', // Verde
  '#a9d4f5', // Azul
  '#ffd9a0', // Âmbar
  '#d8c0f0', // Violeta
  '#f5b9a8', // Terracota
];

export function obterCorCiclo(indice) {
  return CORES_CICLO[indice % CORES_CICLO.length];
}

export function criarEstruturaUI(containerApp) {
  containerApp.innerHTML = `
    <div class="cartao-jogo">
      <header class="barra-topo">
        <button id="btn-sair" class="btn-topo" aria-label="Sair do jogo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>SAIR</span>
        </button>
        <button id="btn-ajustes" class="btn-topo icone-apenas" aria-label="Ajustes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </header>

      <div class="area-tabuleiro-central">
        <div id="container-grade" class="container-grade">
          <svg id="svg-capsulas" class="camada-capsulas"></svg>
          <div id="grid-letras" class="grid-letras"></div>
        </div>
      </div>

      <!-- Em retrato este bloco é transparente (display: contents);
           em paisagem ele vira a coluna ao lado da grade (§5.1) -->
      <div class="coluna-lateral">
      <div id="rotulo-tema" class="rotulo-tema"></div>

      <div id="container-lista" class="container-lista"></div>

      <footer class="barra-botoes">
        <button id="btn-dica" class="btn-grande" aria-label="Pedir dica">
          <svg viewBox="0 0 24 24">
            <path d="M9 18h6"></path>
            <path d="M10 22h4"></path>
            <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"></path>
          </svg>
          <span>DICA</span>
        </button>
        <button id="btn-novo" class="btn-grande" aria-label="Novo jogo">
          <svg viewBox="0 0 24 24">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          <span>JOGO NOVO</span>
        </button>
      </footer>
      </div>

      <div id="camada-modal" style="display: none;"></div>
    </div>
  `;

  return {
    btnSair: document.getElementById('btn-sair'),
    btnAjustes: document.getElementById('btn-ajustes'),
    containerGrade: document.getElementById('container-grade'),
    svgCapsulas: document.getElementById('svg-capsulas'),
    gridLetras: document.getElementById('grid-letras'),
    rotuloTema: document.getElementById('rotulo-tema'),
    containerLista: document.getElementById('container-lista'),
    btnDica: document.getElementById('btn-dica'),
    btnNovo: document.getElementById('btn-novo'),
    camadaModal: document.getElementById('camada-modal'),
  };
}

// Aplica as medidas calculadas em §5.2 nos elementos que dependem delas
export function aplicarMedidas(elementos, configLayout) {
  const { containerLista, rotuloTema } = elementos;
  containerLista.style.fontSize = `${configLayout.tamanhoFonteLista}px`;
  containerLista.style.setProperty('--altura-linha-lista', `${configLayout.alturaLinhaLista}px`);
  rotuloTema.style.display = configLayout.exibirTema ? 'flex' : 'none';
  rotuloTema.style.height = `${configLayout.alturaTema}px`;
  // O respiro calculado em §5.2 é o total; o cartão tem no máximo 4 vãos.
  document.documentElement.style.setProperty('--respiro', `${Math.floor(configLayout.respiro / 4)}px`);
}

// Configura e renderiza o grid da grade
export function renderizarGrade(elementos, grade, configLayout) {
  const { n, celula, vao, tamanhoGrade, tamanhoLetraCelula } = configLayout;
  const { containerGrade, gridLetras, svgCapsulas } = elementos;

  containerGrade.style.width = `${tamanhoGrade}px`;
  containerGrade.style.height = `${tamanhoGrade}px`;

  gridLetras.style.gridTemplateColumns = `repeat(${n}, ${celula}px)`;
  gridLetras.style.gridTemplateRows = `repeat(${n}, ${celula}px)`;
  gridLetras.style.gap = `${vao}px`;

  svgCapsulas.setAttribute('viewBox', `0 0 ${tamanhoGrade} ${tamanhoGrade}`);

  // Reaproveita as <div> existentes quando a grade não mudou de tamanho
  const precisaRecriar = gridLetras.children.length !== n * n;
  if (precisaRecriar) gridLetras.innerHTML = '';

  for (let l = 0; l < n; l++) {
    for (let c = 0; c < n; c++) {
      let div = precisaRecriar ? null : document.getElementById(`cel-${l}-${c}`);
      if (!div) {
        div = document.createElement('div');
        div.id = `cel-${l}-${c}`;
        div.className = 'celula-letra';
        gridLetras.appendChild(div);
      }
      div.classList.remove('dica-marcada');
      div.style.fontSize = `${tamanhoLetraCelula}px`;
      div.textContent = grade[l][c];
    }
  }
}

// Converte coordenadas de linha e coluna no centro (x, y) em px dentro do SVG
export function calcularCentroCelula(l, c, configLayout) {
  const { celula, vao } = configLayout;
  return {
    x: c * (celula + vao) + celula / 2,
    y: l * (celula + vao) + celula / 2,
    raio: celula / 2,
  };
}

// Cria elemento SVG de cápsula para um segmento de células
export function desenharCapsulaSVG(svgContainer, segmento, cor, id = null, configLayout) {
  if (!segmento || segmento.length === 0) return null;

  const inicio = calcularCentroCelula(segmento[0].l, segmento[0].c, configLayout);
  const fim = calcularCentroCelula(segmento[segmento.length - 1].l, segmento[segmento.length - 1].c, configLayout);
  const larguraTraco = configLayout.celula - 2;

  let el;
  if (segmento.length === 1) {
    el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    el.setAttribute('cx', inicio.x);
    el.setAttribute('cy', inicio.y);
    el.setAttribute('r', larguraTraco / 2);
    el.setAttribute('fill', cor);
  } else {
    el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    el.setAttribute('x1', inicio.x);
    el.setAttribute('y1', inicio.y);
    el.setAttribute('x2', fim.x);
    el.setAttribute('y2', fim.y);
    el.setAttribute('stroke', cor);
    el.setAttribute('stroke-width', larguraTraco);
    el.setAttribute('stroke-linecap', 'round');
  }

  if (id) el.id = id;
  svgContainer.appendChild(el);
  return el;
}

// Renderiza a lista de palavras em 2 colunas, sem rolagem (§5.3)
// Encontrada = riscada e apagada. Tocável para marcar "é esta que eu procuro" (§5.6)
export function renderizarLista(containerLista, palavras, encontradasSet, palavraMarcada, onCliquePalavra) {
  containerLista.innerHTML = '';
  for (const p of palavras) {
    const textoNorm = typeof p === 'string' ? p : p.n;
    const grafia = typeof p === 'string' ? p : p.t;
    const foiEncontrada = encontradasSet.has(textoNorm);

    const item = document.createElement('div');
    item.className = 'item-palavra';
    if (foiEncontrada) item.classList.add('encontrada');
    if (palavraMarcada === textoNorm && !foiEncontrada) item.classList.add('marcada');

    item.textContent = grafia;
    item.dataset.palavra = textoNorm;

    if (!foiEncontrada) {
      item.addEventListener('click', () => onCliquePalavra(textoNorm));
    }

    containerLista.appendChild(item);
  }
}
