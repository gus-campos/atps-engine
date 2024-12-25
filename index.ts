// =========================================================

import { Action, Game, Player } from "./src/Game";
import { GameTree, Node } from "./src/MCTS";

import { TicTacToe } from "./src/TicTacToe";
import { GobbletGobblers } from "./src/GobbletGobblers";
import { Boop } from "./src/Boop";

import { XORShift } from "random-seedable";

let seed = Date.now();
//let seed = 100;
export const random = new XORShift(seed);

function randRange(range: number) {
  return Math.floor(random.float() * range);
}

// =========================================================

function mctsAction(game: Game): Action {

  let root = new Node(null, game, null) 
  let gameTree = new GameTree(root);
  return gameTree.searches(500);
}

function randomAction(game: Game): Action {

  let validActions = game.getValidActions();
  return validActions[randRange(validActions.length)];
}

function autoPlay(game: Game, actors: Function[], print: boolean): null|Player {

  if (print) 
    game.printState();

  while (!game.getTermination()) {

    let actor = actors[game.getCurrentPlayer()];
    //console.log(actor, game.getCurrentPlayer(), game.getValidActions().length);
    let bestAction = actor(game);
    game.playAction(bestAction);

    if (print) 
      game.printState();
  }

  return game.getWinner();
}

// =========================================================

let rounds = 1;
let mctsWins = 0;
let defeats = 0;
let draws = 0;

for (let i=0; i<rounds; i++) {

  console.log(`Progresso: ${100*i/rounds}%`);
  let winner = autoPlay(new TicTacToe(), [mctsAction, mctsAction], true);
  winner == 0 ? mctsWins++ : winner == 1 ? defeats++ : draws++;
}

console.log(`Vitórias: ${100*mctsWins/rounds}`);
console.log(`Derrotas: ${100*defeats/rounds}`);
console.log(`Empates: ${100*draws/rounds}`);
