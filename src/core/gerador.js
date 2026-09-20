// src/core/gerador.js
// Gerador de partidas determinístico no aparelho com colocação e enchimento adversário (§7.2, §7.3, §7.4).
// ZERO dependências de DOM — roda no Node e no navegador.

import { criarPrng } from './prng.js';
import { ALFABETO } from './texto.js';
import {
  obterTodosOsTemas,
  obterPalavrasDoTema,
  obterAbstracaoTema,
  TODAS_AS_PALAVRAS,
  VIZINHAS,
} from './banco.js';
import { obterParametrosNivel, calcularDificuldade, MAPA_DIRECOES } from './dificuldade.js';
import { validarTabuleiro } from './validador.js';

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

// §6.1, alavanca 6: a abstração do tema sobe junto com o nível.
// Nível baixo sorteia entre os temas concretos (alimentos, corpo, animais);
// nível alto, entre os abstratos (sentimentos, literatura, portugues).
function sortearTemaDoNivel(prng, nivel) {
  const temas = obterTodosOsTemas()
    .slice()
    .sort((a, b) => obterAbstracaoTema(a) - obterAbstracaoTema(b));

  const janela = Math.max(5, Math.ceil(temas.length / 2));
  const passo = (temas.length - janela) / 11;
  const inicio = Math.max(0, Math.round((nivel - 1) * passo));
  const faixa = temas.slice(inicio, inicio + janela);

  return faixa[prng.proximoInt(0, faixa.length - 1)];
}

// Tenta gerar um tabuleiro completo dada uma semente específica
export function tentarGerar(semente, nGrade, nivel, temaForcado = null) {
  const prng = criarPrng(semente);
  const cfg = obterParametrosNivel(nivel, nGrade);
  const n = cfg.n;

  // 1. Escolha do tema (§6.1, alavanca 6).
  // O sorteio acontece SEMPRE, mesmo quando o tema vem forçado: ele consome um
  // número do PRNG, e pular esse consumo faria a mesma semente produzir outra
  // grade na hora de restaurar a partida salva (§7.6).
  const temas = obterTodosOsTemas();
  const temaSorteado = sortearTemaDoNivel(prng, cfg.nivel);
  const tema = temaForcado && temas.includes(temaForcado) ? temaForcado : temaSorteado;
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

  // Injetar pares de vizinhas quando configurado (§6.1 alavanca 5, §6.2).
  // O par é procurado no banco inteiro, não só no tema sorteado: se ele
  // existisse apenas dentro da categoria da vez, a alavanca quase nunca dispararia.
  let paresVizinhasPresentes = 0;
  if (cfg.vizinhasPares > 0) {
    const paresEmbaralhados = prng.embaralhar([...VIZINHAS]);
    // Pares com as duas palavras dentro do tema vêm primeiro
    paresEmbaralhados.sort((a, b) => {
      const noTema = (par) => (palavrasTema.some(p => p.n === par[0]) && palavrasTema.some(p => p.n === par[1])) ? 0 : 1;
      return noTema(a) - noTema(b);
    });

    for (const par of paresEmbaralhados) {
      const [v1, v2] = par;
      const achar = (alvo) => pool.find(p => p.n === alvo)
        || palavrasTema.find(p => p.n === alvo)
        || TODAS_AS_PALAVRAS.find(p => p.n === alvo);
      const r1 = achar(v1);
      const r2 = achar(v2);
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

    // Conforme a meta de cruzamentos do nível (§6.2, §7.3).
    // A meta é a fração de palavras que cruzam, então conta-se palavras, não células.
    const palavrasQueCruzam = colocadas.filter(c => c.cruzamentos > 0).length;
    const metaCruz = Math.round(cfg.metaCruzamentos * selecionadas.length);

    posicoesValidas.sort((a, b) => {
      if (palavrasQueCruzam < metaCruz) {
        return b.pontos - a.pontos; // ainda falta cruzamento: prefere pontuação alta
      }
      // Meta atingida: evita cruzar de novo, mantendo a penalidade de adjacência
      if (a.cruzamentos !== b.cruzamentos) return a.cruzamentos - b.cruzamentos;
      return b.pontos - a.pontos;
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
  // Mapa de começos: primeira letra -> segundas letras possíveis das palavras da lista.
  // É exatamente o que §6.4 mede em f_ench: a célula de enchimento é o INÍCIO de um
  // começo falso, e a letra seguinte já está na grade — a palavra parece começar ali
  // e quebra logo depois.
  const comecosPorLetra = new Map();
  for (const col of colocadas) {
    const t = col.texto;
    if (t.length < 2) continue;
    if (!comecosPorLetra.has(t[0])) comecosPorLetra.set(t[0], new Set());
    comecosPorLetra.get(t[0]).add(t[1]);
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
          // Letras que, postas aqui, fariam esta célula parecer o começo de uma
          // palavra da lista — porque a célula seguinte já tem a segunda letra.
          const letrasCandidatas = [];
          for (const d of direcoesPermitidas) {
            const segL = l + d.dl;
            const segC = c + d.dc;
            if (segL < 0 || segL >= n || segC < 0 || segC >= n) continue;
            const segunda = grade[segL][segC];
            if (!segunda) continue;
            for (const [primeira, segundas] of comecosPorLetra) {
              if (segundas.has(segunda)) letrasCandidatas.push(primeira);
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

// Fluxo completo de geração (§7.2):
//   gerador -> validador INDEPENDENTE -> dificuldade -> semente + 1, até 20 tentativas
//   20 falhas -> tabuleiro de reserva. Jamais uma tela de erro para ela.
export function gerarTabuleiro(sementeInicial, nGrade, nivel, temaForcado = null, tabuleiroReservaFallback = null) {
  let sementeAtual = sementeInicial;
  const cfg = obterParametrosNivel(nivel, nGrade);
  const [dMin, dMax] = cfg.faixaD;

  // Melhor tabuleiro válido visto, caso nenhum caia dentro da faixa e não haja reserva
  let melhorValido = null;
  let menorDistanciaD = Infinity;

  for (let tentativa = 0; tentativa < 20; tentativa++) {
    const tabuleiro = tentarGerar(sementeAtual, nGrade, nivel, temaForcado);
    sementeAtual = (sementeAtual + 1) >>> 0;
    if (!tabuleiro) continue;

    // O validador não conhece nenhuma anotação do gerador (§7.5)
    if (!validarTabuleiro(tabuleiro).valido) continue;

    if (tabuleiro.D >= dMin && tabuleiro.D <= dMax) return tabuleiro;

    const dist = tabuleiro.D < dMin ? (dMin - tabuleiro.D) : (tabuleiro.D - dMax);
    if (dist < menorDistanciaD) {
      menorDistanciaD = dist;
      melhorValido = tabuleiro;
    }
  }

  if (tabuleiroReservaFallback) {
    return { ...tabuleiroReservaFallback, semente: sementeInicial, fallbackReserva: true };
  }

  // Sem reserva à mão: um tabuleiro válido fora da faixa ainda é jogável.
  return melhorValido;
}
