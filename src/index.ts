// =========================================================

import { Game } from "./Game";
import { TicTacToe } from "./TicTacToe";
import { GobbletGobblers } from "./GobbletGobblers";
import { Boop } from "./Boop";

// =========================================================

function autoPlayWithRandom(game: Game) {

  // Iniciando jogo
  game.printState();

  let value,
    terminated = false;

  // Simulando jogo MCTS
  while (!terminated) {
    // Descobrindo melhor jogada e gerando novo estado a partir de tal
    let validActions = game.getValidActions();
    let randomIndex = Math.floor(Math.random() * validActions.length);
    let bestAction = validActions[randomIndex];
    
    game.playAction(bestAction);
    game.printState();

    // Terminação
    value = game.getValue();
    terminated = game.getTermination();
  }

  console.log(
    value == 0 ? "Velha" : `Vitória`
  );
}

// =========================================================

autoPlayWithRandom(new TicTacToe());
