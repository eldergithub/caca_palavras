// src/core/prng.js
// Gerador de números pseudoaleatórios determinístico (Mulberry32).
// ZERO dependências de DOM — idêntico no Node e no navegador (§7.1, §10).

export function criarPrng(semente) {
  let s = (semente >>> 0) || 1;

  function proximo() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Inteiro aleatório no intervalo [min, max] inclusivo
  function proximoInt(min, max) {
    return min + Math.floor(proximo() * (max - min + 1));
  }

  // Embaralha um array in-place usando Fisher-Yates
  function embaralhar(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(proximo() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  // Sorteia um item de um array
  function escolher(array) {
    if (!array || array.length === 0) return undefined;
    return array[Math.floor(proximo() * array.length)];
  }

  return { proximo, proximoInt, embaralhar, escolher };
}

// Função de hash 32-bit (FNV-1a) para gerar sementes inteiras a partir de strings/números
export function hash32(...argumentos) {
  let h = 0x811c9dc5;
  for (const arg of argumentos) {
    const str = String(arg);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
  }
  return (h >>> 0) || 1;
}
