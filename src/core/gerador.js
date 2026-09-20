// src/core/gerador.js
// Gerador de partidas determinístico no aparelho com colocação e enchimento adversário (§7.2, §7.3, §7.4).
// ZERO dependências de DOM — roda no Node e no navegador.

import { criarPrng } from './prng.js';
import { ALFABETO } from './texto.js';
import { obterTodosOsTemas, obterPalavrasDoTema, VIZINHAS } from './banco.js';
import { obterParametrosNivel, calcularDificuldade, MAPA_DIRECOES } from './dificuldade.js';

// Frequências aproximadas de letras no português escrito (§7.4)
const FREQUENCIAS_PT_BR = {
  A: 146, E: 126, O: 107, S: 78, R: 65, I: 62, N: 50, D: 50, M: 47, T: 43,
  U: 46,  C: 39,  L: 28,  P: 25, V: 17, G: 13, H: 13, Q: 12, B: 10, F: 10,
  Z: 5,   J: 4,   X: 2
};

const TABELA_PESOS_LETRAS = [];
for (const [letra, peso] of Object.entries(FREQUENCIAS_PT_BR)) {
  for (let i = 0; i < peso; i++) TABELA_PESOS_LETRAS.push(letra);
}

// Sorteia letra por frequência pt-BR
function sortearPorFrequencia(prng) {
  return TABELA_PESOS_LETRAS[prng.proximoInt(0, TABELA_PESOS_LETRAS.length - 1)];
}

// Sorteia letra do alfabeto uniforme (23 letras)
function sortearUniforme(prng) {
  return ALFABETO[prng.proximoInt(0, ALFABETO.length - 1)];
}

// Verifica se duas posições com direção são paralelas e adjacentes (§7.3)
function saoAdjacentesEParalelas(pos1, len1, pos2, len2) {
  const d1 = MAPA_DIRECOES[pos1.dirId];
  const d2 = MAPA_DIRECOES[pos2.dirId];
  // Paralelas se mesma reta (ex: L e L, L e O, S e S, S e N)
  const mesmaInclinacao = (d1.dl === d2.dl && d1.dc === d2.dc) || (d1.dl === -d2.dl && d1.dc === -d2.dc);
  if (!mesmaInclinacao) return false;

  // Se são horizontais (dl == 0) e estão em linhas coladas (|l1 - l2| == 1)
  if (d1.dl === 0 && Math.abs(pos1.l - pos2.l) === 1) {
    const c1Min = Math.min(pos1.c, pos1.c + d1.dc * (len1 - 1));
    const c1Max = Math.max(pos1.c, pos1.c + d1.dc * (len1 - 1));
    const c2Min = Math.min(pos2.c, pos2.c + d2.dc * (len2 - 1));
    const c2Max = Math.max(pos2.c, pos2.c + d2.dc * (len2 - 1));
    // Sobreposição em colunas
    return Math.max(c1Min, c2Min) <= Math.min(c1Max, c2Max);
  }

  // Se são verticais (dc == 0) e estão em colunas coladas (|c1 - c2| == 1)
  if (d1.dc === 0 && Math.abs(pos1.c - pos2.c) === 1) {
    const l1Min = Math.min(pos1.l, pos1.l + d1.dl * (len1 - 1));
    const l1Max = Math.max(pos1.l, pos1.l + d1.dl * (len1 - 1));
    const l2Min = Math.min(pos2.l, pos2.l + d2.dl * (len2 - 1));
    const l2Max = Math.max(pos2.l, pos2.l + d2.dl * (len2 - 1));
    return Math.max(l1Min, l2Min) <= Math.min(l1Max, l2Max);
  }

  return false;
}

