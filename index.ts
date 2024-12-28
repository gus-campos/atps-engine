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
  let action = gameTree.searches(1000);
  gameTree.genGraph();

  return action;
}

function randomAction(game: Game): Action {

  let validActions = game.getValidActions();
  return validActions[randRange(validActions.length)];
}

function autoPlay(game: Game, actors: Function[], print: boolean): Game {

  if (print) 
    game.printState();

  while (!game.getTermination()) {

    let actor = actors[game.getCurrentPlayer()];
    let bestAction = actor(game);
    game.playAction(bestAction);

    if (print) 
      game.printState();
  }

  return game;
}

// =========================================================

let score = {
  wins: 0,
  defeats: 0,
  draws: 0
}

let faults = {
  aCounter: 0,
  bCounter: 0,
};

let rounds = 100;

for (let i=0; i<rounds; i++) {

  console.log(`Progresso: ${100*i/rounds}%`);
  let game = autoPlay(new GobbletGobblers(), [mctsAction, randomAction], false);

  let winner = game.getWinner();

  winner == 0 ? score.wins++ : winner == 1 ? score.defeats++ : score.draws++;

  if (game.getLastPlayer() == 0 && game.getWinner() == 1)
    faults.aCounter++;

  if (game.getLastPlayer() == 1 && game.getWinner() == 0)
    faults.bCounter++;
}

console.log(score);
console.log(faults);
