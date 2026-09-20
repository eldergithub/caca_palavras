// tools/test-core.mjs
// Runner de testes sem DOM (§10). Zero dependências externas: `ok()` e `igual()`.
// Quantidade de sementes por nível: SEMENTES_POR_NIVEL (o CI usa 20.000, §10).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizar, distanciaEdicao, ALFABETO } from '../src/core/texto.js';
import { BANCO_NORMALIZADO, VIZINHAS, ehPalavraReal } from '../src/core/banco.js';
import { criarPrng, hash32 } from '../src/core/prng.js';
import { gerarTabuleiro, tentarGerar } from '../src/core/gerador.js';
import { validarTabuleiro } from '../src/core/validador.js';
import { obterParametrosNivel } from '../src/core/dificuldade.js';
import { criarPartida } from '../src/core/partida.js';
import { processarFimDePartida, ajustarNivelManualmente, obterNivelEfetivo } from '../src/core/escada.js';
import { calcularLayout, CELULA_MINIMA, ALTURA_BOTAO_MIN, FONTE_LISTA_MINIMA } from '../src/ui/layout.js';
import { pontoParaCelula, calcularSegmentoProjetado, conectarDoisToques } from '../src/ui/selecao.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEMENTES_POR_NIVEL = Number(process.env.SEMENTES_POR_NIVEL) || 300;

let total = 0;
let passadas = 0;
let falhas = 0;

function ok(cond, msg) {
  total++;
  if (cond) passadas++;
  else {
    falhas++;
    console.error(`  ✖ FALHA: ${msg}`);
  }
}

function igual(obtido, esperado, msg) {
  total++;
  const a = JSON.stringify(obtido);
  const b = JSON.stringify(esperado);
  if (a === b) passadas++;
  else {
    falhas++;
    console.error(`  ✖ FALHA: ${msg} (esperado ${b}, obtido ${a})`);
  }
}

console.log('\n--- Suite de testes do Core ---');

// ─────────────────────────────────────────────────────────────
console.log('\n[1] Texto pt-BR e alfabeto:');
igual(normalizar('CORAÇÃO'), 'CORACAO', 'Normaliza cedilha e til');
igual(normalizar('CREPÚSCULO'), 'CREPUSCULO', 'Normaliza acento agudo');
igual(normalizar('HORTÊNSIA'), 'HORTENSIA', 'Normaliza circunflexo');
igual(normalizar('criança'), 'CRIANCA', 'Minúsculas viram maiúsculas pt-BR');
ok(ALFABETO.length === 23, 'Alfabeto tem 23 letras');
ok(!ALFABETO.includes('K') && !ALFABETO.includes('W') && !ALFABETO.includes('Y'), 'Alfabeto exclui K, W e Y');
igual(distanciaEdicao('CASA', 'CAUSA'), 1, 'Distância CASA-CAUSA é 1');
igual(distanciaEdicao('TERCO', 'TRACO'), 2, 'Distância TERCO-TRACO é 2');

// ─────────────────────────────────────────────────────────────
console.log('\n[2] Banco de palavras:');
ok(BANCO_NORMALIZADO.size >= 600, `Banco tem ${BANCO_NORMALIZADO.size} palavras (>= 600)`);
ok(ehPalavraReal('coração'), 'Reconhece palavra real com acento');
ok(ehPalavraReal('CORACAO'), 'Reconhece palavra real normalizada');
ok(!ehPalavraReal('XYZABC'), 'Rejeita palavra inexistente');
ok(VIZINHAS.length >= 8, `${VIZINHAS.length} pares de vizinhas`);

