// =========================================================

import { MCTS, Args } from "../.archive/MCTS";

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
  game.printState(state);

  let value,
    terminated = false;

  // Simulando jogo MCTS
  while (!terminated) {
    // Descobrindo melhor jogada e gerando novo estado a partir de tal

    let bestAction = mcts.search(state);
    state = game.getNextState(state, bestAction);
    
    game.printState(state);

    terminated = game.getTermination(state);
  }

  console.log(
    value == 0 ? "Velha" : `${game.getPlayerName(state.lastPlayer)} ganhou`
  );
}

function autoPlayWithRandom(game: Game) {

  // Iniciando jogo
  let state = game.getInitialState();
  game.printState(state);

  let value,
    terminated = false;

  // Simulando jogo MCTS
  while (!terminated) {
    // Descobrindo melhor jogada e gerando novo estado a partir de tal
    let validActions = game.getValidActions(state);
    let randomIndex = Math.floor(Math.random() * validActions.length);
    let bestAction = validActions[randomIndex];
    state = game.getNextState(state, bestAction);

    game.printState(state);

    // Terminação
    value = game.getValue(state);
    terminated = game.getTermination(state);
  }

  console.log(
    value == 0 ? "Velha" : `Vitória`
  );
}

// =========================================================

//autoPlayWithRandom(new Boop());
autoPlayWithMCTS(new TicTacToe());
