// src/core/banco.js
// Gestão em memória do banco de palavras curado e normalizado.
// Zero dependências de DOM — funciona no Node e no navegador.

import { CATEGORIAS, VIZINHAS } from './dados-banco.js';
import { normalizar } from './texto.js';

// Conjunto com todas as formas normalizadas do banco para consulta O(1) (§3.4, item 2)
export const BANCO_NORMALIZADO = new Set();
export const TODAS_AS_PALAVRAS = [];

for (const [tema, palavras] of Object.entries(CATEGORIAS)) {
  for (const item of palavras) {
    BANCO_NORMALIZADO.add(item.n);
    TODAS_AS_PALAVRAS.push({ ...item, tema });
  }
}

export { CATEGORIAS, VIZINHAS };

export function obterTodosOsTemas() {
  return Object.keys(CATEGORIAS);
}

export function obterPalavrasDoTema(tema) {
  return CATEGORIAS[tema] || [];
}

// Verifica se um texto normalizado é uma palavra real existente no banco (§3.4)
export function ehPalavraReal(texto) {
  if (!texto || typeof texto !== 'string') return false;
  return BANCO_NORMALIZADO.has(normalizar(texto));
}

// Abstração do tema para o cálculo da pontuação D (§6.4)
// Varia de 0 (concreto/básico) a 1 (abstrato/linguístico)
const ABSTRACAO_TEMA = {
  alimentos:   0.10,
  corpo:       0.15,
  animais:     0.20,
  objetos:     0.25,
  cotidiano:   0.35,
  familia:     0.40,
  lugares:     0.45,
  plantas:     0.50,
  natureza:    0.55,
  profissoes:  0.60,
  musica:      0.70,
  cultura:     0.75,
  sentimentos: 0.85,
  literatura:  0.95,
  portugues:   1.00,
};

export function obterAbstracaoTema(tema) {
  return ABSTRACAO_TEMA[tema] ?? 0.5;
}