// O arquivo publicado e o módulo embutido têm de continuar iguais (§4.3)
const dirPalavras = path.resolve(__dirname, '../public/palavras');
const { CATEGORIAS, VIZINHAS: VIZ } = await import('../src/core/dados-banco.js');
{
  let divergentes = 0;
  for (const [cat, lista] of Object.entries(CATEGORIAS)) {
    const arq = path.join(dirPalavras, `${cat}.json`);
    if (!fs.existsSync(arq)) { divergentes++; continue; }
    const doArquivo = JSON.parse(fs.readFileSync(arq, 'utf-8'));
    if (JSON.stringify(doArquivo) !== JSON.stringify(lista)) divergentes++;
  }
  const vizArquivo = JSON.parse(fs.readFileSync(path.join(dirPalavras, '_vizinhas.json'), 'utf-8'));
  igual(divergentes, 0, 'public/palavras/*.json e src/core/dados-banco.js estão sincronizados');
  igual(JSON.stringify(vizArquivo), JSON.stringify(VIZ), '_vizinhas.json sincronizado com o módulo');
}
// ─────────────────────────────────────────────────────────────
console.log('\n[3] PRNG determinístico:');
const p1 = criarPrng(12345);
const p2 = criarPrng(12345);
igual(
  [p1.proximo(), p1.proximoInt(1, 10), p1.proximo()],
  [p2.proximo(), p2.proximoInt(1, 10), p2.proximo()],
  'Mesma semente gera a mesma sequência'
);
ok(hash32('tema', 1, 5) > 0, 'hash32 produz inteiro positivo');

// ─────────────────────────────────────────────────────────────
console.log(`\n[4] Gerador × validador (${SEMENTES_POR_NIVEL} sementes × 12 níveis):`);
const resumoD = {};
let invalidos = 0;
let nulos = 0;
let foraDaFaixa = 0;
let totalGerados = 0;

for (let nivel = 1; nivel <= 12; nivel++) {
  const cfg = obterParametrosNivel(nivel, 11);
  const [dMin, dMax] = cfg.faixaD;
  const direcoesPermitidas = new Set(cfg.direcoes);
  const Ds = [];

  for (let i = 0; i < SEMENTES_POR_NIVEL; i++) {
    const tab = tentarGerar(hash32(nivel, i, 'teste'), 11, nivel);
    if (!tab) { nulos++; continue; }
    totalGerados++;

    const v = validarTabuleiro(tab);
    if (!v.valido) {
      invalidos++;
      if (invalidos <= 3) console.error(`    nv${nivel} semente ${i}: ${v.erros.join(' | ')}`);
      continue;
    }

    // Nenhuma direção fora das permitidas pelo nível (§7.5, item 3)
    for (const col of tab.palavrasColocadas) {
      if (!direcoesPermitidas.has(col.dirId)) invalidos++;
    }

    Ds.push(tab.D);
    if (tab.D < dMin || tab.D > dMax) foraDaFaixa++;
  }

  Ds.sort((a, b) => a - b);
  resumoD[nivel] = { mediana: Ds[Math.floor(Ds.length / 2)], faixa: `${dMin}-${dMax}` };
}

igual(invalidos, 0, 'Nenhum tabuleiro reprovado pelo validador independente');
ok(nulos / (12 * SEMENTES_POR_NIVEL) < 0.05, `Falhas de colocação abaixo de 5% (${nulos})`);

// §10: D dentro da faixa do nível em >= 99% das sementes
const percentualDentro = 100 * (1 - foraDaFaixa / totalGerados);
ok(
  percentualDentro >= 99,
  `D dentro da faixa em ${percentualDentro.toFixed(2)}% das sementes (exigido >= 99%)`
);

// ─────────────────────────────────────────────────────────────
console.log('\n[5] Monotonia da dificuldade:');
console.log('  medianas: ' + Object.entries(resumoD).map(([nv, r]) => `nv${nv}=${r.mediana}`).join(' '));
ok(resumoD[8].mediana > resumoD[4].mediana, 'Mediana do nível 8 é maior que a do nível 4');
ok(resumoD[12].mediana > resumoD[6].mediana, 'Mediana do nível 12 é maior que a do nível 6');

// Subida garantida a cada 3 degraus. Adjacentes podem empatar: do 10 ao 12 a
// tabela de §6.2 só varia a meta de cruzamentos, então a diferença é pequena.
let subidaPorTrio = true;
for (let nv = 1; nv + 3 <= 12; nv++) {
  if (resumoD[nv + 3].mediana <= resumoD[nv].mediana) subidaPorTrio = false;
}
ok(subidaPorTrio, 'A cada 3 níveis a mediana de D sobe de verdade');

