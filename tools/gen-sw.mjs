// tools/gen-sw.mjs
// Gera dist/sw.js a partir do molde public/sw.js após o build do Vite (§11.1).
// Calcula hash SHA-1 de 10 dígitos do conteúdo de dist/ e monta a lista de pré-carga real.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const MOLDE_SW = path.resolve(__dirname, '../public/sw.js');
const DESTINO_SW = path.resolve(DIST_DIR, 'sw.js');

if (!fs.existsSync(DIST_DIR)) {
  console.error('Diretório dist/ não encontrado. Execute vite build primeiro.');
  process.exit(1);
}

// 1. Coletar todos os arquivos de dist/ recursivamente (exceto sw.js se já existir)
function coletarArquivos(dir, base = '') {
  const lista = [];
  const itens = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of itens) {
    const rel = path.posix.join(base, item.name);
    const abs = path.join(dir, item.name);

    if (item.isDirectory()) {
      lista.push(...coletarArquivos(abs, rel));
    } else if (item.isFile()) {
      if (item.name !== 'sw.js') {
        lista.push({ rel, abs });
      }
    }
  }

  return lista;
}

const arquivos = coletarArquivos(DIST_DIR);

// 2. Calcular hash SHA-1 do conteúdo de todos os arquivos
const hash = crypto.createHash('sha1');
for (const arq of arquivos.sort((a, b) => a.rel.localeCompare(b.rel))) {
  hash.update(arq.rel);
  hash.update(fs.readFileSync(arq.abs));
}
const versao = hash.digest('hex').slice(0, 10);

// 3. Montar lista de recursos para pré-carga
const recursos = [
  './',
  './index.html',
  ...arquivos.map(a => `./${a.rel}`)
];

// Remover duplicatas e manter caminhos relativos limpos
const recursosUnicos = Array.from(new Set(recursos));

// 4. Injetar no molde e gravar em dist/sw.js
let template = fs.readFileSync(MOLDE_SW, 'utf-8');
template = template.replace('__VERSAO__', versao);
template = template.replace('__RECURSOS__', JSON.stringify(recursosUnicos, null, 2));

// 5. Portão de sintaxe: um sw.js inválido não instala, e o app deixa de
// funcionar offline sem dar sinal nenhum. Falha o build em vez de publicar.
try {
  new vm.Script(template, { filename: 'dist/sw.js' });
} catch (erro) {
  console.error('\n✖ O Service Worker gerado é inválido e NÃO foi publicado:');
  console.error(`  ${erro.message}\n`);
  process.exit(1);
}

fs.writeFileSync(DESTINO_SW, template, 'utf-8');

console.log(`\n✔ Service Worker gerado em dist/sw.js`);
console.log(`  Versão do cache: cp-cache-${versao}`);
console.log(`  Total de recursos pré-carregados: ${recursosUnicos.length}\n`);
