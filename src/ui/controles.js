// src/ui/controles.js
// Gestão de botões, confirmações seguras por extenso e interceptação do botão Voltar (§5.4, §11.3).

import { exibirDialogo } from './dialogo.js';

export function configurarControles(elementos, contextoJogo) {
  const { btnDica, btnNovo, btnSair, btnAjustes, camadaModal } = elementos;

  // 1. Botão DICA (§8) — nunca oferecida sozinha, só quando ela pede
  btnDica.addEventListener('click', () => {
    contextoJogo.aoPedirDica();
  });

  // 2. Botão JOGO NOVO com confirmação em duas saídas (§5.4)
  btnNovo.addEventListener('click', () => {
    if (contextoJogo.temPartidaEmAndamento()) {
      exibirDialogo(camadaModal, {
        titulo: 'Começar outra partida?',
        mensagem: 'A partida atual não foi terminada.',
        textoSeguro: 'Não, continuar esta', // Primeiro e em verde (§1.1, item 8)
        textoAcao: 'Sim, começar outro',
        onSeguro: () => {},
        onAcao: () => {
          contextoJogo.aoIniciarNovoJogo(true);
        },
      });
    } else {
      contextoJogo.aoIniciarNovoJogo(false);
    }
  });

  // 3. Botão SAIR (§5.4)
  function pedirConfirmacaoDeSaida() {
    exibirDialogo(camadaModal, {
      titulo: 'Sair do Caça-Palavras?',
      mensagem: 'Sua partida fica guardada para quando voltar.',
      textoSeguro: 'Não, continuar jogando',
      textoAcao: 'Sim, sair do jogo',
      onSeguro: () => {},
      onAcao: () => {
        contextoJogo.aoSair();
      },
    });
  }

  btnSair.addEventListener('click', pedirConfirmacaoDeSaida);

  // 4. O botão "voltar" do Android abre essa mesma confirmação, nunca fecha direto (§5.4, §11.3)
  function aoVoltarDoAndroid() {
    history.pushState({ app: 'caca-palavras' }, '');
    // Se já houver um diálogo aberto, o voltar apenas o fecha
    if (camadaModal.style.display === 'flex') {
      camadaModal.style.display = 'none';
      camadaModal.innerHTML = '';
      return;
    }
    pedirConfirmacaoDeSaida();
  }

  try {
    history.pushState({ app: 'caca-palavras' }, '');
    window.addEventListener('popstate', aoVoltarDoAndroid);
  } catch {}

  // 5. Engrenagem para o cuidador (§5.4)
  btnAjustes.addEventListener('click', () => {
    contextoJogo.aoAbrirAjustes();
  });

  return {
    // Usado na hora de fechar o app: o histórico empilhado por esta armadilha
    // atrapalha o window.close().
    desarmarVoltar: () => {
      try { window.removeEventListener('popstate', aoVoltarDoAndroid); } catch {}
    },
  };
}
