// src/ui/ensino.js
// Dedo fantasma pedagógico sem tela de tutorial (§5.7).
// Demonstra o gesto na primeira partida da instalação e para para sempre no
// primeiro acerto dela.
//
// É um anel translúcido, não uma mão desenhada: a mão cobria a letra embaixo,
// e esconder a matéria-prima do jogo para ensinar a jogar é o contrário do que
// se quer. O anel mostra onde o dedo está sem tapar nada.

import { calcularCentroCelula } from './render.js';

export function iniciarDedoFantasma(containerGrade, palavraColocada, configLayout) {
  if (!palavraColocada || !palavraColocada.celulas || palavraColocada.celulas.length < 2) return null;

  const celulas = palavraColocada.celulas;
  const posInicio = calcularCentroCelula(celulas[0].l, celulas[0].c, configLayout);
  const posFim = calcularCentroCelula(celulas[celulas.length - 1].l, celulas[celulas.length - 1].c, configLayout);

  const diametro = configLayout.celula + 8;
  const raio = diametro / 2;

  const elDedo = document.createElement('div');
  elDedo.id = 'dedo-fantasma';
  elDedo.style.position = 'absolute';
  elDedo.style.left = '0';
  elDedo.style.top = '0';
  elDedo.style.width = `${diametro}px`;
  elDedo.style.height = `${diametro}px`;
  elDedo.style.borderRadius = '50%';
  elDedo.style.border = '4px solid var(--cor-selecao)';
  elDedo.style.backgroundColor = 'rgba(255, 210, 63, 0.22)';
  elDedo.style.boxSizing = 'border-box';
  elDedo.style.pointerEvents = 'none';
  elDedo.style.zIndex = '3';

  containerGrade.appendChild(elDedo);

  const emCima = (p) => `translate(${p.x - raio}px, ${p.y - raio}px)`;

  let ativo = true;
  const temporizadores = [];
  const depois = (fn, ms) => temporizadores.push(setTimeout(fn, ms));

  function parar() {
    ativo = false;
    for (const t of temporizadores) clearTimeout(t);
    elDedo.remove();
  }

  // §5.7: com prefers-reduced-motion ligado, aparece em três posições
  // estáticas encadeadas em vez de deslizar.
  const semMovimento = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (semMovimento) {
    const meio = celulas[Math.floor(celulas.length / 2)];
    const paradas = [posInicio, calcularCentroCelula(meio.l, meio.c, configLayout), posFim];
    let i = 0;

    const proximaParada = () => {
      if (!ativo) return;
      elDedo.style.transform = emCima(paradas[i % paradas.length]);
      i++;
      depois(proximaParada, 1100);
    };

    proximaParada();
    return { parar };
  }

  function animarPasso() {
    if (!ativo) return;

    elDedo.style.transition = 'none';
    elDedo.style.transform = emCima(posInicio);
    elDedo.style.opacity = '0';

    depois(() => {
      if (!ativo) return;
      elDedo.style.transition = 'opacity 0.4s ease';
      elDedo.style.opacity = '1';

      depois(() => {
        if (!ativo) return;
        elDedo.style.transition = 'transform 1.8s cubic-bezier(0.25, 1, 0.5, 1)';
        elDedo.style.transform = emCima(posFim);

        depois(() => {
          if (!ativo) return;
          elDedo.style.transition = 'opacity 0.5s ease';
          elDedo.style.opacity = '0';
          depois(animarPasso, 1200);
        }, 2000);
      }, 500);
    }, 100);
  }

  animarPasso();

  return { parar };
}
