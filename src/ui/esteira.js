// src/ui/esteira.js
// Componente interativo da Esteira de Fases (1 a 12 níveis com progressão visual).

export const INFORMACOES_FASES = {
  1: {
    nome: 'Primeiros Passos',
    descricao: 'Palavras na horizontal e vertical tradicionais.',
    direcoesTexto: '→ e ↓',
    direcoesIds: ['L', 'S'],
    grade: '9×9',
    icone: '🌱'
  },
  2: {
    nome: 'Cruzamentos Iniciais',
    descricao: 'Palavras que compartilham letras na grade.',
    direcoesTexto: '→ e ↓ (com cruzamentos)',
    direcoesIds: ['L', 'S'],
    grade: '9×9',
    icone: '🌿'
  },
  3: {
    nome: 'Caminhos Inversos',
    descricao: 'Palavras invertidas (da direita para esquerda e de baixo para cima).',
    direcoesTexto: '→, ↓, ← e ↑',
    direcoesIds: ['L', 'S', 'O', 'N'],
    grade: '9×9',
    icone: '🔄'
  },
  4: {
    nome: 'Grade Expandida',
    descricao: 'Grade 10×10 com mais palavras e maior vocabulário.',
    direcoesTexto: '→, ↓, ← e ↑',
    direcoesIds: ['L', 'S', 'O', 'N'],
    grade: '10×10',
    icone: '📖'
  },
  5: {
    nome: 'Desafio Diagonal',
    descricao: 'Palavras em diagonais descendentes e ascendentes.',
    direcoesTexto: '→, ↓, ←, ↑ e diagonais ↘ ↗',
    direcoesIds: ['L', 'S', 'O', 'N', 'SE', 'NE'],
    grade: '10×10',
    icone: '⚡'
  },
  6: {
    nome: 'Vizinhança Lexical',
    descricao: 'Palavras com grafias parecidas para aguçar a percepção.',
    direcoesTexto: 'Reta e Diagonais',
    direcoesIds: ['L', 'S', 'O', 'N', 'SE', 'NE'],
    grade: '10×10',
    icone: '🔍'
  },
  7: {
    nome: 'Enchimento Esperto',
    descricao: 'Letras de enchimento formam começos falsos das palavras.',
    direcoesTexto: 'Reta e Diagonais',
    direcoesIds: ['L', 'S', 'O', 'N', 'SE', 'NE'],
    grade: '10×10',
    icone: '🧩'
  },
  8: {
    nome: 'Mestre das 8 Direções',
    descricao: 'Todas as 8 direções possíveis liberadas no tabuleiro!',
    direcoesTexto: 'Todas as 8 direções (→, ↓, ←, ↑, ↘, ↖, ↙, ↗)',
    direcoesIds: ['L', 'S', 'O', 'N', 'SE', 'NO', 'SO', 'NE'],
    grade: '10×10',
    icone: '🧭'
  },
  9: {
    nome: 'Desafio de Repertório',
    descricao: 'Vocabulário enriquecido com termos culturais e literários.',
    direcoesTexto: 'Todas as 8 direções',
    direcoesIds: ['L', 'S', 'O', 'N', 'SE', 'NO', 'SO', 'NE'],
    grade: '11×11',
    icone: '🏛️'
  },
  10: {
    nome: 'Linguista Experiente',
    descricao: 'Cruzamentos frequentes e palavras desafiadoras.',
    direcoesTexto: 'Todas as 8 direções',
    direcoesIds: ['L', 'S', 'O', 'N', 'SE', 'NO', 'SO', 'NE'],
    grade: '11×11',
    icone: '📚'
  },
  11: {
    nome: 'Mente Brilhante',
    descricao: 'Alta densidade de palavras e grande riqueza lexical.',
    direcoesTexto: 'Todas as 8 direções',
    direcoesIds: ['L', 'S', 'O', 'N', 'SE', 'NO', 'SO', 'NE'],
    grade: '11×11',
    icone: '💎'
  },
  12: {
    nome: 'Grande Mestre das Letras',
    descricao: 'O desafio supremo de caça-palavras para mestres da língua.',
    direcoesTexto: 'Todas as 8 direções',
    direcoesIds: ['L', 'S', 'O', 'N', 'SE', 'NO', 'SO', 'NE'],
    grade: '11×11',
    icone: '👑'
  }
};

