// tools/valida-banco.mjs
// Validação automatizada do banco de palavras do Caça-Palavras.
// Roda no build (`npm run build` e `npm test`). Falha o build se houver infração.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizar, ALFABETO, distanciaEdicao } from '../src/core/texto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PALAVRAS_DIR = path.resolve(__dirname, '../public/palavras');

const CATEGORIAS_ESPERADAS = [
  'cotidiano', 'familia', 'natureza', 'animais', 'alimentos',
  'objetos', 'lugares', 'profissoes', 'cultura', 'literatura',
  'portugues', 'sentimentos', 'plantas', 'musica', 'corpo'
];

// Lista explícita de exceções legítimas a heurísticas de sufixo (§4.5)
const EXCECOES_SUFIXO = new Set([
  'CARINHO',   // não é diminutivo de caro
  'IRMAO',     // não é aumentativo de irma
  'VERAO',     // não é aumentativo
  'CORACAO',   // não é aumentativo
  'TROVAO',    // não é aumentativo
  'CAMINHO',   // não é diminutivo
  'VIZINHO',   // não é diminutivo
  'SOBRINHO',  // não é diminutivo
  'SOBRINHA',  // não é diminutivo
  'MADRINHA',  // não é diminutivo
  'PADRINHO',  // não é diminutivo
  'FARINHA',   // não é diminutivo
  'DESENHO',   // não é diminutivo
  'MOINHO',    // não é diminutivo
  'NINHO',     // não é diminutivo
  'FOLHINHA',  // calendário/agenda popular
  'RAZÃO',
  'PASSO',     // substantivo legítimo
  'LACO',      // substantivo
  'DISSE',     // (se substantivo ou exceção)
  'AVENIDA',
  'PARTIDA',
  'BEBIDA',
  'COMIDA',
  'SUBIDA',
  'DESCIDA',
  'MEDIDA'
]);

// Lista explícita de termos ofensivos / impróprios (§4.5)
const BLOQUEIO_OFENSIVO = new Set([
  'BOSTA', 'MERDA', 'PUTA', 'CU', 'CARALHO', 'FODA', 'FODER', 'PICA', 'VIADO',
  'CORNO', 'DESGRACA', 'IDIOTA', 'IMBECIL', 'BURRO', 'OTARIO', 'BABACA'
]);

// Sufixos verbais conjugados típicos que não devem constar (§4.5)
const SUFIXOS_CONJUGADOS = [
  'AMOS', 'ARAM', 'ASSEM', 'ARIAM', 'AVAM',
  'ERAM', 'IRAM', 'ASSE', 'ESSE', 'ISSE',
  'ARIAS', 'ERIAM', 'IRIAM', 'EMOS', 'IMOS',
  'ANDO', 'ENDO', 'INDO' // gerúndios rejeitados pelo critério de infinitivo
];

// Sufixos diminutivos / aumentativos
const SUFIXOS_GRAU = ['ZINHO', 'ZINHA', 'INHO', 'INHA', 'ARRAO', 'ZORRA'];

let erros = [];
let avisos = [];

function adicionarErro(msg) {
  erros.push(`[ERRO] ${msg}`);
}

function adicionarAviso(msg) {
  avisos.push(`[AVISO] ${msg}`);
}

// 1. Checar codificação UTF-8 sem BOM
function checarArquivoUTF8SemBOM(caminho) {
  const buf = fs.readFileSync(caminho);
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    adicionarErro(`${path.basename(caminho)} contém BOM (Byte Order Mark), proibido (§4.3)`);
  }
}

// Carregar categorias
const todasPalavras = [];
const mapaPorNormalizada = new Map(); // n -> { t, n, nv, categoria }
const mapaPorTexto = new Map();       // t -> categoria
const categoriasContagem = {};
let totalNv1 = 0;
let totalNv2 = 0;
let totalNv3 = 0;

