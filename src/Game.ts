
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

// =========================================================

export interface Game {

  clone(): Game;

  getLastPlayer(): Player;
  getCurrentPlayer(): Player;
  
  getValidActions(): Action[];
  playAction(action: Action): void;
  
  getValue(): number;
  getTermination(): boolean;
  
  printState(): void;
}
