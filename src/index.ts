// =========================================================

import { MCTS, Args } from "./MCTS";

import { Game } from "./Game";
import { TicTacToe } from "./TicTacToe";
import { GobbletGobblers } from "./GobbletGobblers";
import { Boop } from "./Boop";

// =========================================================


// =========================================================


function autoPlayWithMCTS(game: Game) {
  
  const args: Args = { C: 1.41, searches: 100 };
  let mcts = new MCTS(game, args);

  // Iniciando jogo
  let state = game.getInitialState();
  game.printState();

  let value,
    terminated = false;

  // Simulando jogo MCTS
  while (!terminated) {
    // Descobrindo melhor jogada e gerando novo estado a partir de tal

    let bestAction = mcts.search(state);
    game.playAction(bestAction);
    
    game.printState();

    terminated = game.getTermination();
  }

  console.log(
    value == 0 ? "Velha" : `${game.getPlayerChar(state.lastPlayer)} ganhou`
  );
}

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

//autoPlayWithRandom(new Boop());
autoPlayWithRandom(new Boop());
