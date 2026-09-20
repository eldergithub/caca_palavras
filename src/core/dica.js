// src/core/dica.js
// Lógica dos 3 degraus de dica e cálculo de achabilidade (§8).
// ZERO dependências de DOM — roda no Node e no navegador.

import { MAPA_DIRECOES } from './dificuldade.js';

// Calcula a achabilidade de uma palavra pendente (maior pontuação = mais fácil de achar)
export function calcularAchabilidade(palavraColocada) {
  const len = palavraColocada.texto.length;
  const dir = MAPA_DIRECOES[palavraColocada.dirId];

  // Comprimento maior é mais fácil de ver (+2 por letra)
  let pontos = len * 2;

  // Direção reta (+4) vs diagonal (+1) vs invertida (+2)
  if (dir.tipo === 'reta') pontos += 4;
  else if (dir.tipo === 'invertida') pontos += 2;
  else pontos += 1;

  // Poucos cruzamentos torna a forma da palavra mais limpa
  pontos += Math.max(0, 5 - (palavraColocada.cruzamentos || 0));

  return pontos;
}

// Seleciona a melhor palavra para fornecer a dica
export function escolherPalavraParaDica(palavrasColocadas, palavrasPendentesSet, palavraMarcada = null) {
  // Se a jogadora marcou uma palavra na lista (§5.6), prioriza ela
  if (palavraMarcada && palavrasPendentesSet.has(palavraMarcada)) {
    const encontrada = palavrasColocadas.find(p => p.texto === palavraMarcada);
    if (encontrada) return encontrada;
  }

  // Senão, seleciona a palavra pendente com maior achabilidade
  let melhor = null;
  let maiorAchabilidade = -Infinity;

  for (const p of palavrasColocadas) {
    if (palavrasPendentesSet.has(p.texto)) {
      const ach = calcularAchabilidade(p);
      if (ach > maiorAchabilidade) {
        maiorAchabilidade = ach;
        melhor = p;
      }
    }
  }

  return melhor;
}

// Avança o degrau da dica para a palavra alvo (retorna degrau 1, 2 ou 3)
export function avancarDegrauDica(estadoDicas, palavraTexto) {
  const atual = estadoDicas[palavraTexto] || 0;
  const proximo = Math.min(3, atual + 1);
  return {
    ...estadoDicas,
    [palavraTexto]: proximo
  };
}