let semRecuo = true;
for (let nv = 2; nv <= 12; nv++) {
  if (resumoD[nv].mediana < resumoD[nv - 1].mediana - 2) semRecuo = false;
}
ok(semRecuo, 'Nenhum nível é mais fácil que o anterior (tolerância de 2 pontos)');

// ─────────────────────────────────────────────────────────────
console.log('\n[6] Determinismo da grade byte a byte:');
const tabA = gerarTabuleiro(99999, 10, 5);
const tabB = gerarTabuleiro(99999, 10, 5);
igual(tabA.grade, tabB.grade, 'Mesma semente produz a mesma grade');
igual(tabA.palavras, tabB.palavras, 'Mesma semente produz a mesma lista de palavras');

// ─────────────────────────────────────────────────────────────
console.log('\n[7] Tabuleiros de reserva:');
const arqReserva = path.resolve(__dirname, '../public/tabuleiros-reserva.json');
ok(fs.existsSync(arqReserva), 'public/tabuleiros-reserva.json existe');
const reservas = JSON.parse(fs.readFileSync(arqReserva, 'utf-8'));
ok(reservas.length >= 40, `${reservas.length} tabuleiros de reserva (>= 40)`);
igual(
  reservas.filter(r => validarTabuleiro(r).valido).length,
  reservas.length,
  '100% dos tabuleiros de reserva passam pelo validador'
);

// ─────────────────────────────────────────────────────────────
console.log('\n[8] Os quatro desfechos de uma seleção (§3.4):');
const tabTeste = gerarTabuleiro(481923, 10, 5);
const partida = criarPartida(tabTeste);
const primeira = tabTeste.palavrasColocadas[0];

const rAcerto = partida.resolverSelecao(primeira.celulas);
igual(rAcerto.desfecho, 'acertou', 'Acerto exato reconhecido');
igual(rAcerto.palavra, primeira.texto, 'Palavra correta identificada');

const segunda = tabTeste.palavrasColocadas[1];
igual(
  partida.resolverSelecao([...segunda.celulas].reverse()).desfecho,
  'acertou',
  'Seleção invertida aceita (§3.3, item 5)'
);

// Tolerância de ponta: aceita a palavra certa
const terceira = tabTeste.palavrasColocadas[2];
const dl = Math.sign(terceira.celulas[1].l - terceira.celulas[0].l);
const dc = Math.sign(terceira.celulas[1].c - terceira.celulas[0].c);
const ult = terceira.celulas[terceira.celulas.length - 1];
const extraL = ult.l + dl;
const extraC = ult.c + dc;
if (extraL >= 0 && extraL < tabTeste.n && extraC >= 0 && extraC < tabTeste.n) {
  igual(
    partida.resolverSelecao([...terceira.celulas, { l: extraL, c: extraC }]).desfecho,
    'acertou',
    'Tolerância ±1 perdoa o erro motor (§3.3, item 4)'
  );
}

// ... e rejeita lixo: um segmento que não soletra palavra pendente nem com ±1
const partidaLixo = criarPartida(gerarTabuleiro(481923, 10, 5));
let lixoAceito = 0;
for (let l = 0; l < tabTeste.n; l++) {
  for (let c = 0; c + 3 < tabTeste.n; c++) {
    const seg = [0, 1, 2, 3].map(k => ({ l, c: c + k }));
    const texto = seg.map(cel => tabTeste.grade[cel.l][cel.c]).join('');
    const ehPalavra = BANCO_NORMALIZADO.has(texto)
      || BANCO_NORMALIZADO.has(texto.split('').reverse().join(''));
    const r = partidaLixo.resolverSelecao(seg);
    if (r.desfecho === 'acertou' && !tabTeste.palavras.some(p => p.n === r.palavra)) lixoAceito++;
    if (r.desfecho === 'errou' && ehPalavra) lixoAceito++;
  }
}
igual(lixoAceito, 0, 'A tolerância ±1 não inventa acertos nem nega palavra real');

