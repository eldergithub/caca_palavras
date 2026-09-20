// src/core/texto.js
// Normalização canônica de texto e alfabeto para o jogo Caça-Palavras.
// ZERO dependências de DOM — compatível com Node.js e navegador.

export function normalizar(palavra) {
  if (typeof palavra !== 'string') return '';
  return palavra
    .normalize('NFD') // Ç → C + cedilha, Ã → A + til
    .replace(/\p{Diacritic}/gu, '') // remove todos os sinais combinantes
    .toLocaleUpperCase('pt-BR');
}

// 23 letras: K, W e Y deliberadamente de fora (§4.4)
export const ALFABETO = 'ABCDEFGHIJLMNOPQRSTUVXZ'.split('');

// Distância de edição de Levenshtein entre duas palavras normalizadas
export function distanciaEdicao(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // remoção
        dp[i][j - 1] + 1,      // inserção
        dp[i - 1][j - 1] + custo // substituição
      );
    }
  }

  return dp[m][n];
}
