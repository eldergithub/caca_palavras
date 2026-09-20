// src/ui/ensino.js
// Dedo fantasma pedagógico sem tela de tutorial (§5.7).
// Demonstra suavemente o gesto na primeira partida da instalação e para para sempre no primeiro acerto.

import { calcularCentroCelula } from './render.js';

export function iniciarDedoFantasma(containerGrade, palavraColocada, configLayout) {
  if (!palavraColocada || !palavraColocada.celulas || palavraColocada.celulas.length < 2) return null;

  const prim = palavraColocada.celulas[0];
  const ult = palavraColocada.celulas[palavraColocada.celulas.length - 1];

  const posInicio = calcularCentroCelula(prim.l, prim.c, configLayout);
  const posFim = calcularCentroCelula(ult.l, ult.c, configLayout);

  const elDedo = document.createElement('div');
  elDedo.id = 'dedo-fantasma';
  elDedo.style.position = 'absolute';
  // Sem left/top o elemento parte da posição de fluxo (abaixo da grade) e o
  // translate abaixo o joga para fora do tabuleiro.
  elDedo.style.left = '0';
  elDedo.style.top = '0';
  elDedo.style.width = '44px';
  elDedo.style.height = '44px';
  elDedo.style.pointerEvents = 'none';
  elDedo.style.zIndex = '10';
  elDedo.style.transition = 'transform 1.8s ease-in-out, opacity 0.4s ease';
  elDedo.style.opacity = '0.85';
  elDedo.innerHTML = `
    <svg viewBox="0 0 24 24" width="44" height="44" fill="#d4a017" stroke="#16181c" stroke-width="1.5" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
    </svg>
  `;

  containerGrade.appendChild(elDedo);

  let ativo = true;

  // §5.7: com prefers-reduced-motion ligado, o dedo aparece em três posições
  // estáticas encadeadas em vez de deslizar.
  const semMovimento = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (semMovimento) {
    const meio = palavraColocada.celulas[Math.floor(palavraColocada.celulas.length / 2)];
    const posMeio = calcularCentroCelula(meio.l, meio.c, configLayout);
    const paradas = [posInicio, posMeio, posFim];
    let i = 0;

    elDedo.style.transition = 'none';

    const proximaParada = () => {
      if (!ativo) return;
      const p = paradas[i % paradas.length];
      elDedo.style.transform = `translate(${p.x - 14}px, ${p.y - 10}px)`;
      elDedo.style.opacity = '0.85';
      i++;
      setTimeout(proximaParada, 1100);
    };

    proximaParada();

    return {
      parar: () => {
        ativo = false;
        elDedo.remove();
      },
    };
  }

  function animarPasso() {
    if (!ativo) return;
    animando = true;

    // Início na primeira célula
    elDedo.style.transition = 'none';
    elDedo.style.transform = `translate(${posInicio.x - 14}px, ${posInicio.y - 10}px) scale(0.9)`;
    elDedo.style.opacity = '0';

    setTimeout(() => {
      if (!ativo) return;
      elDedo.style.transition = 'opacity 0.4s ease, transform 0.3s ease';
      elDedo.style.opacity = '0.85';
      elDedo.style.transform = `translate(${posInicio.x - 14}px, ${posInicio.y - 10}px) scale(1.1)`;

      setTimeout(() => {
        if (!ativo) return;
        elDedo.style.transition = 'transform 1.8s cubic-bezier(0.25, 1, 0.5, 1)';
        elDedo.style.transform = `translate(${posFim.x - 14}px, ${posFim.y - 10}px) scale(1.1)`;

        setTimeout(() => {
          if (!ativo) return;
          elDedo.style.transition = 'opacity 0.5s ease, transform 0.3s ease';
          elDedo.style.opacity = '0';
          elDedo.style.transform = `translate(${posFim.x - 14}px, ${posFim.y - 10}px) scale(0.9)`;

          setTimeout(() => {
            if (ativo) animarPasso();
          }, 1200);
        }, 2000);
      }, 500);
    }, 100);
  }

  animarPasso();

  return {
    parar: () => {
      ativo = false;
      elDedo.remove();
    }
  };
}