igual(partida.resolverSelecao([primeira.celulas[0]]).desfecho, 'toque_unico', 'Uma célula só não é erro');

// Palavra real fora da lista é reconhecida, não recusada (§3.4, item 2)
const partidaReal = criarPartida(gerarTabuleiro(481923, 10, 5));
const palavraForaDaLista = [...BANCO_NORMALIZADO].find(
  p => p.length === 4 && !tabTeste.palavras.some(x => x.n === p)
);
const gradeFalsa = {
  ...tabTeste,
  grade: tabTeste.grade.map(linha => [...linha]),
};
for (let k = 0; k < palavraForaDaLista.length; k++) gradeFalsa.grade[0][k] = palavraForaDaLista[k];
const partidaFalsa = criarPartida(gradeFalsa);
igual(
  partidaFalsa.resolverSelecao([0, 1, 2, 3].map(k => ({ l: 0, c: k }))).desfecho,
  'palavra_real',
  'Palavra real fora da lista produz lampejo âmbar, não erro'
);
ok(partidaReal.estaCompleto() === false, 'Partida nova não nasce completa');

// ─────────────────────────────────────────────────────────────
console.log('\n[9] Geometria da seleção (§3.1, §3.3):');
const cfgL = { n: 10, celula: 34, vao: 4, tamanhoGrade: 10 * 34 + 9 * 4 };
const passo = cfgL.celula + cfgL.vao;
const centro = (l, c) => ({ x: c * passo + cfgL.celula / 2, y: l * passo + cfgL.celula / 2 });

// Todo pixel da grade ancora em alguma célula — zero pixel morto (§3.3, itens 1 e 2)
let ancoraSempre = true;
for (let x = 0; x < cfgL.tamanhoGrade; x += 3) {
  for (let y = 0; y < cfgL.tamanhoGrade; y += 3) {
    const cel = pontoParaCelula(x, y, cfgL);
    if (!Number.isInteger(cel.l) || cel.l < 0 || cel.l > 9 || cel.c < 0 || cel.c > 9) ancoraSempre = false;
  }
}
ok(ancoraSempre, 'Qualquer pixel dentro da grade ancora numa célula válida');

// Desvio de 18 px fora da linha produz o segmento certo (critério de aceite nº 4)
const ancora = { l: 3, c: 1 };
const destino = centro(3, 7);
const segDesviado = calcularSegmentoProjetado(ancora, { x: destino.x, y: destino.y + 18 }, cfgL);
igual(segDesviado.length, 7, 'Desvio de 18 px mantém o comprimento do segmento');
igual(segDesviado.map(s => s.l), [3, 3, 3, 3, 3, 3, 3], 'Desvio de 18 px mantém a seleção reta');
igual(segDesviado[6].c, 7, 'Desvio de 18 px termina na célula certa');

// O dedo sair da grade limita o comprimento e não cancela (§3.3, item 3)
const segForaDaGrade = calcularSegmentoProjetado(ancora, { x: destino.x + 900, y: destino.y }, cfgL);
igual(segForaDaGrade[segForaDaGrade.length - 1].c, 9, 'Fora da grade o segmento para na borda');
ok(segForaDaGrade.length > 1, 'Fora da grade a seleção continua viva');

// Diagonal
const segDiagonal = calcularSegmentoProjetado({ l: 0, c: 0 }, centro(4, 4), cfgL);
igual(segDiagonal.length, 5, 'Diagonal projeta o comprimento correto');
igual(segDiagonal[4], { l: 4, c: 4 }, 'Diagonal termina na célula certa');

// Dois toques
igual(conectarDoisToques({ l: 2, c: 2 }, { l: 2, c: 5 }).length, 4, 'Dois toques na horizontal');
igual(conectarDoisToques({ l: 2, c: 2 }, { l: 5, c: 5 }).length, 4, 'Dois toques na diagonal');
igual(conectarDoisToques({ l: 2, c: 2 }, { l: 4, c: 7 }), null, 'Dois toques desalinhados caem na projeção');