for (const cat of CATEGORIAS_ESPERADAS) {
  const arq = path.join(PALAVRAS_DIR, `${cat}.json`);
  if (!fs.existsSync(arq)) {
    adicionarErro(`Arquivo de categoria obrigatória faltando: ${cat}.json`);
    continue;
  }

  checarArquivoUTF8SemBOM(arq);

  let conteudo;
  try {
    conteudo = JSON.parse(fs.readFileSync(arq, 'utf-8'));
  } catch (e) {
    adicionarErro(`Erro de sintaxe JSON em ${cat}.json: ${e.message}`);
    continue;
  }

  if (!Array.isArray(conteudo)) {
    adicionarErro(`${cat}.json deve conter um array de registros`);
    continue;
  }

  categoriasContagem[cat] = conteudo.length;
  if (conteudo.length < 40 || conteudo.length > 60) {
    adicionarAviso(`${cat}.json tem ${conteudo.length} palavras (ideal: 40 a 60 palavras por categoria)`);
  }

  for (const reg of conteudo) {
    if (!reg || typeof reg !== 'object') {
      adicionarErro(`${cat}.json: registro inválido encontrado`);
      continue;
    }

    const { t, n, nv } = reg;

    if (!t || typeof t !== 'string') {
      adicionarErro(`${cat}.json: campo 't' inválido ou ausente em ${JSON.stringify(reg)}`);
      continue;
    }
    if (!n || typeof n !== 'string') {
      adicionarErro(`${cat}.json: campo 'n' inválido ou ausente em ${t}`);
      continue;
    }
    if (typeof nv !== 'number' || nv < 1 || nv > 3) {
      adicionarErro(`${cat}.json: campo 'nv' deve ser 1, 2 ou 3 em ${t}`);
    }

    // Regra: Sem hífen e sem espaço
    if (t.includes('-') || t.includes(' ') || n.includes('-') || n.includes(' ')) {
      adicionarErro(`${t} contém hífen ou espaço, proibido (§4.5)`);
    }

    // Regra: Comprimento entre 4 e 11 letras
    if (n.length < 4 || n.length > 11) {
      adicionarErro(`${t} (${n}) tem ${n.length} letras; deve ter entre 4 e 11 letras (§4.5)`);
    }

    // Regra: Sem K, W, Y
    if (/[KWY]/.test(n) || /[KWYkwy]/.test(t)) {
      adicionarErro(`${t} contém letra K, W ou Y, proibido (§4.4, §4.5)`);
    }

    // Regra: Apenas letras válidas do ALFABETO
    for (const char of n) {
      if (!ALFABETO.includes(char)) {
        adicionarErro(`${t} possui caractere normalizado inválido: '${char}'`);
      }
    }

    // Regra: t normaliza exatamente para n
    const esperado = normalizar(t);
    if (esperado !== n) {
      adicionarErro(`${t} normaliza para '${esperado}', mas 'n' gravado é '${n}' (§4.3)`);
    }

    // Regra: Bloqueio ofensivo
    if (BLOQUEIO_OFENSIVO.has(n)) {
      adicionarErro(`${t} é termo proibido por regra de bloqueio (§4.5)`);
    }

    // Regra: Sem duplicata de n nem t
    if (mapaPorNormalizada.has(n)) {
      const anterior = mapaPorNormalizada.get(n);
      adicionarErro(`Colisão de forma normalizada '${n}': '${t}' (${cat}) colide com '${anterior.t}' (${anterior.categoria}) (§4.5)`);
    } else {
      mapaPorNormalizada.set(n, { t, n, nv, categoria: cat });
    }

    if (mapaPorTexto.has(t)) {
      adicionarErro(`Palavra duplicada '${t}' em ${cat} e ${mapaPorTexto.get(t)}`);
    } else {
      mapaPorTexto.set(t, cat);
    }

    // Contagem de níveis
    if (nv === 1) totalNv1++;
    if (nv === 2) totalNv2++;
    if (nv === 3) totalNv3++;

    todasPalavras.push({ t, n, nv, categoria: cat });
  }
}

// 2. Checar relações morfológicas (plural quando singular existe, verbos conjugados, diminutivos)
const setNormalizadas = new Set(mapaPorNormalizada.keys());

for (const { t, n } of todasPalavras) {
  // Plural simples: se termina em S e removendo S (ou ES) temos palavra no banco
  if (n.endsWith('S')) {
    const semS = n.slice(0, -1);
    if (setNormalizadas.has(semS)) {
      adicionarErro(`Plural '${t}' encontrado no banco quando singular '${mapaPorNormalizada.get(semS).t}' já existe (§4.5)`);
    }
    if (n.endsWith('ES')) {
      const semES = n.slice(0, -2);
      if (setNormalizadas.has(semES)) {
        adicionarErro(`Plural '${t}' encontrado no banco quando singular '${mapaPorNormalizada.get(semES).t}' já existe (§4.5)`);
      }
    }
  }

  // Sufixos de flexão verbal conjugada
  if (!EXCECOES_SUFIXO.has(n)) {
    for (const suf of SUFIXOS_CONJUGADOS) {
      if (n.endsWith(suf) && n.length > suf.length + 2) {
        adicionarErro(`Possível flexão verbal conjugada '${t}' terminada em '${suf}' (§4.5)`);
      }
    }

    // Sufixos diminutivos / aumentativos
    for (const suf of SUFIXOS_GRAU) {
      if (n.endsWith(suf) && n.length > suf.length + 2) {
        // Se o radical ou base existe no banco
        const radical = n.slice(0, -suf.length);
        for (const outra of setNormalizadas) {
          if (outra !== n && (outra === radical || outra.startsWith(radical))) {
            adicionarErro(`Possível diminutivo/aumentativo '${t}' com base '${mapaPorNormalizada.get(outra).t}' (§4.5)`);
            break;
          }
        }
      }
    }
  }
}

