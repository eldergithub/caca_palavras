// src/core/validador.js
// Validador independente de tabuleiros (§7.5).
// NÃO utiliza nenhuma anotação de posição do gerador: realiza varredura cega do zero.
// ZERO dependências de DOM — roda no Node e no navegador.

import { ALFABETO } from './texto.js';
import { BANCO_NORMALIZADO } from './banco.js';
import { DIRECOES, MAPA_DIRECOES, obterParametrosNivel } from './dificuldade.js';

export function validarTabuleiro(tabuleiro) {
  const erros = [];
  const avisos = [];

  if (!tabuleiro || !tabuleiro.grade || !Array.isArray(tabuleiro.palavras)) {
    return { valido: false, erros: ['Estrutura do tabuleiro inválida'] };
  }

  const { grade, palavras, nivel, n, D } = tabuleiro;
  const cfg = obterParametrosNivel(nivel, n);
  const direcoesPermitidas = new Set(cfg.direcoes);

  // 1. Checar dimensões e células
  if (grade.length !== n) {
    erros.push(`Número de linhas (${grade.length}) difere de n (${n})`);
  }

  for (let l = 0; l < grade.length; l++) {
    if (grade[l].length !== n) {
      erros.push(`Linha ${l} tem tamanho ${grade[l].length}, esperado ${n}`);
    }
    for (let c = 0; c < grade[l].length; c++) {
      const char = grade[l][c];
      // 4. Nenhuma célula vazia
      if (!char || char === '') {
        erros.push(`Célula vazia em (${l}, ${c})`);
      }
      // 5. Nenhum K, W, Y e apenas letras válidas do ALFABETO
      if (!ALFABETO.includes(char)) {
        erros.push(`Caractere inválido '${char}' em (${l}, ${c})`);
      }
    }
  }

  // 6. Nenhuma palavra fora do banco na lista anunciada
  for (const p of palavras) {
    const texto = typeof p === 'string' ? p : p.n;
    if (!BANCO_NORMALIZADO.has(texto)) {
      erros.push(`Palavra anunciada '${texto}' não existe no banco de palavras`);
    }
  }

  // 1 & 2. Varredura cega da grade em todas as 8 direções para localizar ocorrências
  // Mapeia todas as ocorrências de cada palavra anunciada: texto -> array de { celulas, dirId }
  const ocorrenciasEncontradas = new Map();
  for (const p of palavras) {
    const texto = typeof p === 'string' ? p : p.n;
    ocorrenciasEncontradas.set(texto, []);
  }

  for (let l = 0; l < n; l++) {
    for (let c = 0; c < n; c++) {
      for (const dir of DIRECOES) {
        // Testa cada palavra da lista
        for (const p of palavras) {
          const texto = typeof p === 'string' ? p : p.n;
          const len = texto.length;
          const lFim = l + dir.dl * (len - 1);
          const cFim = c + dir.dc * (len - 1);

          if (lFim < 0 || lFim >= n || cFim < 0 || cFim >= n) continue;

          let casou = true;
          const celulas = [];
          for (let k = 0; k < len; k++) {
            const cl = l + dir.dl * k;
            const cc = c + dir.dc * k;
            if (grade[cl][cc] !== texto[k]) {
              casou = false;
              break;
            }
            celulas.push({ l: cl, c: cc });
          }

          if (casou) {
            ocorrenciasEncontradas.get(texto).push({
              lInicio: l,
              cInicio: c,
              dirId: dir.id,
              celulas
            });
          }
        }
      }
    }
  }

  // Checar se toda palavra anunciada tem ao menos uma ocorrência em direção permitida
  for (const p of palavras) {
    const texto = typeof p === 'string' ? p : p.n;
    const lista = ocorrenciasEncontradas.get(texto) || [];

    if (lista.length === 0) {
      erros.push(`Palavra anunciada '${texto}' NÃO foi encontrada na grade (§7.5)`);
      continue;
    }

    // 3. Nenhuma direção fora das permitidas pelo nível
    // (Ao menos uma ocorrência deve estar nas direções permitidas)
    const ocorrenciaValida = lista.find(o => direcoesPermitidas.has(o.dirId));
    if (!ocorrenciaValida) {
      erros.push(`Palavra '${texto}' encontrada apenas em direções não permitidas para o nível ${nivel}`);
    }

    if (lista.length > 1) {
      avisos.push(`Palavra '${texto}' ocorreu ${lista.length} vezes na grade (duplicata aceita §7.5)`);
    }
  }

  // 7. D dentro da faixa do nível (com tolerância de ±2 pontos para variação estatística)
  if (typeof D === 'number') {
    const [dMin, dMax] = cfg.faixaD;
    if (D < dMin - 2 || D > dMax + 2) {
      avisos.push(`D=${D} fora da faixa [${dMin}, ${dMax}] para o nível ${nivel}`);
    }
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos,
    ocorrencias: ocorrenciasEncontradas
  };
}
