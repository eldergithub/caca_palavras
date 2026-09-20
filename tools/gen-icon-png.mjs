// tools/gen-icon-png.mjs
// Gera ícones PNG válidos (192, 512, maskable) em Node puro sem dependências externas.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ICONS_DIR = path.resolve(__dirname, '../public/icons');

function criarPng(largura, altura, desenhadorPixel) {
  // 1. Scanlines com filter byte 0 (None)
  const bytesPorLinha = largura * 4;
  const bufferLinhas = Buffer.alloc(altura * (bytesPorLinha + 1));

  for (let y = 0; y < altura; y++) {
    const offsetLinha = y * (bytesPorLinha + 1);
    bufferLinhas[offsetLinha] = 0; // Filter: None
    for (let x = 0; x < largura; x++) {
      const [r, g, b, a] = desenhadorPixel(x, y, largura, altura);
      const pxOffset = offsetLinha + 1 + x * 4;
      bufferLinhas[pxOffset] = r;
      bufferLinhas[pxOffset + 1] = g;
      bufferLinhas[pxOffset + 2] = b;
      bufferLinhas[pxOffset + 3] = a;
    }
  }

  // 2. Chunks PNG
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  function criarChunk(tipo, dados) {
    const len = dados.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(tipo, 4);
    dados.copy(buf, 8);
    // CRC32
    const crc = calcularCrc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // Tabela CRC32
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
  }
  function calcularCrc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  // IHDR: 13 bytes
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8;  // bit depth 8
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idat = zlib.deflateSync(bufferLinhas);

  const chunkIHDR = criarChunk('IHDR', ihdr);
  const chunkIDAT = criarChunk('IDAT', idat);
  const chunkIEND = criarChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, chunkIHDR, chunkIDAT, chunkIEND]);
}

// Pintor de pixel do ícone Caça-Palavras:
// Fundo: #efe9dd (239, 233, 221)
// Tabuleiro: #fdfcf7 (253, 252, 247)
// Cápsula central: #ffd23f (255, 210, 63)
// Moldura/Detalhes: #16181c (22, 24, 28)
function desenharIcone(x, y, w, h, maskable = false) {
  const nx = x / w;
  const ny = y / h;

  // Cor de fundo
  const bg = [239, 233, 221, 255];
  const tabuleiro = [253, 252, 247, 255];
  const dourado = [255, 210, 63, 255];
  const escuro = [22, 24, 28, 255];

  if (maskable) {
    // Área segura total
    if (nx >= 0.15 && nx <= 0.85 && ny >= 0.15 && ny <= 0.85) {
      if (ny >= 0.40 && ny <= 0.60 && nx >= 0.22 && nx <= 0.78) {
        return dourado;
      }
      return tabuleiro;
    }
    return bg;
  }

  // Ícone com cantos arredondados
  if (nx >= 0.10 && nx <= 0.90 && ny >= 0.10 && ny <= 0.90) {
    // Cápsula destacada no centro
    if (ny >= 0.38 && ny <= 0.58 && nx >= 0.18 && nx <= 0.82) {
      return dourado;
    }
    return tabuleiro;
  }

  return bg;
}

console.log('Gerando ícones PWA...');
const p192 = criarPng(192, 192, (x, y, w, h) => desenharIcone(x, y, w, h, false));
fs.writeFileSync(path.join(ICONS_DIR, 'icon-192.png'), p192);

const p512 = criarPng(512, 512, (x, y, w, h) => desenharIcone(x, y, w, h, false));
fs.writeFileSync(path.join(ICONS_DIR, 'icon-512.png'), p512);

const pMask = criarPng(512, 512, (x, y, w, h) => desenharIcone(x, y, w, h, true));
fs.writeFileSync(path.join(ICONS_DIR, 'icon-maskable-512.png'), pMask);

console.log('✔ Ícones PNG (192, 512, maskable) gerados em public/icons/');
