// tools/test-core.mjs
// Runner de testes do Core sem DOM (§10).
// Zero dependências externas — roda no Node com `ok()` e `igual()`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizar, distanciaEdicao, ALFABETO } from '../src/core/texto.js';
import { BANCO_NORMALIZADO, CATEGORIAS, VIZINHAS, ehPalavraReal } from '../src/core/banco.js';
import { criarPrng, hash32 } from '../src/core/prng.js';
import { gerarTabuleiro } from '../src/core/gerador.js';
import { validarTabuleiro } from '../src/core/validador.js';
import { calcularDificuldade, obterParametrosNivel } from '../src/core/dificuldade.js';
import { criarPartida, casarComPendente } from '../src/core/partida.js';
import { processarFimDePartida } from '../src/core/escada.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let total = 0;
let passadas = 0;
let falhas = 0;

function ok(cond, msg) {
  total++;
  if (cond) {
    passadas++;
  } else {
    falhas++;
    console.error(`  ✖ FALHA: ${msg}`);
  }
}

function igual(obtido, esperado, msg) {
  total++;
  const strObtido = JSON.stringify(obtido);
  const strEsperado = JSON.stringify(esperado);
  if (strObtido === strEsperado) {
    passadas++;
  } else {
    falhas++;
    console.error(`  ✖ FALHA: ${msg} (Esperado: ${strEsperado}, Obtido: ${strObtido})`);
  }
}

console.log('\n--- Executando Suite de Testes do Core ---');

// 1. Texto e Português
console.log('\n[1] Normalização e Alfabeto:');
igual(normalizar('CORAÇÃO'), 'CORACAO', 'Normaliza cedilha e til');
igual(normalizar('CREPÚSCULO'), 'CREPUSCULO', 'Normaliza acento agudo');
igual(normalizar('HORTÊNSIA'), 'HORTENSIA', 'Normaliza acento circunflexo');
igual(normalizar('criança'), 'CRIANCA', 'Normaliza minúsculas para maiúsculas pt-BR');
ok(ALFABETO.length === 23, 'Alfabeto contém exatamente 23 letras');
ok(!ALFABETO.includes('K') && !ALFABETO.includes('W') && !ALFABETO.includes('Y'), 'Alfabeto exclui K, W e Y');

// Distância de edição
igual(distanciaEdicao('CASA', 'CAUSA'), 1, 'Distância Levenshtein CASA-CAUSA é 1');
igual(distanciaEdicao('TERCO', 'TRACO'), 2, 'Distância Levenshtein TERCO-TRACO é 2');

// 2. Banco de palavras em memória
console.log('\n[2] Banco de Palavras:');
ok(BANCO_NORMALIZADO.size >= 600, `Banco tem ${BANCO_NORMALIZADO.size} palavras (>= 600)`);
ok(ehPalavraReal('coração'), 'Reconhece palavra real com acento');
ok(ehPalavraReal('CORACAO'), 'Reconhece palavra real normalizada');
ok(!ehPalavraReal('XYZABC'), 'Rejeita palavra inexistente');
ok(VIZINHAS.length >= 8, `Pares de vizinhas tem ${VIZINHAS.length} pares`);

// 3. PRNG Determinístico
console.log('\n[3] PRNG Determinístico:');
const prng1 = criarPrng(12345);
const prng2 = criarPrng(12345);
const seq1 = [prng1.proximo(), prng1.proximoInt(1, 10), prng1.proximo()];
const seq2 = [prng2.proximo(), prng2.proximoInt(1, 10), prng2.proximo()];
igual(seq1, seq2, 'Mesma semente gera exatamente a mesma sequência de números');
ok(hash32('tema', 1, 5) > 0, 'Hash32 produz número positivo');

// 4. Gerador e Validador Independente nos 12 níveis
console.log('\n[4] Gerador x Validador (Amostragem nos 12 níveis):');
const pontuacoesPorNivel = {};

for (let nivel = 1; nivel <= 12; nivel++) {
  pontuacoesPorNivel[nivel] = [];
  // Gera 5 tabuleiros por nível para teste rápido do runner
  for (let i = 1; i <= 5; i++) {
    const sem = nivel * 1000 + i * 37;
    const tab = gerarTabuleiro(sem, 10, nivel);
    ok(tab !== null, `Gerou tabuleiro nv ${nivel} (amostra ${i})`);
    if (tab) {
      const v = validarTabuleiro(tab);
      ok(v.valido, `Tabuleiro nv ${nivel} (amostra ${i}) 100% válido: ${v.erros.join(', ')}`);
      pontuacoesPorNivel[nivel].push(tab.D);
    }
  }
}

// 5. Monotonia da dificuldade
console.log('\n[5] Monotonia de Dificuldade:');
const mediaD = (nv) => {
  const pts = pontuacoesPorNivel[nv] || [];
  return pts.reduce((a, b) => a + b, 0) / (pts.length || 1);
};
const mNivel2 = mediaD(2);
const mNivel5 = mediaD(5);
const mNivel8 = mediaD(8);
const mNivel11 = mediaD(11);
console.log(`  Médias D observadas: Nv2=${mNivel2.toFixed(1)}, Nv5=${mNivel5.toFixed(1)}, Nv8=${mNivel8.toFixed(1)}, Nv11=${mNivel11.toFixed(1)}`);
ok(mNivel8 > mNivel2, 'Dificuldade média do Nível 8 é maior que a do Nível 2');
ok(mNivel11 > mNivel5, 'Dificuldade média do Nível 11 é maior que a do Nível 5');

