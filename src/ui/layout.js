// src/ui/layout.js
// Cálculos puramente aritméticos de dimensionamento de tela responsivo (§2.2, §5.2).
// ZERO manipulação de DOM.

export const CELULA_MINIMA = 30; // px CSS. Piso inegociável (§2.2)
export const VAO = 4;            // px entre células
export const MARGEM_LATERAL = 16;// px obrigatórios nas bordas laterais e inferior (§1.1, item 6)
export const ALTURA_BOTAO_MIN = 64;// px piso inegociável para alvos de toque (§5.4)
export const LARGURA_MAXIMA_GRADE = 460; // px teto no desktop para evitar letras gigantes

export function colunasPossiveis(larguraUtil) {
  const n = Math.floor((larguraUtil + VAO) / (CELULA_MINIMA + VAO));
  return Math.max(8, Math.min(14, n)); // 8 mínimo jogável; 14 teto
}

export function calcularLayout(larguraJanela, alturaJanela, nDesejado = 10, deltaFontePx = 0) {
  const isPaisagem = larguraJanela > alturaJanela && larguraJanela >= 768;

  let larguraUtil;
  let tamanhoGrade;
  let n;

  if (isPaisagem) {
    // Modo paisagem adaptativo para computadores e tablets widescreen:
    // Tabuleiro à esquerda (até 460px) e painel lateral à direita
    const alturaDisponivel = Math.max(260, alturaJanela - 90);
    const larguraDisponivel = Math.max(280, (larguraJanela * 0.52) - MARGEM_LATERAL * 2);
    tamanhoGrade = Math.min(LARGURA_MAXIMA_GRADE, larguraDisponivel, alturaDisponivel);
    larguraUtil = tamanhoGrade;
    const nMax = colunasPossiveis(tamanhoGrade);
    n = Math.min(nDesejado, nMax);
  } else {
    // Modo retrato padrão (celulares e janelas verticais no desktop)
    const larguraBruta = Math.max(280, larguraJanela - MARGEM_LATERAL * 2);
    larguraUtil = Math.min(LARGURA_MAXIMA_GRADE, larguraBruta);
    const nMax = colunasPossiveis(larguraUtil);
    n = Math.min(nDesejado, nMax);

    // Orçamento vertical seguro:
    // Topo (~40px) + Esteira (~62px) + Tema/Instrução (~36px) + Lista (~140px) + Botões (~70px) + Margens (~40px) = ~388px
    const alturaOcupadaOutros = 360;
    const alturaDisponivelGrade = Math.max(240, alturaJanela - alturaOcupadaOutros);

    tamanhoGrade = Math.min(larguraUtil, alturaDisponivelGrade, LARGURA_MAXIMA_GRADE);
  }

  // Dimensionamento das células
  let celula = Math.floor((tamanhoGrade - (n - 1) * VAO) / n);
  if (celula < CELULA_MINIMA) {
    celula = CELULA_MINIMA;
  }
  // Limita célula no desktop a um tamanho confortável (máx 46px)
  celula = Math.min(46, celula);

  // Recalcula tamanho exato da grade ajustada às células
  const tamanhoGradeAjustado = n * celula + (n - 1) * VAO;

  // Tamanho da letra proporcional
  const tamanhoLetraCelula = Math.max(18, Math.min(30, Math.floor(celula * 0.66) + deltaFontePx));

  const alturaTopo = 40;
  const alturaBotoes = 68;

  return {
    larguraUtil,
    nMax: colunasPossiveis(larguraUtil),
    n,
    tamanhoGrade: tamanhoGradeAjustado,
    celula,
    vao: VAO,
    tamanhoLetraCelula,
    alturaTopo,
    alturaBotoes,
    exibirTema: true,
    alturaTema: 32,
    respiro: 12,
    alturaLinhaLista: 38,
    isPaisagem
  };
}
