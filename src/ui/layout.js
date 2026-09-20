// src/ui/layout.js
// Cálculos puramente aritméticos de dimensionamento de tela (§2.2, §5.2).
// ZERO manipulação de DOM.

export const CELULA_MINIMA = 30; // px CSS. Piso inegociável (§2.2)
export const VAO = 4;            // px entre células
export const MARGEM_LATERAL = 16;// px obrigatórios nas bordas laterais e inferior (§1.1, item 6)
export const ALTURA_BOTAO_MIN = 64;// px piso inegociável para alvos de toque (§5.4)

export function colunasPossiveis(larguraUtil) {
  const n = Math.floor((larguraUtil + VAO) / (CELULA_MINIMA + VAO));
  return Math.max(8, Math.min(14, n)); // 8 mínimo jogável; 14 teto
}

// Ordem estrita de sacrifício para telas de menor altura (§5.2):
// 1. Respiros (64px -> 24px)
// 2. Rótulo de tema (32px -> 0px)
// 3. Grade (reduz n se necessário)
// 4. Lista (mantém teto de 10 palavras e fonte >= 18px)
// 5. Botões (NUNCA abaixo de 64px)
export function calcularLayout(larguraJanela, alturaJanela, nDesejado = 10, deltaFontePx = 0) {
  const larguraUtil = Math.max(280, larguraJanela - MARGEM_LATERAL * 2);
  const nMax = colunasPossiveis(larguraUtil);
  const n = Math.min(nDesejado, nMax);

  const tamanhoGrade = larguraUtil;
  const celula = Math.floor((larguraUtil - (n - 1) * VAO) / n);
  const tamanhoLetraCelula = Math.max(20, Math.floor(celula * 0.7) + deltaFontePx);

  // Verificação de espaço vertical
  // Topo: botões sair/engrenagem ~40px
  // Grade: tamanhoGrade
  // Botões inferiores: >= 64px + margem inferior 16px
  const alturaTopo = 44;
  const alturaBotoes = 70;
  const espacoRestante = alturaJanela - alturaTopo - tamanhoGrade - alturaBotoes - MARGEM_LATERAL;

  let exibirTema = true;
  let alturaTema = 32;
  let respiro = 16;
  let alturaLinhaLista = 40;

  if (espacoRestante < 250) {
    // 1. Cede respiros
    respiro = 8;
  }
  if (espacoRestante < 200) {
    // 2. Cede tema
    exibirTema = false;
    alturaTema = 0;
  }
  if (espacoRestante < 160) {
    alturaLinhaLista = 34;
  }

  return {
    larguraUtil,
    nMax,
    n,
    tamanhoGrade,
    celula,
    vao: VAO,
    tamanhoLetraCelula,
    alturaTopo,
    alturaBotoes,
    exibirTema,
    alturaTema,
    respiro,
    alturaLinhaLista,
    isPaisagem: larguraJanela > alturaJanela
  };
}