// Tenta gerar um tabuleiro completo dada uma semente específica
export function tentarGerar(semente, nGrade, nivel, temaForcado = null) {
  const prng = criarPrng(semente);
  const cfg = obterParametrosNivel(nivel, nGrade);
  const n = cfg.n;

  // 1. Escolha do tema
  const temas = obterTodosOsTemas();
  const tema = temaForcado && temas.includes(temaForcado) ? temaForcado : temas[prng.proximoInt(0, temas.length - 1)];
  const palavrasTema = obterPalavrasDoTema(tema);

  // 2. Filtro e seleção de palavras do tema
  let candidatas = palavrasTema.filter(p => p.n.length >= cfg.tamMin && p.n.length <= Math.min(cfg.tamMax, n));
  if (candidatas.length < cfg.qtdPalavras + 2) {
    // Relaxa limites de tamanho progressivamente para nunca faltar palavra
    candidatas = palavrasTema.filter(p => p.n.length >= 4 && p.n.length <= n);
  }

  // Priorizar nível lexical
  const candidatasNivel = candidatas.filter(p => p.nv >= cfg.lexicoMin && p.nv <= cfg.lexicoMax);
  let pool = candidatasNivel.length >= cfg.qtdPalavras ? [...candidatasNivel] : [...candidatas];

  prng.embaralhar(pool);
  const selecionadas = [];
  const selecionadasSet = new Set();

  // Injetar pares de vizinhas quando configurado (§6.2)
  let paresVizinhasPresentes = 0;
  if (cfg.vizinhasPares > 0) {
    const paresEmbaralhados = prng.embaralhar([...VIZINHAS]);
    for (const par of paresEmbaralhados) {
      const [v1, v2] = par;
      const r1 = pool.find(p => p.n === v1) || palavrasTema.find(p => p.n === v1);
      const r2 = pool.find(p => p.n === v2) || palavrasTema.find(p => p.n === v2);
      if (r1 && r2 && r1.n.length <= n && r2.n.length <= n) {
        if (!selecionadasSet.has(r1.n)) { selecionadas.push(r1); selecionadasSet.add(r1.n); }
        if (!selecionadasSet.has(r2.n)) { selecionadas.push(r2); selecionadasSet.add(r2.n); }
        paresVizinhasPresentes++;
        if (paresVizinhasPresentes >= cfg.vizinhasPares) break;
      }
    }
  }

  for (const p of pool) {
    if (selecionadas.length >= cfg.qtdPalavras) break;
    if (!selecionadasSet.has(p.n)) {
      selecionadas.push(p);
      selecionadasSet.add(p.n);
    }
  }

  // Se ainda faltar, completa do tema
  if (selecionadas.length < cfg.qtdPalavras) {
    for (const p of palavrasTema) {
      if (p.n.length <= n && !selecionadasSet.has(p.n)) {
        selecionadas.push(p);
        selecionadasSet.add(p.n);
        if (selecionadas.length >= cfg.qtdPalavras) break;
      }
    }
  }

  if (selecionadas.length < cfg.qtdPalavras) return null;

  // 3. Ordena palavras da mais longa para a mais curta (§7.3)
  selecionadas.sort((a, b) => b.n.length - a.n.length);

  // Inicializa matriz vazia
  const grade = Array.from({ length: n }, () => new Array(n).fill(''));

  // 4. Algoritmo de colocação com retrocesso (§7.3)
  const colocadas = []; // { palavra, pos: { l, c, dirId }, celulas: [{l, c}] }
  const direcoesPermitidas = cfg.direcoes.map(id => MAPA_DIRECOES[id]);
  const usoDirecao = Object.fromEntries(cfg.direcoes.map(id => [id, 0]));

  let retrocessos = 0;
  let idx = 0;

  while (idx >= 0 && idx < selecionadas.length) {
    if (retrocessos > 500) return null; // orçamento de retrocessos ajustado para 500

    const palavra = selecionadas[idx];
    const len = palavra.n.length;

    // Encontrar todas as posições possíveis
    const posicoesValidas = [];

    for (let l = 0; l < n; l++) {
      for (let c = 0; c < n; c++) {
        for (const dir of direcoesPermitidas) {
          const lFim = l + dir.dl * (len - 1);
          const cFim = c + dir.dc * (len - 1);

          if (lFim < 0 || lFim >= n || cFim < 0 || cFim >= n) continue;

          // Testa se cabe e calcula pontuação
          let cabe = true;
          let cruzamentos = 0;

          for (let k = 0; k < len; k++) {
            const cl = l + dir.dl * k;
            const cc = c + dir.dc * k;
            const letraGrade = grade[cl][cc];
            const letraPalavra = palavra.n[k];

            if (letraGrade !== '' && letraGrade !== letraPalavra) {
              cabe = false;
              break;
            }
            if (letraGrade === letraPalavra) {
              cruzamentos++;
            }
          }

          if (!cabe) continue;

          // Pontuação da posição (§7.3)
          let pontos = cruzamentos * 3;

          // Penalidade se adjacente e paralela a outra colocada (-2)
          for (const col of colocadas) {
            if (saoAdjacentesEParalelas({ l, c, dirId: dir.id }, len, col.pos, col.palavra.n.length)) {
              pontos -= 2;
            }
          }

          // Bônus se a direção ainda foi pouco usada (+1)
          const menorUso = Math.min(...Object.values(usoDirecao));
          if (usoDirecao[dir.id] === menorUso) {
            pontos += 1;
          }

          posicoesValidas.push({ l, c, dirId: dir.id, pontos, cruzamentos });
        }
      }
    }

    if (posicoesValidas.length === 0) {
      // Nenhum lugar cabe -> retroceder
      idx--;
      retrocessos++;
      if (idx >= 0) {
        // Desfazer colocação anterior
        const anterior = colocadas.pop();
        usoDirecao[anterior.pos.dirId]--;
        // Limpar células ocupadas apenas por essa palavra
        for (const cel of anterior.celulas) {
          let usadaPorOutra = false;
          for (const rest of colocadas) {
            if (rest.celulas.some(rc => rc.l === cel.l && rc.c === cel.c)) {
              usadaPorOutra = true;
              break;
            }
          }
          if (!usadaPorOutra) {
            grade[cel.l][cel.c] = '';
          }
        }
      }
      continue;
    }

    // Embaralhar posições de mesma pontuação com o PRNG
    prng.embaralhar(posicoesValidas);

    // Conforme a meta de cruzamentos, ordenar
    const totalCruzamentosAtuais = colocadas.reduce((acc, cur) => acc + cur.cruzamentos, 0);
    const metaCruz = Math.round(cfg.metaCruzamentos * selecionadas.length);

    posicoesValidas.sort((a, b) => {
      if (totalCruzamentosAtuais < metaCruz) {
        return b.pontos - a.pontos; // prefere pontuação alta
      }
      // Prefere pontuação média/moderada
      return Math.abs(a.pontos - 2) - Math.abs(b.pontos - 2);
    });

    const escolhida = posicoesValidas[0];
    const dir = MAPA_DIRECOES[escolhida.dirId];
    const celulasOcupadas = [];

    for (let k = 0; k < len; k++) {
      const cl = escolhida.l + dir.dl * k;
      const cc = escolhida.c + dir.dc * k;
      grade[cl][cc] = palavra.n[k];
      celulasOcupadas.push({ l: cl, c: cc });
    }

    usoDirecao[escolhida.dirId]++;
    colocadas.push({
      palavra,
      pos: escolhida,
      dirId: escolhida.dirId,
      texto: palavra.n,
      grafia: palavra.t,
      celulas: celulasOcupadas,
      cruzamentos: escolhida.cruzamentos
    });

    idx++;
  }

  if (colocadas.length !== selecionadas.length) return null;

  // 5. Enchimento das células vazias (§7.4)
  const prefixosAdversarios = new Set();
  for (const col of colocadas) {
    if (col.texto.length >= 2) prefixosAdversarios.add(col.texto.slice(0, 2));
    if (col.texto.length >= 3) prefixosAdversarios.add(col.texto.slice(0, 3));
  }

  for (let l = 0; l < n; l++) {
    for (let c = 0; c < n; c++) {
      if (grade[l][c] !== '') continue;

      let letraSorteada = null;

      if (cfg.enchimento === 'uniforme') {
        letraSorteada = sortearUniforme(prng);
      } else if (cfg.enchimento === 'frequencia') {
        letraSorteada = sortearPorFrequencia(prng);
      } else {
        // adversario_leve (40%) ou adversario (75%)
        const limiarAdversario = cfg.enchimento === 'adversario' ? 0.75 : 0.40;
        if (prng.proximo() < limiarAdversario) {
          // Busca letra que formaria prefixo com vizinho
          const letrasCandidatas = [];
          for (const d of direcoesPermitidas) {
            const antL = l - d.dl;
            const antC = c - d.dc;
            if (antL >= 0 && antL < n && antC >= 0 && antC < n && grade[antL][antC] !== '') {
              const vizLetra = grade[antL][antC];
              for (const pref of prefixosAdversarios) {
                if (pref[0] === vizLetra) letrasCandidatas.push(pref[1]);
              }
            }
          }
          if (letrasCandidatas.length > 0) {
            letraSorteada = letrasCandidatas[prng.proximoInt(0, letrasCandidatas.length - 1)];
          }
        }

        if (!letraSorteada) {
          letraSorteada = sortearPorFrequencia(prng);
        }
      }

      grade[l][c] = letraSorteada;
    }
  }

  // 6. Cálculo da dificuldade a posteriori
  const tabuleiroFinal = {
    semente,
    n,
    nivel,
    tema,
    grade,
    palavras: colocadas.map(c => ({ t: c.grafia, n: c.texto })),
    palavrasColocadas: colocadas,
    paresVizinhasPresentes
  };

  const { D, fatores } = calcularDificuldade(tabuleiroFinal);
  tabuleiroFinal.D = D;
  tabuleiroFinal.fatores = fatores;

  return tabuleiroFinal;
}

