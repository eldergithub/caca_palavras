// src/ui/layout.js
// Cálculos puramente aritméticos de dimensionamento de tela (§2.2, §5.2).
// ZERO manipulação de DOM — roda no Node para o teste de varredura de telas (§10).

export const CELULA_MINIMA = 30;    // px CSS. Piso inegociável (§2.2)
export const VAO = 4;               // px entre células
export const MARGEM_LATERAL = 16;   // px obrigatórios nas bordas laterais (§1.1, item 6)
export const MARGEM_INFERIOR = 16;  // px obrigatórios na borda inferior (§1.1, item 6)
export const ALTURA_BOTAO_MIN = 64; // px piso inegociável para alvos de toque (§5.4)
export const ALTURA_TOPO = 44;      // px dos cantos SAIR / engrenagem (§5.1)
export const TETO_CARTAO = 480;     // px de largura máxima do cartão em telas grandes
export const FONTE_LISTA_MINIMA = 18; // px. A lista nunca encolhe abaixo disso (§5.2)
export const ALTURA_MINIMA_RETRATO = 560; // px. Abaixo disso a pilha em retrato não cabe

export function colunasPossiveis(larguraUtil, pisoCelula = CELULA_MINIMA) {
  const n = Math.floor((larguraUtil + VAO) / (pisoCelula + VAO));
  return Math.max(8, Math.min(14, n)); // 8 é o mínimo jogável; 14 o teto
}

// Ordem estrita de sacrifício quando a tela é baixa (§5.2):
//   1. respiros    32 px -> 12 px   (cedem primeiro)
//   2. rótulo de tema 32 px -> 0 px (some inteiro se precisar)
//   3. grade       reduz n em 1, mantendo a célula >= piso
//   4. lista       linha 44 -> 38 -> 30 px (fonte nunca abaixo de 18 px)
//   5. botões      nunca abaixo de 64 px  (últimos: são o que ela toca)
const CEDENCIAS = [
  (e) => (e.respiro > 12 ? ((e.respiro = 12), true) : false),
  (e) => (e.alturaTema > 0 ? ((e.alturaTema = 0), true) : false),
  (e) => (e.n > 8 ? ((e.n -= 1), true) : false),
  (e) => (e.alturaLinhaLista > 38 ? ((e.alturaLinhaLista = 38), true) : false),
  (e) => (e.alturaLinhaLista > 30 ? ((e.alturaLinhaLista = 30), true) : false),
];

// `deltaCelulaPx` vem da engrenagem e move o piso de célula em ±3 px (§5.4)
export function calcularLayout(larguraJanela, alturaJanela, nDesejado = 10, deltaCelulaPx = 0, qtdPalavras = 10) {
  // Celular deitado: o layout se reorganiza, grade à esquerda e lista à direita
  // (§5.1). O limiar tem de ser o MESMO da regra de CSS: acima dele a tela
  // comporta a pilha em retrato, e é ela que vale — inclusive no monitor.
  const paisagem = larguraJanela > alturaJanela && alturaJanela < ALTURA_MINIMA_RETRATO;

  // Em paisagem a grade é limitada pela altura; os 16 px extras cobrem o
  // respiro do cartão entre a barra de topo e o tabuleiro.
  const alturaParaGradePaisagem = alturaJanela - ALTURA_TOPO - MARGEM_INFERIOR - 16;

  const larguraUtil = paisagem
    ? Math.max(200, Math.min(larguraJanela - MARGEM_LATERAL * 3 - 260, alturaParaGradePaisagem))
    : Math.max(240, Math.min(larguraJanela, TETO_CARTAO) - MARGEM_LATERAL * 2);

  const pisoCelula = Math.max(24, CELULA_MINIMA + deltaCelulaPx);
  const nMax = colunasPossiveis(larguraUtil, pisoCelula);

  const linhasLista = Math.max(1, Math.ceil(qtdPalavras / 2));
  const alturaDisponivel = alturaJanela - ALTURA_TOPO - MARGEM_INFERIOR;

  const estado = {
    n: Math.min(nDesejado, nMax),
    respiro: 32,
    alturaTema: 32,
    alturaLinhaLista: 44,
  };

  // Altura que a grade pode ocupar com a configuração atual.
  // Em paisagem a lista e os botões estão ao lado e não disputam altura com ela.
  function celulaQueCabe(e) {
    const porLargura = Math.floor((larguraUtil - (e.n - 1) * VAO) / e.n);
    const sobra = paisagem
      ? alturaParaGradePaisagem
      : alturaDisponivel - e.alturaTema - e.respiro
        - e.alturaLinhaLista * linhasLista - ALTURA_BOTAO_MIN;
    const porAltura = Math.floor((sobra - (e.n - 1) * VAO) / e.n);
    return Math.min(porLargura, porAltura);
  }

  let celula = celulaQueCabe(estado);
  let idx = 0;
  while (celula < pisoCelula && idx < CEDENCIAS.length) {
    // Uma cedência que não tem mais o que ceder passa a vez para a seguinte
    if (!CEDENCIAS[idx](estado)) idx++;
    celula = celulaQueCabe(estado);
  }

  // Último recurso: numa tela absurdamente baixa a grade cede abaixo do piso,
  // mas os botões e a margem inferior continuam intactos — é ela que os toca.
  if (celula < 16) celula = 16;

  const n = estado.n;
  const tamanhoGrade = n * celula + (n - 1) * VAO;
  const tamanhoLetraCelula = Math.max(16, Math.round(celula * 0.7));
  const tamanhoFonteLista = estado.alturaLinhaLista >= 38
    ? Math.max(FONTE_LISTA_MINIMA, 20)
    : FONTE_LISTA_MINIMA;

  return {
    larguraUtil,
    nMax,
    n,
    tamanhoGrade,
    celula,
    vao: VAO,
    tamanhoLetraCelula,
    tamanhoFonteLista,
    alturaTopo: ALTURA_TOPO,
    alturaBotoes: ALTURA_BOTAO_MIN,
    exibirTema: estado.alturaTema > 0,
    alturaTema: estado.alturaTema,
    respiro: estado.respiro,
    alturaLinhaLista: estado.alturaLinhaLista,
    linhasLista,
    // Altura total consumida, para o teste de varredura conferir que nada transborda (§10)
    alturaTotalUsada: paisagem
      ? ALTURA_TOPO + tamanhoGrade + MARGEM_INFERIOR
      : ALTURA_TOPO + tamanhoGrade + estado.alturaTema + estado.respiro
        + estado.alturaLinhaLista * linhasLista + ALTURA_BOTAO_MIN + MARGEM_INFERIOR,
    isPaisagem: paisagem,
  };
}
