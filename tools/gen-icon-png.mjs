// tools/gen-icon-png.mjs
// Orquestra a geração de todos os ícones PNG (512, 192, 180, 144, 96, 72, 48, maskable)
// a partir dos vetores SVG oficiais em alta fidelidade.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPython = path.resolve(__dirname, 'generate-icons.py');

console.log('Iniciando gerador de ícones PWA e Favicon...');
const resultado = spawnSync('python', [scriptPython], { stdio: 'inherit' });

if (resultado.error) {
  console.error('Erro ao executar gerador de ícones:', resultado.error);
  process.exit(1);
}

if (resultado.status !== 0) {
  console.error(`O gerador encerrou com status ${resultado.status}`);
  process.exit(resultado.status || 1);
}

console.log('✔ Todos os ícones foram atualizados com sucesso.');
