// src/storage.js
// Persistência local resiliente em localStorage (§7.6, §11.3, §11.4).
// Qualquer corrupção resulta em descarte silencioso: ela nunca vê erro.

const CHAVE_PARTIDA = 'cp_partida_v1';
const CHAVE_ESCADA = 'cp_escada_v1';
const CHAVE_STATS = 'cp_stats_v1';
const CHAVE_AJUSTES = 'cp_ajustes_v1';

const STATS_PADRAO = { concluidas: 0, ensinoConcluido: false, indiceTema: 0 };
const AJUSTES_PADRAO = { deltaCelulaPx: 0 };

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
      iniciadaEm: partida.iniciadaEm || Date.now(),
    };
    localStorage.setItem(CHAVE_PARTIDA, JSON.stringify(payload));
  } catch {
    // Cota cheia ou navegação anônima: ignorado em silêncio
  }
}

// Carregamento resiliente (§7.6): JSON quebrado, versão diferente ou estrutura
// inesperada -> descarta e começa partida nova.
export function carregarPartida() {
  try {
    const raw = localStorage.getItem(CHAVE_PARTIDA);
    if (!raw) return null;

    const dados = JSON.parse(raw);
    const estruturaValida = dados
      && dados.v === 1
      && Number.isFinite(dados.semente)
      && Number.isFinite(dados.n)
      && Number.isFinite(dados.nivel)
      && typeof dados.tema === 'string'
      && Array.isArray(dados.encontradas);

    if (!estruturaValida) {
      localStorage.removeItem(CHAVE_PARTIDA);
      return null;
    }
    return dados;
  } catch {
    try { localStorage.removeItem(CHAVE_PARTIDA); } catch {}
    return null;
  }
}

export function limparPartidaSalva() {
  try { localStorage.removeItem(CHAVE_PARTIDA); } catch {}
}

export function salvarEscada(escada) {
  try { localStorage.setItem(CHAVE_ESCADA, JSON.stringify(escada)); } catch {}
}

export function carregarEscada() {
  try {
    const raw = localStorage.getItem(CHAVE_ESCADA);
    if (!raw) return null;
    const dados = JSON.parse(raw);
    if (!dados || !Number.isFinite(dados.nivel)) return null;
    return dados;
  } catch {
    return null;
  }
}

export function salvarStats(stats) {
  try { localStorage.setItem(CHAVE_STATS, JSON.stringify(stats)); } catch {}
}

export function carregarStats() {
  try {
    const raw = localStorage.getItem(CHAVE_STATS);
    if (!raw) return { ...STATS_PADRAO };
    const parsed = JSON.parse(raw);
    return {
      concluidas: Number(parsed?.concluidas) || 0,
      ensinoConcluido: Boolean(parsed?.ensinoConcluido),
      indiceTema: Number(parsed?.indiceTema) || 0,
    };
  } catch {
    return { ...STATS_PADRAO };
  }
}

export function salvarAjustes(ajustes) {
  try { localStorage.setItem(CHAVE_AJUSTES, JSON.stringify(ajustes)); } catch {}
}

export function carregarAjustes() {
  try {
    const raw = localStorage.getItem(CHAVE_AJUSTES);
    if (!raw) return { ...AJUSTES_PADRAO };
    const parsed = JSON.parse(raw);
    return { deltaCelulaPx: Number(parsed?.deltaCelulaPx) || 0 };
  } catch {
    return { ...AJUSTES_PADRAO };
  }
}