// 3. Checar distribuição de níveis lexicais (§4.7)
const total = todasPalavras.length;
if (total > 0) {
  const pct1 = (totalNv1 / total) * 100;
  const pct2 = (totalNv2 / total) * 100;
  const pct3 = (totalNv3 / total) * 100;

  // Alvos: nv1 ~45% (37-53%), nv2 ~40% (32-48%), nv3 ~15% (7-23%)
  if (pct1 < 37 || pct1 > 53) {
    adicionarAviso(`Distribuição nv1 está em ${pct1.toFixed(1)}% (alvo: ~45% ± 8%)`);
  }
  if (pct2 < 32 || pct2 > 48) {
    adicionarAviso(`Distribuição nv2 está em ${pct2.toFixed(1)}% (alvo: ~40% ± 8%)`);
  }
  if (pct3 < 7 || pct3 > 23) {
    adicionarAviso(`Distribuição nv3 está em ${pct3.toFixed(1)}% (alvo: ~15% ± 8%)`);
  }
}

// 4. Checar _vizinhas.json
const arqVizinhas = path.join(PALAVRAS_DIR, '_vizinhas.json');
if (!fs.existsSync(arqVizinhas)) {
  adicionarErro(`Arquivo _vizinhas.json não encontrado em ${PALAVRAS_DIR}`);
} else {
  checarArquivoUTF8SemBOM(arqVizinhas);
  let pares;
  try {
    pares = JSON.parse(fs.readFileSync(arqVizinhas, 'utf-8'));
  } catch (e) {
    adicionarErro(`Erro de sintaxe JSON em _vizinhas.json: ${e.message}`);
    pares = [];
  }

  if (!Array.isArray(pares)) {
    adicionarErro(`_vizinhas.json deve ser um array de pares`);
  } else {
    for (const par of pares) {
      if (!Array.isArray(par) || par.length !== 2) {
        adicionarErro(`Par inválido em _vizinhas.json: ${JSON.stringify(par)}`);
        continue;
      }
      const [p1, p2] = par;
      const n1 = normalizar(p1);
      const n2 = normalizar(p2);

      if (!setNormalizadas.has(n1)) {
        adicionarErro(`Palavra '${p1}' de _vizinhas.json não consta no banco de palavras`);
      }
      if (!setNormalizadas.has(n2)) {
        adicionarErro(`Palavra '${p2}' de _vizinhas.json não consta no banco de palavras`);
      }

      if (setNormalizadas.has(n1) && setNormalizadas.has(n2)) {
        const d = distanciaEdicao(n1, n2);
        if (d !== 1 && d !== 2) {
          adicionarErro(`Par ['${p1}', '${p2}'] em _vizinhas.json tem distância de edição ${d}; esperado 1 ou 2 (§4.7)`);
        }
      }
    }
  }
}

// Relatório final
console.log(`\n========================================`);
console.log(`Validação do Banco de Palavras:`);
console.log(`Total de palavras curadas: ${total}`);
console.log(`Nível 1 (familiar):   ${totalNv1} (${total > 0 ? ((totalNv1/total)*100).toFixed(1) : 0}%)`);
console.log(`Nível 2 (culta):      ${totalNv2} (${total > 0 ? ((totalNv2/total)*100).toFixed(1) : 0}%)`);
console.log(`Nível 3 (repertório): ${totalNv3} (${total > 0 ? ((totalNv3/total)*100).toFixed(1) : 0}%)`);
console.log(`========================================\n`);

if (avisos.length > 0) {
  console.log(`Avisos (${avisos.length}):`);
  for (const av of avisos) console.warn(`  ${av}`);
  console.log('');
}

if (erros.length > 0) {
  console.error(`ERROS CRÍTICOS (${erros.length}):`);
  for (const err of erros) console.error(`  ${err}`);
  console.error(`\nBuild abortado por violação das regras do banco (§4.5).`);
  process.exit(1);
} else {
  console.log(`✔ Banco de palavras 100% aprovado!\n`);
  process.exit(0);
}