// ─────────────────────────────────────────────────────────────
console.log('\n[10] Varredura de telas (§5.2, §10):');
let violacoes = [];
for (let larg = 320; larg <= 430; larg += 10) {
  for (let alt = 560; alt <= 950; alt += 10) {
    for (const qtd of [8, 9, 10]) {
      const L = calcularLayout(larg, alt, 11, 0, qtd);
      if (L.celula < CELULA_MINIMA) violacoes.push(`${larg}x${alt} q${qtd}: célula ${L.celula}`);
      if (L.alturaBotoes < ALTURA_BOTAO_MIN) violacoes.push(`${larg}x${alt} q${qtd}: botão ${L.alturaBotoes}`);
      if (L.tamanhoFonteLista < FONTE_LISTA_MINIMA) violacoes.push(`${larg}x${alt} q${qtd}: fonte ${L.tamanhoFonteLista}`);
      if (L.alturaTotalUsada > alt) violacoes.push(`${larg}x${alt} q${qtd}: usa ${L.alturaTotalUsada}px`);
      if (L.n < 8) violacoes.push(`${larg}x${alt} q${qtd}: n=${L.n}`);
    }
  }
}
if (violacoes.length) console.error('    ' + violacoes.slice(0, 5).join('\n    '));
igual(violacoes.length, 0, 'Célula >= 30 px, botões >= 64 px, fonte da lista >= 18 px e nada transborda');

// A ordem de cedência de §5.2: o tema some antes de a lista encolher
const telaBaixa = calcularLayout(360, 600, 11, 0, 10);
const telaAlta = calcularLayout(360, 900, 11, 0, 10);
ok(telaAlta.exibirTema, 'Em tela alta o rótulo de tema aparece');
ok(!telaBaixa.exibirTema || telaBaixa.alturaLinhaLista === telaAlta.alturaLinhaLista,
  'O tema cede antes da lista encolher');

// A engrenagem move o piso de célula em ±3 px (§5.4)
const comLetrasMaiores = calcularLayout(412, 915, 11, 3, 10);
const padrao = calcularLayout(412, 915, 11, 0, 10);
ok(comLetrasMaiores.celula >= padrao.celula, 'Letras maiores não reduzem a célula');

// ─────────────────────────────────────────────────────────────
console.log('\n[11] Persistência (§7.6):');
const memoria = new Map();
globalThis.localStorage = {
  getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
  setItem: (k, v) => memoria.set(k, String(v)),
  removeItem: (k) => memoria.delete(k),
};
const { salvarPartida, carregarPartida, carregarStats, carregarAjustes } = await import('../src/storage.js');

const tabSalvo = gerarTabuleiro(777777, 10, 4);
const partidaSalvar = criarPartida(tabSalvo);
partidaSalvar.resolverSelecao(tabSalvo.palavrasColocadas[0].celulas);
salvarPartida(partidaSalvar.obterDadosParaSalvar());

const recuperada = carregarPartida();
igual(recuperada.semente, tabSalvo.semente, 'Semente salva e recuperada');
igual(recuperada.encontradas, [tabSalvo.palavrasColocadas[0].texto], 'Palavras encontradas preservadas');

const tabRecriado = gerarTabuleiro(recuperada.semente, recuperada.n, recuperada.nivel, recuperada.tema);
igual(tabRecriado.grade, tabSalvo.grade, 'O tabuleiro é reconstruído idêntico a partir da semente');

memoria.set('cp_partida_v1', '{isto não é json');
igual(carregarPartida(), null, 'JSON corrompido é descartado em silêncio');

memoria.set('cp_partida_v1', JSON.stringify({ v: 99, semente: 1, n: 10, nivel: 1, tema: 'animais', encontradas: [] }));
igual(carregarPartida(), null, 'Versão diferente é descartada em silêncio');

