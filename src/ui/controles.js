// src/ui/controles.js
// Gestão de botões, confirmações seguras por extenso e interceptação do botão Voltar (§5.4, §11.3).

import { exibirDialogo } from './dialogo.js';
import { abrirModalAjustes } from './ajustes.js';

export function configurarControles(elementos, contextoJogo) {
  const { btnDica, btnNovo, btnSair, btnAjustes, camadaModal } = elementos;

  // 1. Botão DICA (§8)
  btnDica.addEventListener('click', () => {
    contextoJogo.aoPedirDica();
  });

  // 2. Botão JOGO NOVO com confirmação em duas saídas (§5.4)
  btnNovo.addEventListener('click', () => {
    if (contextoJogo.temPartidaEmAndamento()) {
      exibirDialogo(camadaModal, {
        titulo: 'Começar outra partida?',
        mensagem: 'A partida atual não foi finalizada.',
        textoSeguro: 'Não, continuar esta', // Primeiro e em verde (§1.1, item 8)
        textoAcao: 'Sim, começar outro',
        onSeguro: () => {},
        onAcao: () => {
          contextoJogo.aoIniciarNovoJogo(true); // abandonada = true se < metade
        }
      });
    } else {
      contextoJogo.aoIniciarNovoJogo(false);
    }
  });

  // 3. Botão SAIR (§5.4)
  btnSair.addEventListener('click', () => {
    exibirDialogo(camadaModal, {
      titulo: 'Sair do Caça-Palavras?',
      mensagem: 'Sua partida fica guardada para quando voltar.',
      textoSeguro: 'Não, continuar jogando',
      textoAcao: 'Sim, sair do jogo',
      onSeguro: () => {},
      onAcao: () => {
        contextoJogo.aoSair();
      }
    });
  });

  // 4. Interceptação do botão Voltar do Android (§5.4, §11.3)
  try {
    history.pushState({ app: 'caca-palavras' }, '');
    window.addEventListener('popstate', () => {
      history.pushState({ app: 'caca-palavras' }, '');
      btnSair.click();
    });
  } catch {}

  // 5. Engrenagem para o cuidador (§5.4)
  btnAjustes.addEventListener('click', () => {
    contextoJogo.aoAbrirAjustes();
  });
}
