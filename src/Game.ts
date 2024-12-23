
// =========================================================

export type Player = number;

export type Piece = {}

export type Board = {}

export type State = {
  board: Board
  currentPlayer: Player,
  lastPlayer: Player
}

export type Action = {}

export enum Outcome {
    WIN,
    LOSE,
    DRAW
}

export let outcomeValues = new Map();
outcomeValues.set(Outcome.WIN, 1);
outcomeValues.set(Outcome.LOSE, 0);
outcomeValues.set(Outcome.DRAW, 0.5);

// =========================================================

export interface Game {

  clone(): Game;

  getLastPlayer(): Player;
  getCurrentPlayer(): Player;
  
  getValidActions(): Action[];
  playAction(action: Action): void;
  
  getTermination(): boolean;
  getWinner(): number;

  printState(): void;
}