// Fluxo completo de geração com até 20 tentativas (§7.2)
export function gerarTabuleiro(sementeInicial, nGrade, nivel, temaForcado = null, tabuleiroReservaFallback = null) {
  let sementeAtual = sementeInicial;
  const cfg = obterParametrosNivel(nivel, nGrade);
  const [dMin, dMax] = cfg.faixaD;

  let melhorTabuleiro = null;
  let menorDistanciaD = Infinity;

  for (let tentativa = 0; tentativa < 20; tentativa++) {
    const tabuleiro = tentarGerar(sementeAtual, nGrade, nivel, temaForcado);
    if (tabuleiro) {
      if (tabuleiro.D >= dMin && tabuleiro.D <= dMax) {
        return tabuleiro;
      }
      const dist = tabuleiro.D < dMin ? (dMin - tabuleiro.D) : (tabuleiro.D - dMax);
      if (dist < menorDistanciaD) {
        menorDistanciaD = dist;
        melhorTabuleiro = tabuleiro;
      }
    }
    sementeAtual = (sementeAtual + 1) >>> 0;
  }

  if (melhorTabuleiro) {
    return melhorTabuleiro;
  }

  // Se esgotou as 20 tentativas sem nenhum tabuleiro, fallback silencioso para tabuleiro reserva (§7.2)
  if (tabuleiroReservaFallback) {
    return { ...tabuleiroReservaFallback, semente: sementeInicial, fallbackReserva: true };
  }

  return tentarGerar(sementeAtual, nGrade, nivel, temaForcado);
}
