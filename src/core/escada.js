// src/core/escada.js
// Gestão da escada de dificuldade invisível de 12 níveis que sobe e desce (§6.3).
// ZERO dependências de DOM — roda no Node e no navegador.

import { PARAMETROS_NIVEIS } from './dificuldade.js';

export function classificarResultado(partida, medianaDoNivel) {
  if (partida.abandonada) return 'desce';
  if (partida.dicas >= 3) return 'desce';
  if (partida.segundos > 2.5 * medianaDoNivel) return 'desce';
  if (partida.dicas === 0 && partida.segundos <= medianaDoNivel) return 'sobe';
  return 'mantem';
}

export function calcularMediana(lista) {
  if (!lista || lista.length === 0) return 0;
  const ordenada = [...lista].sort((a, b) => a - b);
  const meio = Math.floor(ordenada.length / 2);
  if (ordenada.length % 2 === 1) {
    return ordenada[meio];
  }
  return (ordenada[meio - 1] + ordenada[meio]) / 2;
}

export function criarEstadoEscadaInicial() {
  return {
    nivel: 1,
    seguidas: { direcao: 'mantem', quantas: 0 },
    tempos: {}, // { [nivel]: [segundos...] } últimas 10 partidas
    ajusteManual: 0 // ajuste via engrenagem pelo cuidador (§5.4)
  };
}

// Atualiza o estado da escada ao fim de uma partida
export function processarFimDePartida(estadoEscada, dadosPartida) {
  const estado = {
    nivel: estadoEscada?.nivel ?? 1,
    seguidas: { ...(estadoEscada?.seguidas || { direcao: 'mantem', quantas: 0 }) },
    tempos: { ...(estadoEscada?.tempos || {}) },
    ajusteManual: estadoEscada?.ajusteManual ?? 0
  };

  const nivelAtual = estado.nivel;
  const temposDoNivel = estado.tempos[nivelAtual] || [];

  // Se houver menos de 3 amostras históricas, usa a mediana da tabela (§6.2, §6.3)
  const medianaBase = temposDoNivel.length >= 3
    ? calcularMediana(temposDoNivel)
    : (PARAMETROS_NIVEIS[nivelAtual]?.medianaSegundos || 180);

  const direcao = classificarResultado(dadosPartida, medianaBase);

  // Registro de tempos da jogadora (mantém no máximo as últimas 10)
  if (!dadosPartida.abandonada && dadosPartida.segundos > 0) {
    const novosTempos = [...temposDoNivel, dadosPartida.segundos].slice(-10);
    estado.tempos[nivelAtual] = novosTempos;
  }

  // O nível só se move após duas classificações seguidas na mesma direção (§6.3)
  if (direcao === 'sobe' || direcao === 'desce') {
    if (estado.seguidas.direcao === direcao) {
      estado.seguidas.quantas++;
      if (estado.seguidas.quantas >= 2) {
        if (direcao === 'sobe') {
          estado.nivel = Math.min(12, estado.nivel + 1);
        } else {
          estado.nivel = Math.max(1, estado.nivel - 1);
        }
        // Reseta contador após mover
        estado.seguidas = { direcao: 'mantem', quantas: 0 };
      }
    } else {
      estado.seguidas = { direcao, quantas: 1 };
    }
  } else {
    estado.seguidas = { direcao: 'mantem', quantas: 0 };
  }

  return estado;
}

// Nível efetivo considerando o ajuste manual da engrenagem
export function obterNivelEfetivo(estadoEscada) {
  const base = estadoEscada?.nivel ?? 1;
  const ajuste = estadoEscada?.ajusteManual ?? 0;
  return Math.max(1, Math.min(12, base + ajuste));
}
