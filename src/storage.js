// src/storage.js
// Persistência local resiliente em localStorage (§7.6, §11.3, §11.4).
// Isolamento completo de erros: corrupção ou falha resulta em descarte silencioso sem travar.

const CHAVE_PARTIDA = 'cp_partida_v1';
const CHAVE_ESCADA = 'cp_escada_v1';
const CHAVE_STATS = 'cp_stats_v1';
const CHAVE_AJUSTES = 'cp_ajustes_v1';

export function salvarPartida(partida) {
  try {
    if (!partida) {
      localStorage.removeItem(CHAVE_PARTIDA);
      return;
    }
    const payload = {
      v: 1,
      semente: partida.semente,
      n: partida.n,
      nivel: partida.nivel,
      tema: partida.tema,
      encontradas: partida.encontradas,
      dicasUsadas: partida.dicasUsadas || 0,
      degrausDicas: partida.degrausDicas || {},
      iniciadaEm: partida.iniciadaEm || Date.now()
    };
    localStorage.setItem(CHAVE_PARTIDA, JSON.stringify(payload));
  } catch {
    // Falhas de cota ou navegação anônima são ignoradas silenciosamente
  }
}

export function carregarPartida() {
  try {
    const raw = localStorage.getItem(CHAVE_PARTIDA);
    if (!raw) return null;
    const dados = JSON.parse(raw);
    if (!dados || dados.v !== 1 || !dados.semente || !dados.n || !dados.nivel) {
      localStorage.removeItem(CHAVE_PARTIDA);
      return null;
    }
    return dados;
  } catch {
    localStorage.removeItem(CHAVE_PARTIDA);
    return null;
  }
}

export function limparPartidaSalva() {
  try {
    localStorage.removeItem(CHAVE_PARTIDA);
  } catch {}
}

export function salvarEscada(escada) {
  try {
    localStorage.setItem(CHAVE_ESCADA, JSON.stringify(escada));
  } catch {}
}

export function carregarEscada() {
  try {
    const raw = localStorage.getItem(CHAVE_ESCADA);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function salvarStats(stats) {
  try {
    localStorage.setItem(CHAVE_STATS, JSON.stringify(stats));
  } catch {}
}

export function carregarStats() {
  try {
    const raw = localStorage.getItem(CHAVE_STATS);
    if (!raw) return { concluidas: 0, ensinoConcluido: false };
    const parsed = JSON.parse(raw);
    return {
      concluidas: Number(parsed?.concluidas || 0),
      ensinoConcluido: Boolean(parsed?.ensinoConcluido)
    };
  } catch {
    return { concluidas: 0, ensinoConcluido: false };
  }
}

export function salvarAjustes(ajustes) {
  try {
    localStorage.setItem(CHAVE_AJUSTES, JSON.stringify(ajustes));
  } catch {}
}

export function carregarAjustes() {
  try {
    const raw = localStorage.getItem(CHAVE_AJUSTES);
    if (!raw) return { deltaFontePx: 0 };
    return JSON.parse(raw);
  } catch {
    return { deltaFontePx: 0 };
  }
}
