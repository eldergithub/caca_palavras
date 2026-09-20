// src/core/partida.js
// Orquestrador do estado de uma partida de Caça-Palavras (§3.3, §3.4, §7.6).
// ZERO dependências de DOM — roda no Node e no navegador.

import { BANCO_NORMALIZADO } from './banco.js';
import { escolherPalavraParaDica, avancarDegrauDica } from './dica.js';

// Extrai a string de letras a partir de uma lista de coordenadas de células
export function textoDe(grade, segmento) {
  if (!grade || !segmento || segmento.length === 0) return '';
  return segmento.map(cel => grade[cel.l][cel.c]).join('');
}

// Inverte uma string
function inverter(str) {
  return str.split('').reverse().join('');
}

// Testa casamento com palavra pendente considerando sentido inverso e tolerância de extremidade de ±1 (§3.3, §3.4)
export function casarComPendente(grade, segmento, palavrasPendentesSet, n) {
  if (!segmento || segmento.length < 2) return null;

  const lenOriginal = segmento.length;
  const dirL = lenOriginal > 1 ? Math.sign(segmento[1].l - segmento[0].l) : 0;
  const dirC = lenOriginal > 1 ? Math.sign(segmento[1].c - segmento[0].c) : 0;

  // 1. Teste direto exato
  const textoDireto = textoDe(grade, segmento);
  if (palavrasPendentesSet.has(textoDireto)) {
    return { palavra: textoDireto, segmento, invertido: false, desvio: 0 };
  }
  const textoInvertido = inverter(textoDireto);
  if (palavrasPendentesSet.has(textoInvertido)) {
    return { palavra: textoInvertido, segmento: [...segmento].reverse(), invertido: true, desvio: 0 };
  }

  // 2. Tolerância de extremidade ±1 célula (§3.3, item 4)
  // Gera variações encurtando ou alongando em 1 célula no início e/ou no fim
  const candidatos = [];

  const variacoes = [
    // Encurtar 1 na ponta final
    { s: segmento.slice(0, -1), desvio: 1 },
    // Encurtar 1 na ponta inicial
    { s: segmento.slice(1), desvio: 1 },
    // Alongar 1 na ponta final
    (() => {
      const ult = segmento[lenOriginal - 1];
      const nxtL = ult.l + dirL;
      const nxtC = ult.c + dirC;
      if (nxtL >= 0 && nxtL < n && nxtC >= 0 && nxtC < n) {
        return { s: [...segmento, { l: nxtL, c: nxtC }], desvio: 1 };
      }
      return null;
    })(),
    // Alongar 1 na ponta inicial
    (() => {
      const prim = segmento[0];
      const antL = prim.l - dirL;
      const antC = prim.c - dirC;
      if (antL >= 0 && antL < n && antC >= 0 && antC < n) {
        return { s: [{ l: antL, c: antC }, ...segmento], desvio: 1 };
      }
      return null;
    })()
  ].filter(Boolean);

  for (const v of variacoes) {
    if (v.s.length < 2) continue;
    const txt = textoDe(grade, v.s);
    if (palavrasPendentesSet.has(txt)) {
      candidatos.push({ palavra: txt, segmento: v.s, invertido: false, desvio: v.desvio });
    }
    const txtInv = inverter(txt);
    if (palavrasPendentesSet.has(txtInv)) {
      candidatos.push({ palavra: txtInv, segmento: [...v.s].reverse(), invertido: true, desvio: v.desvio });
    }
  }

  // Aceita apenas se houver casamento com palavra pendente; vence menor desvio
  if (candidatos.length > 0) {
    candidatos.sort((a, b) => a.desvio - b.desvio);
    return candidatos[0];
  }

  return null;
}

