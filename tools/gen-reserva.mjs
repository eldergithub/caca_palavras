// tools/gen-reserva.mjs
// Gera 50 tabuleiros de reserva pré-verificados em public/tabuleiros-reserva.json (§7.2, §10, §14).
// Roda no build / preparação.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gerarTabuleiro } from '../src/core/gerador.js';
import { validarTabuleiro } from '../src/core/validador.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAIDA = path.resolve(__dirname, '../public/tabuleiros-reserva.json');

console.log('Gerando tabuleiros reserva pré-verificados...');
const reservas = [];

// Gerar ~4 tabuleiros por nível (1 a 12), totalizando 48 tabuleiros
for (let nivel = 1; nivel <= 12; nivel++) {
  let obtidos = 0;
  let semente = 1000 * nivel + 42;

  while (obtidos < 4) {
    const tabuleiro = gerarTabuleiro(semente, 10, nivel);
    if (tabuleiro) {
      const v = validarTabuleiro(tabuleiro);
      if (v.valido) {
        reservas.push({
          semente: tabuleiro.semente,
          n: tabuleiro.n,
          nivel: tabuleiro.nivel,
          tema: tabuleiro.tema,
          grade: tabuleiro.grade,
          palavras: tabuleiro.palavras,
          D: tabuleiro.D
        });
        obtidos++;
      }
    }
    semente += 17;
  }
  console.log(`  Nível ${nivel}: ${obtidos} tabuleiros gerados e validados`);
}

fs.writeFileSync(SAIDA, JSON.stringify(reservas, null, 2) + '\n', 'utf-8');
console.log(`\n✔ Sucesso: ${reservas.length} tabuleiros gravados em public/tabuleiros-reserva.json`);
