// src/ui/layout.js
// Cálculos puramente aritméticos de dimensionamento de tela responsivo (§2.2, §5.2).
// ZERO manipulação de DOM.

export const CELULA_MINIMA = 28; // px CSS piso flexível para acomodar telas compactas (§2.2)
export const VAO = 4;            // px entre células
export const MARGEM_LATERAL = 12;// px nas bordas laterais para aproveitar melhor a tela mobile
export const ALTURA_BOTAO_MIN = 64;// px piso inegociável para alvos de toque (§5.4)
export const LARGURA_MAXIMA_GRADE = 460; // px teto no desktop para evitar letras gigantes

export function colunasPossiveis(larguraUtil) {
  const n = Math.floor((larguraUtil + VAO) / (CELULA_MINIMA + VAO));
  return Math.max(8, Math.min(14, n)); // 8 mínimo jogável; 14 teto
}

export function calcularLayout(larguraJanela, alturaJanela, nDesejado = 10, deltaFontePx = 0) {
  let vaoEfetivo = VAO;

  // Largura máxima utilizável dentro do cartão do jogo (máx 480px centralizado)
  const larguraDisponivel = Math.min(480, larguraJanela) - MARGEM_LATERAL * 2;
  const larguraUtil = Math.max(260, Math.min(LARGURA_MAXIMA_GRADE, larguraDisponivel));

  const nMax = colunasPossiveis(larguraUtil);
  const n = Math.min(nDesejado, nMax);

  // Orçamento vertical seguro para o cartão:
  // Topo (36px) + Esteira (42px) + Progresso (18px) + Lista (120px) + Botões (64px) + Paddings (16px) = ~296px
  const alturaOcupadaOutros = 300;
  // Considera a altura real do cartão (até 940px no desktop ou 100dvh no mobile)
  const alturaCartao = Math.min(larguraJanela >= 600 ? alturaJanela * 0.94 : alturaJanela, 940);
  const alturaDisponivelGrade = Math.max(200, alturaCartao - alturaOcupadaOutros);

  // Ajusta o vão se o espaço for estreito
  if (larguraUtil < 330 || alturaDisponivelGrade < 310) {
    vaoEfetivo = 3;
  }

  const tamanhoGradeMaximo = Math.min(larguraUtil, alturaDisponivelGrade, LARGURA_MAXIMA_GRADE);

  // Dimensionamento das células respeitando o teto da grade
  let celula = Math.floor((tamanhoGradeMaximo - (n - 1) * vaoEfetivo) / n);
  if (celula < 25) {
    celula = 25;
  }
  // Limita célula a um tamanho confortável (máx 44px)
  celula = Math.min(44, celula);

  // Recalcula tamanho exato da grade ajustada às células
  const tamanhoGradeAjustado = n * celula + (n - 1) * vaoEfetivo;

  // Tamanho da letra proporcional e nítido
  const tamanhoLetraCelula = Math.max(16, Math.min(28, Math.floor(celula * 0.65) + deltaFontePx));

  const alturaTopo = 36;
  const alturaBotoes = 64;

  return {
    larguraUtil,
    nMax,
    n,
    tamanhoGrade: tamanhoGradeAjustado,
    celula,
    vao: vaoEfetivo,
    tamanhoLetraCelula,
    alturaTopo,
    alturaBotoes,
    exibirTema: true,
    alturaTema: 28,
    respiro: 8,
    alturaLinhaLista: 30,
    isPaisagem: larguraJanela > alturaJanela && larguraJanela >= 768
  };
}