export function criarPartida(tabuleiro, estadoSalvo = null) {
  const n = tabuleiro.n;
  const grade = tabuleiro.grade;
  const listaPalavras = tabuleiro.palavras.map(p => (typeof p === 'string' ? p : p.n));

  const encontradas = new Set(estadoSalvo?.encontradas || []);
  const pendentes = new Set(listaPalavras.filter(p => !encontradas.has(p)));
  const ordemEncontradas = [...(estadoSalvo?.encontradas || [])];
  const degrausDicas = { ...(estadoSalvo?.degrausDicas || {}) };

  // Mapeamento de palavras encontradas para suas células
  const celulasEncontradas = new Map(); // palavra -> [{l, c}]
  for (const p of tabuleiro.palavrasColocadas) {
    if (encontradas.has(p.texto)) {
      celulasEncontradas.set(p.texto, p.celulas);
    }
  }

  let palavraMarcada = null;
  let dicasUsadas = estadoSalvo?.dicasUsadas || 0;
  const iniciadaEm = estadoSalvo?.iniciadaEm || Date.now();

  function resolverSelecao(segmento) {
    // 3. Seleção de 1 célula só: espera segundo toque (§3.4)
    if (!segmento || segmento.length <= 1) {
      return { desfecho: 'toque_unico', segmento };
    }

    const texto = textoDe(grade, segmento);

    // 1. Acertou palavra pendente (direta ou com ±1)
    const match = casarComPendente(grade, segmento, pendentes, n);
    if (match) {
      const palavra = match.palavra;
      encontradas.add(palavra);
      pendentes.delete(palavra);
      ordemEncontradas.push(palavra);

      // Acha as células da palavra colocadas no tabuleiro
      const col = tabuleiro.palavrasColocadas.find(p => p.texto === palavra);
      const celulasFinais = col ? col.celulas : match.segmento;
      celulasEncontradas.set(palavra, celulasFinais);

      if (palavraMarcada === palavra) {
        palavraMarcada = null;
      }

      return {
        desfecho: 'acertou',
        palavra,
        segmento: celulasFinais,
        completo: pendentes.size === 0,
        indiceCor: ordemEncontradas.length - 1
      };
    }

    // 2. É palavra real do banco, mas não é uma das procuradas (§3.4, item 2)
    if (segmento.length >= 4 && (BANCO_NORMALIZADO.has(texto) || BANCO_NORMALIZADO.has(inverter(texto)))) {
      return { desfecho: 'palavra_real', texto, segmento };
    }

    // 4. Errou: não é palavra nenhuma (§3.4, item 4)
    return { desfecho: 'errou', texto, segmento };
  }

  function aplicarDica() {
    if (pendentes.size === 0) return null;
    dicasUsadas++;

    const alvo = escolherPalavraParaDica(tabuleiro.palavrasColocadas, pendentes, palavraMarcada);
    if (!alvo) return null;

    const texto = alvo.texto;
    const novosDegraus = avancarDegrauDica(degrausDicas, texto);
    const degrau = novosDegraus[texto];
    degrausDicas[texto] = degrau;

    // Degrau 3: revela palavra inteira e conta como encontrada (§8)
    if (degrau === 3) {
      encontradas.add(texto);
      pendentes.delete(texto);
      ordemEncontradas.push(texto);
      celulasEncontradas.set(texto, alvo.celulas);
      if (palavraMarcada === texto) palavraMarcada = null;

      return {
        degrau: 3,
        palavra: texto,
        alvo,
        celulas: alvo.celulas,
        completo: pendentes.size === 0,
        indiceCor: ordemEncontradas.length - 1
      };
    }

    // Degraus 1 e 2
    return {
      degrau,
      palavra: texto,
      alvo,
      celulas: degrau === 1 ? [alvo.celulas[0]] : alvo.celulas.slice(0, 2),
      completo: false
    };
  }

  function marcarPalavra(palavra) {
    if (pendentes.has(palavra)) {
      palavraMarcada = palavraMarcada === palavra ? null : palavra;
    }
    return palavraMarcada;
  }

  function obterDadosParaSalvar() {
    return {
      v: 1,
      semente: tabuleiro.semente,
      n: tabuleiro.n,
      nivel: tabuleiro.nivel,
      tema: tabuleiro.tema,
      encontradas: Array.from(encontradas),
      dicasUsadas,
      degrausDicas,
      iniciadaEm
    };
  }

  function obterTempoGastoSegundos() {
    return Math.max(1, Math.round((Date.now() - iniciadaEm) / 1000));
  }

  return {
    tabuleiro,
    encontradas,
    pendentes,
    ordemEncontradas,
    celulasEncontradas,
    degrausDicas,
    get palavraMarcada() { return palavraMarcada; },
    get dicasUsadas() { return dicasUsadas; },
    resolverSelecao,
    aplicarDica,
    marcarPalavra,
    obterDadosParaSalvar,
    obterTempoGastoSegundos,
    estaCompleto: () => pendentes.size === 0
  };
}
