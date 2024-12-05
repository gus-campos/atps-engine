
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

  getInitialState(): State;
  playAction(action: Action): void;
  getValidActions(): Action[];
  getValue(): number;
  getNextPlayer(numberOfPlayers: number): Player;
  getTermination(): boolean;
  getValue(state: State): number;
  getNumberOfPlayers(): number;
  getPlayerChar(player: Player): string;
  printState(): void;
}
