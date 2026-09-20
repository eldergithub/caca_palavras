// src/ui/audio.js
// Sistema de som sutil e agradável sintetizado via Web Audio API.
// Sem arquivos externos, zero latência, respeita mudo e acessibilidade.

let audioCtx = null;
let somAtivo = true;

function obterAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function configurarSom(ativo) {
  somAtivo = Boolean(ativo);
}

export function alternarSom() {
  somAtivo = !somAtivo;
  if (somAtivo) {
    tocarSomSelecao();
  }
  return somAtivo;
}

export function isSomAtivo() {
  return somAtivo;
}

// 1. Som suave de toque na célula
export function tocarSomSelecao() {
  if (!somAtivo) return;
  try {
    const ctx = obterAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch {}
}

// 2. Acorde relaxante ao encontrar palavra correta
export function tocarSomPalavraEncontrada() {
  if (!somAtivo) return;
  try {
    const ctx = obterAudioContext();
    if (!ctx) return;

    const notas = [523.25, 659.25, 783.99]; // C5, E5, G5
    notas.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.07, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.3);
    });
  } catch {}
}

// 3. Fanfarra festiva suave ao completar uma fase
export function tocarSomVitoriaFase() {
  if (!somAtivo) return;
  try {
    const ctx = obterAudioContext();
    if (!ctx) return;

    const notas = [
      { f: 523.25, t: 0.00, d: 0.12 }, // C5
      { f: 659.25, t: 0.12, d: 0.12 }, // E5
      { f: 783.99, t: 0.24, d: 0.14 }, // G5
      { f: 1046.50, t: 0.38, d: 0.35 } // C6
    ];

    notas.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, ctx.currentTime + t);

      gain.gain.setValueAtTime(0.09, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + d + 0.02);
    });
  } catch {}
}

// 4. Som discreto de palavra não listada (lampejo âmbar)
export function tocarSomPalavraReal() {
  if (!somAtivo) return;
  try {
    const ctx = obterAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(739.99, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}
