// src/ui/render.js
// Renderização do DOM e desenho de cápsulas SVG em alta fidelidade (§5.1, §9.3, §9.4).

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
      <!-- 1. Barra Superior -->
      <header class="barra-topo">
        <button id="btn-sair" class="btn-topo" aria-label="Sair do jogo" title="Sair do jogo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>SAIR</span>
        </button>

        <div class="acoes-topo">
          <button id="btn-instrucoes" class="btn-topo icone-apenas" aria-label="Instruções e Como Jogar" title="Como Jogar">
            <span style="font-size: 19px; font-weight: 800;">?</span>
          </button>
          <button id="btn-som" class="btn-topo icone-apenas" aria-label="Alternar som" title="Ligar/Desligar Som">
            <span id="icone-som" style="font-size: 18px;">🔊</span>
          </button>
          <button id="btn-ajustes" class="btn-topo icone-apenas" aria-label="Ajustes do Cuidador" title="Ajustes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </header>

      <!-- 2. Container da Esteira de Fases -->
      <div id="container-esteira" class="container-esteira"></div>

      <!-- 3. Informações de Tema e Dica Rápida -->
      <div class="barra-info-partida">
        <div id="rotulo-tema" class="rotulo-tema">TEMA: CARREGANDO...</div>
        <div id="dica-rapida" class="dica-rapida">Toque ou arraste do início ao fim da palavra</div>
      </div>

      <!-- 4. Área do Tabuleiro -->
      <div class="area-tabuleiro-central">
        <div id="container-grade" class="container-grade">
          <svg id="svg-capsulas" class="camada-capsulas"></svg>
          <div id="grid-letras" style="display: grid; width: 100%; height: 100%; position: relative; z-index: 2;"></div>
        </div>
      </div>

      <!-- 5. Contador e Barra de Progresso da Lista -->
      <div class="area-progresso-palavras">
        <div class="barra-progresso-texto">
          <span id="contador-palavras">Palavras: 0 de 8 encontradas</span>
          <span id="palavras-restantes-tag" class="tag-restantes">Faltam 8</span>
        </div>
        <div class="progresso-trilho">
          <div id="progresso-barra" class="progresso-preenchimento" style="width: 0%;"></div>
        </div>
      </div>

      <!-- 6. Lista de Palavras -->
      <div id="container-lista" class="container-lista"></div>

      <!-- 7. Barra Inferior de Botões de Ação -->
      <footer class="barra-botoes">
        <button id="btn-dica" class="btn-grande btn-dica" aria-label="Pedir dica">
          <svg viewBox="0 0 24 24">
            <path d="M9 18h6"></path>
            <path d="M10 22h4"></path>
            <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"></path>
          </svg>
          <div class="texto-btn-com-sub">
            <span>DICA</span>
            <small id="subtexto-dica">1º Toque: 1ª Letra</small>
          </div>
        </button>
        <button id="btn-novo" class="btn-grande btn-novo" aria-label="Novo jogo">
          <svg viewBox="0 0 24 24">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          <span>JOGO NOVO</span>
        </button>
      </footer>

      <!-- Toast de Notificação Suave -->
      <div id="toast-notificacao" class="toast-notificacao" style="display: none;"></div>

      <!-- Camada de Modais -->
      <div id="camada-modal" style="display: none;"></div>
    </div>
  `;

  return {
    btnSair: document.getElementById('btn-sair'),
    btnInstrucoes: document.getElementById('btn-instrucoes'),
    btnSom: document.getElementById('btn-som'),
    iconeSom: document.getElementById('icone-som'),
    btnAjustes: document.getElementById('btn-ajustes'),
    containerEsteira: document.getElementById('container-esteira'),
    rotuloTema: document.getElementById('rotulo-tema'),
    dicaRapida: document.getElementById('dica-rapida'),
    containerGrade: document.getElementById('container-grade'),
    svgCapsulas: document.getElementById('svg-capsulas'),
    gridLetras: document.getElementById('grid-letras'),
    contadorPalavras: document.getElementById('contador-palavras'),
    palavrasRestantesTag: document.getElementById('palavras-restantes-tag'),
    progressoBarra: document.getElementById('progresso-barra'),
    containerLista: document.getElementById('container-lista'),
    btnDica: document.getElementById('btn-dica'),
    subtextoDica: document.getElementById('subtexto-dica'),
    btnNovo: document.getElementById('btn-novo'),
    toastNotificacao: document.getElementById('toast-notificacao'),
    camadaModal: document.getElementById('camada-modal')
  };
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

  gridLetras.innerHTML = '';
  for (let l = 0; l < n; l++) {
    for (let c = 0; c < n; c++) {
      const div = document.createElement('div');
      div.id = `cel-${l}-${c}`;
      div.className = 'celula-letra';
      div.style.fontSize = `${tamanhoLetraCelula}px`;
      div.textContent = grade[l][c];
      gridLetras.appendChild(div);
    }
  }
}

// Converte coordenadas de linha e coluna no centro (x, y) em px dentro do SVG
export function calcularCentroCelula(l, c, configLayout) {
  const { celula, vao, n, tamanhoGrade } = configLayout;
  const padding = (tamanhoGrade - (n * celula + (n - 1) * vao)) / 2;
  const x = padding + c * (celula + vao) + celula / 2;
  const y = padding + l * (celula + vao) + celula / 2;
  return { x, y, raio: celula / 2 };
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

// Renderiza a lista de palavras com status e visualização clara
export function renderizarLista(elementos, palavras, encontradasSet, palavraMarcada, onCliquePalavra) {
  const { containerLista, contadorPalavras, palavrasRestantesTag, progressoBarra } = elementos;

  const total = palavras.length;
  const encontradasQtd = encontradasSet.size;
  const restantes = total - encontradasQtd;
  const porcentagem = total > 0 ? Math.round((encontradasQtd / total) * 100) : 0;

  if (contadorPalavras) {
    contadorPalavras.textContent = `Palavras: ${encontradasQtd} de ${total} encontradas`;
  }
  if (palavrasRestantesTag) {
    palavrasRestantesTag.textContent = restantes === 0 ? 'Fase Completa! ⭐' : `Faltam ${restantes}`;
    if (restantes === 0) {
      palavrasRestantesTag.classList.add('completo');
    } else {
      palavrasRestantesTag.classList.remove('completo');
    }
  }
  if (progressoBarra) {
    progressoBarra.style.width = `${porcentagem}%`;
  }

  containerLista.innerHTML = '';
  for (const p of palavras) {
    const textoNorm = typeof p === 'string' ? p : p.n;
    const grafia = typeof p === 'string' ? p : p.t;
    const foiEncontrada = encontradasSet.has(textoNorm);

    const btn = document.createElement('div');
    btn.className = 'item-palavra';
    if (foiEncontrada) {
      btn.classList.add('encontrada');
      btn.innerHTML = `<span>${grafia}</span> <span class="check-encontrada">✓</span>`;
    } else {
      if (palavraMarcada === textoNorm) btn.classList.add('marcada');
      btn.textContent = grafia;
    }

    btn.dataset.palavra = textoNorm;

    if (!foiEncontrada) {
      btn.addEventListener('click', () => onCliquePalavra(textoNorm));
    }

    containerLista.appendChild(btn);
  }
}

// Exibe um toast suave de aviso/conquista temporário
let timerToast = null;
export function exibirToast(elToast, mensagem, duracao = 2000) {
  if (!elToast) return;
  elToast.textContent = mensagem;
  elToast.style.display = 'block';
  elToast.classList.remove('ocultando');

  if (timerToast) clearTimeout(timerToast);
  timerToast = setTimeout(() => {
    elToast.classList.add('ocultando');
    setTimeout(() => {
      elToast.style.display = 'none';
      elToast.classList.remove('ocultando');
    }, 300);
  }, duracao);
}