// 6. Determinismo da geração
console.log('\n[6] Determinismo da Grade Byte a Byte:');
const tabA = gerarTabuleiro(99999, 10, 5);
const tabB = gerarTabuleiro(99999, 10, 5);
igual(tabA.grade, tabB.grade, 'Mesma semente produz a mesma grade byte a byte');

// 7. Tabuleiros Reserva Pré-verificados
console.log('\n[7] Tabuleiros de Reserva:');
const arqReserva = path.resolve(__dirname, '../public/tabuleiros-reserva.json');
ok(fs.existsSync(arqReserva), 'Arquivo public/tabuleiros-reserva.json existe');
const reservas = JSON.parse(fs.readFileSync(arqReserva, 'utf-8'));
ok(reservas.length >= 40, `Possui ${reservas.length} tabuleiros de reserva (>= 40)`);
let reservasValidas = 0;
for (const res of reservas) {
  const v = validarTabuleiro(res);
  if (v.valido) reservasValidas++;
}
igual(reservasValidas, reservas.length, '100% dos tabuleiros reserva passam pelo validador');

// 8. Resolução de Partida e Tolerância de Extremidade (§3.3, §3.4)
console.log('\n[8] Resolução de Partida e 4 Desfechos:');

const tabTeste = gerarTabuleiro(481923, 10, 5);
const partida = criarPartida(tabTeste);
const primeiraPalavra = tabTeste.palavrasColocadas[0];
const celulasExatas = primeiraPalavra.celulas;

// 1. Acerto exato
const resAcerto = partida.resolverSelecao(celulasExatas);
igual(resAcerto.desfecho, 'acertou', 'Acerto exato reconhecido');
igual(resAcerto.palavra, primeiraPalavra.texto, 'Palavra correta identificada no acerto');

// Teste inverso (última letra para a primeira)
const segundaPalavra = tabTeste.palavrasColocadas[1];
const celulasInversas = [...segundaPalavra.celulas].reverse();
const resInverso = partida.resolverSelecao(celulasInversas);
igual(resInverso.desfecho, 'acertou', 'Seleção inversa reconhecida');

// Teste tolerância ±1 (adiciona 1 célula além da ponta)
const terceiraPalavra = tabTeste.palavrasColocadas[2];
const dirL = Math.sign(terceiraPalavra.celulas[1].l - terceiraPalavra.celulas[0].l);
const dirC = Math.sign(terceiraPalavra.celulas[1].c - terceiraPalavra.celulas[0].c);
const ult = terceiraPalavra.celulas[terceiraPalavra.celulas.length - 1];
const nxtL = ult.l + dirL;
const nxtC = ult.c + dirC;
if (nxtL >= 0 && nxtL < tabTeste.n && nxtC >= 0 && nxtC < tabTeste.n) {
  const celulasComSobra = [...terceiraPalavra.celulas, { l: nxtL, c: nxtC }];
  const resTolerancia = partida.resolverSelecao(celulasComSobra);
  igual(resTolerancia.desfecho, 'acertou', 'Tolerância motor ±1 aceitou palavra correta');
}

// 2. Toque único (1 célula só)
const resUnico = partida.resolverSelecao([celulasExatas[0]]);
igual(resUnico.desfecho, 'toque_unico', 'Toque de 1 célula não gera erro');

// 3. Erro (células sem sentido)
const resErro = partida.resolverSelecao([{ l: 0, c: 0 }, { l: 0, c: 1 }, { l: 0, c: 2 }]);
ok(resErro.desfecho === 'errou' || resErro.desfecho === 'palavra_real', 'Seleção inválida resulta em errou ou palavra_real');

// 9. Escada de Dificuldade que sobe e desce (§6.3)
console.log('\n[9] Escada de Dificuldade:');
let escada = { nivel: 5, seguidas: { direcao: 'mantem', quantas: 0 }, tempos: {}, ajusteManual: 0 };
// 1 vitória rápida -> marca 'sobe', quantas=1, continua no nível 5
escada = processarFimDePartida(escada, { segundos: 60, dicas: 0, abandonada: false });
igual(escada.nivel, 5, 'Primeira vitória não sobe de imediato (exige 2)');
igual(escada.seguidas.direcao, 'sobe', 'Registrou direção sobe');
// 2ª vitória rápida -> sobe para o nível 6!
escada = processarFimDePartida(escada, { segundos: 70, dicas: 0, abandonada: false });
igual(escada.nivel, 6, 'Segunda vitória consecutiva promove para o nível 6');

// Partida com muitas dicas -> pede para descer
escada = processarFimDePartida(escada, { segundos: 300, dicas: 3, abandonada: false });
igual(escada.nivel, 6, 'Primeiro rebaixamento não desce de imediato');
escada = processarFimDePartida(escada, { segundos: 300, dicas: 4, abandonada: false });
igual(escada.nivel, 5, 'Segundo rebaixamento consecutivo desce para o nível 5');

// Relatório
console.log(`\n========================================`);
console.log(`Total de verificações: ${total}`);
console.log(`Aprovadas: ${passadas}`);
console.log(`Falhas:    ${falhas}`);
console.log(`========================================\n`);

if (falhas > 0) {
  process.exit(1);
} else {
  console.log('✔ Todos os testes do Core foram concluídos com sucesso!\n');
  process.exit(0);
}