export function renderizarEsteiraTopo(containerEsteira, { faseAtual, maxFaseDesbloqueada, onAbrirMapaFases }) {
  if (!containerEsteira) return;

  const info = INFORMACOES_FASES[faseAtual] || INFORMACOES_FASES[1];

  let nodesHtml = '';
  for (let i = 1; i <= 12; i++) {
    const isAtual = i === faseAtual;
    const isConcluida = i < faseAtual || i <= maxFaseDesbloqueada && i !== faseAtual;
    const isBloqueada = i > maxFaseDesbloqueada;

    let classeStatus = 'esteira-no';
    let icone = `${i}`;
    if (isAtual) {
      classeStatus += ' atual';
      icone = `⭐ ${i}`;
    } else if (isConcluida) {
      classeStatus += ' concluida';
      icone = `✓ ${i}`;
    } else if (isBloqueada) {
      classeStatus += ' bloqueada';
      icone = `🔒 ${i}`;
    }

    nodesHtml += `
      <div class="${classeStatus}" data-fase="${i}" title="Fase ${i}: ${INFORMACOES_FASES[i]?.nome}">
        <span class="no-rotulo">${icone}</span>
      </div>
    `;
  }

  containerEsteira.innerHTML = `
    <div class="esteira-wrapper" id="btn-esteira-topo" role="button" aria-label="Abrir esteira de fases">
      <div class="esteira-trilha">
        ${nodesHtml}
      </div>
      <div class="esteira-detalhes">
        <span class="fase-badge">${info.icone} FASE ${faseAtual}: ${info.nome}</span>
        <span class="fase-direcoes">Direções: <strong>${info.direcoesTexto}</strong></span>
      </div>
    </div>
  `;

  const btnWrapper = containerEsteira.querySelector('#btn-esteira-topo');
  if (btnWrapper && onAbrirMapaFases) {
    btnWrapper.addEventListener('click', onAbrirMapaFases);
  }

  // Rola suavemente para centralizar a fase atual na trilha
  const noAtual = containerEsteira.querySelector('.esteira-no.atual');
  const trilha = containerEsteira.querySelector('.esteira-trilha');
  if (noAtual && trilha) {
    setTimeout(() => {
      const offset = noAtual.offsetLeft - (trilha.clientWidth / 2) + (noAtual.clientWidth / 2);
      trilha.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
    }, 50);
  }
}

export function abrirModalEsteiraFases(containerModal, { faseAtual, maxFaseDesbloqueada, onSelecionarFase }) {
  let itensHtml = '';

  for (let i = 1; i <= 12; i++) {
    const info = INFORMACOES_FASES[i];
    const isAtual = i === faseAtual;
    const isDesbloqueada = i <= maxFaseDesbloqueada;
    const isConcluida = i < maxFaseDesbloqueada;

    itensHtml += `
      <div class="card-fase ${isAtual ? 'atual' : ''} ${!isDesbloqueada ? 'bloqueada' : ''}" data-fase="${i}">
        <div class="card-fase-topo">
          <div class="card-fase-num">${info.icone} Fase ${i}</div>
          <div class="card-fase-status">
            ${isAtual ? '<span class="tag-status atual">EM ANDAMENTO</span>' : ''}
            ${isConcluida ? '<span class="tag-status concluida">CONCLUÍDA ✓</span>' : ''}
            ${!isDesbloqueada ? '<span class="tag-status bloqueada">BLOQUEADA 🔒</span>' : ''}
          </div>
        </div>
        <div class="card-fase-nome">${info.nome}</div>
        <div class="card-fase-desc">${info.descricao}</div>
        <div class="card-fase-detalhes">
          <span>📐 Grade: ${info.grade}</span>
          <span>🧭 Direções: ${info.direcoesTexto}</span>
        </div>
        ${isDesbloqueada ? `
          <button class="btn-jogar-fase ${isAtual ? 'btn-jogar-atual' : ''}" data-fase="${i}">
            ${isAtual ? 'Continuar Jogando' : 'Jogar esta Fase'}
          </button>
        ` : ''}
      </div>
    `;
  }

  containerModal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialogo modal-esteira-completa" role="dialog" aria-modal="true">
        <div class="modal-cabecalho">
          <h2>🛤️ Esteira de Fases</h2>
          <button id="btn-fechar-esteira-x" class="btn-fechar-modal" aria-label="Fechar">✕</button>
        </div>
        <p class="modal-subtitulo">
          Avance pelas 12 fases do jogo. Cada fase introduz novas direções e desafios linguísticos preparados para exercitar a mente.
        </p>

        <div class="lista-cards-fases">
          ${itensHtml}
        </div>

        <button id="btn-fechar-esteira" class="btn-dialogo seguro" style="width: 100%; margin-top: 16px;">
          Voltar ao Jogo
        </button>
      </div>
    </div>
  `;

  containerModal.style.display = 'flex';

  function fechar() {
    containerModal.style.display = 'none';
    containerModal.innerHTML = '';
  }

  containerModal.querySelector('#btn-fechar-esteira').addEventListener('click', fechar);
  containerModal.querySelector('#btn-fechar-esteira-x').addEventListener('click', fechar);

  containerModal.querySelectorAll('.btn-jogar-fase').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const faseEscolhida = parseInt(btn.dataset.fase, 10);
      fechar();
      if (onSelecionarFase) {
        onSelecionarFase(faseEscolhida);
      }
    });
  });
}