memoria.set('cp_partida_v1', JSON.stringify({ v: 1, semente: 'abc' }));
igual(carregarPartida(), null, 'Estrutura inesperada é descartada em silêncio');

memoria.set('cp_stats_v1', 'lixo');
igual(carregarStats().concluidas, 0, 'Stats corrompidos voltam ao padrão');
memoria.set('cp_ajustes_v1', 'lixo');
igual(carregarAjustes().deltaCelulaPx, 0, 'Ajustes corrompidos voltam ao padrão');

// ─────────────────────────────────────────────────────────────
console.log('\n[12] Escada que sobe e desce (§6.3):');
let escada = { nivel: 5, seguidas: { direcao: 'mantem', quantas: 0 }, tempos: {}, ajusteManual: 0 };
escada = processarFimDePartida(escada, { segundos: 60, dicas: 0, abandonada: false });
igual(escada.nivel, 5, 'Uma vitória rápida não sobe de imediato');
igual(escada.seguidas.direcao, 'sobe', 'Direção "sobe" registrada');
escada = processarFimDePartida(escada, { segundos: 70, dicas: 0, abandonada: false });
igual(escada.nivel, 6, 'Duas vitórias rápidas seguidas sobem um nível');

escada = processarFimDePartida(escada, { segundos: 300, dicas: 3, abandonada: false });
igual(escada.nivel, 6, 'Um rebaixamento não desce de imediato');
escada = processarFimDePartida(escada, { segundos: 300, dicas: 4, abandonada: false });
igual(escada.nivel, 5, 'Dois rebaixamentos seguidos descem um nível');

// Jogadora que sempre acerta sobe até o 12 e para
let subindo = { nivel: 1, seguidas: { direcao: 'mantem', quantas: 0 }, tempos: {}, ajusteManual: 0 };
for (let i = 0; i < 60; i++) subindo = processarFimDePartida(subindo, { segundos: 10, dicas: 0, abandonada: false });
igual(subindo.nivel, 12, 'Quem sempre acerta chega ao 12 e para lá');

// Jogadora que sempre pede dica desce até o 1 e para
let descendo = { nivel: 12, seguidas: { direcao: 'mantem', quantas: 0 }, tempos: {}, ajusteManual: 0 };
for (let i = 0; i < 60; i++) descendo = processarFimDePartida(descendo, { segundos: 9999, dicas: 5, abandonada: false });
igual(descendo.nivel, 1, 'Quem sempre pede dica desce ao 1 e para lá');

// Sem oscilação: alternar sobe/desce não move o nível
let oscilando = { nivel: 6, seguidas: { direcao: 'mantem', quantas: 0 }, tempos: {}, ajusteManual: 0 };
for (let i = 0; i < 20; i++) {
  oscilando = processarFimDePartida(oscilando, i % 2 === 0
    ? { segundos: 10, dicas: 0, abandonada: false }
    : { segundos: 99999, dicas: 9, abandonada: false });
}
igual(oscilando.nivel, 6, 'Resultados alternados não oscilam o nível');

// Ajuste manual da engrenagem fica preso à faixa 1..12
let comAjuste = { nivel: 5, seguidas: { direcao: 'mantem', quantas: 0 }, tempos: {}, ajusteManual: 0 };
for (let i = 0; i < 20; i++) comAjuste = ajustarNivelManualmente(comAjuste, +1);
igual(obterNivelEfetivo(comAjuste), 12, 'Muitos toques em "mais difícil" param no 12');
comAjuste = ajustarNivelManualmente(comAjuste, -1);
igual(obterNivelEfetivo(comAjuste), 11, 'E um toque em "mais fácil" responde na hora');

// ─────────────────────────────────────────────────────────────
console.log(`\n========================================`);
console.log(`Total de verificações: ${total}`);
console.log(`Aprovadas: ${passadas}`);
console.log(`Falhas:    ${falhas}`);
console.log(`========================================\n`);

if (falhas > 0) process.exit(1);
console.log('✔ Todos os testes do Core passaram.\n');
process.exit(0);
