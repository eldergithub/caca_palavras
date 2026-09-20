// src/core/dificuldade.js
// Cálculo da pontuação de dificuldade D e parâmetros dos 12 níveis (§6.2, §6.4).
// ZERO dependências de DOM — roda no Node e no navegador.

import { obterAbstracaoTema } from './banco.js';

export const DIRECOES = [
  { id: 'L',  dl:  0, dc:  1, tipo: 'reta' },      // →
  { id: 'O',  dl:  0, dc: -1, tipo: 'invertida' }, // ←
  { id: 'S',  dl:  1, dc:  0, tipo: 'reta' },      // ↓
  { id: 'N',  dl: -1, dc:  0, tipo: 'invertida' }, // ↑
  { id: 'SE', dl:  1, dc:  1, tipo: 'diagonal' },  // ↘
  { id: 'NO', dl: -1, dc: -1, tipo: 'diagonal' },  // ↖
  { id: 'SO', dl:  1, dc: -1, tipo: 'diagonal' },  // ↙
  { id: 'NE', dl: -1, dc:  1, tipo: 'diagonal' },  // ↗
];

export const MAPA_DIRECOES = Object.fromEntries(DIRECOES.map(d => [d.id, d]));

export const PARAMETROS_NIVEIS = {
  1: {
    nPadrao: 9, qtdPalavras: 8, tamMin: 5, tamMax: 8,
    direcoes: ['L', 'S'],
    metaCruzamentos: 0.0, enchimento: 'uniforme', lexicoMin: 1, lexicoMax: 1,
    faixaD: [0, 18], vizinhasPares: 0, medianaSegundos: 120
  },
  2: {
    nPadrao: 9, qtdPalavras: 8, tamMin: 5, tamMax: 8,
    direcoes: ['L', 'S'],
    metaCruzamentos: 0.10, enchimento: 'uniforme', lexicoMin: 1, lexicoMax: 1,
    faixaD: [8, 24], vizinhasPares: 0, medianaSegundos: 140
  },
  3: {
    nPadrao: 9, qtdPalavras: 8, tamMin: 4, tamMax: 8,
    direcoes: ['L', 'S', 'O', 'N'],
    metaCruzamentos: 0.15, enchimento: 'frequencia', lexicoMin: 1, lexicoMax: 1,
    faixaD: [15, 32], vizinhasPares: 0, medianaSegundos: 160
  },
  4: {
    nPadrao: 10, qtdPalavras: 9, tamMin: 4, tamMax: 8,
    direcoes: ['L', 'S', 'O', 'N'],
    metaCruzamentos: 0.20, enchimento: 'frequencia', lexicoMin: 1, lexicoMax: 2,
    faixaD: [22, 40], vizinhasPares: 0, medianaSegundos: 180
  },
  5: {
    nPadrao: 10, qtdPalavras: 9, tamMin: 4, tamMax: 8,
    direcoes: ['L', 'S', 'O', 'N', 'SE', 'NE'],
    metaCruzamentos: 0.25, enchimento: 'frequencia', lexicoMin: 1, lexicoMax: 2,
    faixaD: [30, 48], vizinhasPares: 1, medianaSegundos: 210
  },
  6: {
    nPadrao: 10, qtdPalavras: 9, tamMin: 4, tamMax: 8,
    direcoes: ['L', 'S', 'O', 'N', 'SE', 'NE'],
    metaCruzamentos: 0.30, enchimento: 'frequencia', lexicoMin: 1, lexicoMax: 2,
    faixaD: [38, 56], vizinhasPares: 1, medianaSegundos: 240
  },
  7: {
    nPadrao: 10, qtdPalavras: 10, tamMin: 4, tamMax: 7,
    direcoes: ['L', 'S', 'O', 'N', 'SE', 'NE'],
    metaCruzamentos: 0.35, enchimento: 'adversario_leve', lexicoMin: 2, lexicoMax: 2,
    faixaD: [45, 64], vizinhasPares: 1, medianaSegundos: 270
  },
  8: {
    nPadrao: 10, qtdPalavras: 10, tamMin: 4, tamMax: 7,
    direcoes: ['L', 'S', 'O', 'N', 'SE', 'NO', 'SO', 'NE'],
    metaCruzamentos: 0.40, enchimento: 'adversario_leve', lexicoMin: 2, lexicoMax: 2,
    faixaD: [52, 70], vizinhasPares: 1, medianaSegundos: 300
  },
  9: {
    nPadrao: 11, qtdPalavras: 10, tamMin: 4, tamMax: 7,
    direcoes: ['L', 'S', 'O', 'N', 'SE', 'NO', 'SO', 'NE'],
    metaCruzamentos: 0.45, enchimento: 'adversario', lexicoMin: 2, lexicoMax: 3,
    faixaD: [59, 78], vizinhasPares: 2, medianaSegundos: 330
  },
  10: {
    nPadrao: 11, qtdPalavras: 10, tamMin: 4, tamMax: 6,
    direcoes: ['L', 'S', 'O', 'N', 'SE', 'NO', 'SO', 'NE'],
    metaCruzamentos: 0.50, enchimento: 'adversario', lexicoMin: 3, lexicoMax: 3,
    faixaD: [66, 85], vizinhasPares: 2, medianaSegundos: 360
  },
  11: {
    nPadrao: 11, qtdPalavras: 10, tamMin: 4, tamMax: 6,
    direcoes: ['L', 'S', 'O', 'N', 'SE', 'NO', 'SO', 'NE'],
    metaCruzamentos: 0.55, enchimento: 'adversario', lexicoMin: 3, lexicoMax: 3,
    faixaD: [73, 92], vizinhasPares: 2, medianaSegundos: 400
  },
  12: {
    nPadrao: 11, qtdPalavras: 10, tamMin: 4, tamMax: 6,
    direcoes: ['L', 'S', 'O', 'N', 'SE', 'NO', 'SO', 'NE'],
    metaCruzamentos: 0.60, enchimento: 'adversario', lexicoMin: 3, lexicoMax: 3,
    faixaD: [80, 100], vizinhasPares: 2, medianaSegundos: 450
  }
};

export function obterParametrosNivel(nivel, nMax = 11) {
  const nClamped = Math.max(1, Math.min(12, nivel));
  const cfg = PARAMETROS_NIVEIS[nClamped];
  const nFinal = Math.max(8, Math.min(cfg.nPadrao, nMax));
  return { ...cfg, n: nFinal, nivel: nClamped };
}

// Calcula a pontuação D de um tabuleiro pronto (§6.4)
export function calcularDificuldade(tabuleiro) {
  const { grade, palavrasColocadas, tema, n, paresVizinhasPresentes = 0 } = tabuleiro;
  const totalPalavras = palavrasColocadas.length;
  if (totalPalavras === 0) return { D: 0, fatores: {} };

  // 1. f_dir: direções distintas ponderadas
  const pesosPorTipo = { reta: 0.3, invertida: 0.7, diagonal: 1.0 };
  const dirsUsadas = new Set(palavrasColocadas.map(p => p.dirId));
  let somaPesos = 0;
  for (const dirId of dirsUsadas) {
    const d = MAPA_DIRECOES[dirId];
    somaPesos += pesosPorTipo[d?.tipo || 'reta'];
  }
  // Normalizado entre 0 e 1 (soma máxima de 8 direções: 2*0.3 + 2*0.7 + 4*1.0 = 6.0)
  const f_dir = Math.min(1.0, Math.max(0, (somaPesos - 0.3) / (6.0 - 0.3)));

  // 2. f_cruz: fração de palavras compartilhando ao menos uma célula
  const mapaUso = new Map(); // "l,c" -> contagem
  for (const p of palavrasColocadas) {
    for (const cel of p.celulas) {
      const chave = `${cel.l},${cel.c}`;
      mapaUso.set(chave, (mapaUso.get(chave) || 0) + 1);
    }
  }

  let palavrasComCruzamento = 0;
  for (const p of palavrasColocadas) {
    const cruzou = p.celulas.some(cel => (mapaUso.get(`${cel.l},${cel.c}`) || 0) > 1);
    if (cruzou) palavrasComCruzamento++;
  }
  const f_cruz = palavrasComCruzamento / totalPalavras;

  // 3. f_curtas: fração de palavras com <= 5 letras
  const curtas = palavrasColocadas.filter(p => p.texto.length <= 5).length;
  const f_curtas = curtas / totalPalavras;

  // 4. f_vizinhas: pares presentes / 2, max 1.0
  const f_vizinhas = Math.min(1.0, paresVizinhasPresentes / 2);

  // 5. f_tema: nível de abstração da categoria 0..1
  const f_tema = obterAbstracaoTema(tema);

  // 6. f_qtd: (palavras - 8) / 2
  const f_qtd = Math.max(0, Math.min(1.0, (totalPalavras - 8) / 2));

  // 7. f_grade: (n - 9) / 5 limitado a 0..1
  const f_grade = Math.max(0, Math.min(1.0, (n - 9) / 5));

  // 8. f_ench: fração de células de enchimento que formam começo falso de >= 2 letras
  const setCelulasPalavras = new Set();
  for (const p of palavrasColocadas) {
    for (const cel of p.celulas) {
      setCelulasPalavras.add(`${cel.l},${cel.c}`);
    }
  }

  let totalCelulasEnchimento = 0;
  let enchimentoAdversario = 0;
  const prefixos2 = new Set();
  for (const p of palavrasColocadas) {
    if (p.texto.length >= 2) prefixos2.add(p.texto.slice(0, 2));
  }

  for (let l = 0; l < n; l++) {
    for (let c = 0; c < n; c++) {
      if (!setCelulasPalavras.has(`${l},${c}`)) {
        totalCelulasEnchimento++;
        // Checar se a partir de (l, c) forma 2 letras de algum prefixo em qualquer das 8 direções
        const letra1 = grade[l][c];
        let formouPrefixo = false;
        for (const dir of DIRECOES) {
          const l2 = l + dir.dl;
          const c2 = c + dir.dc;
          if (l2 >= 0 && l2 < n && c2 >= 0 && c2 < n) {
            const par = letra1 + grade[l2][c2];
            if (prefixos2.has(par)) {
              formouPrefixo = true;
              break;
            }
          }
        }
        if (formouPrefixo) enchimentoAdversario++;
      }
    }
  }

  const f_ench = totalCelulasEnchimento > 0 ? (enchimentoAdversario / totalCelulasEnchimento) : 0;

  // D = 12·f_dir + 20·f_ench + 18·f_curtas + 16·f_cruz + 12·f_vizinhas + 10·f_tema + 7·f_qtd + 5·f_grade
  const D = Math.round(
    12 * f_dir +
    20 * f_ench +
    18 * f_curtas +
    16 * f_cruz +
    12 * f_vizinhas +
    10 * f_tema +
     7 * f_qtd +
     5 * f_grade
  );

  return {
    D: Math.max(0, Math.min(100, D)),
    fatores: { f_dir, f_ench, f_curtas, f_cruz, f_vizinhas, f_tema, f_qtd, f_grade }
  };
}
