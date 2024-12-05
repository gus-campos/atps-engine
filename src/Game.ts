
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
  getNextState(state: State, action: Action): State;
  getValidActions(state: State): Action[];
  getValue(state: State): number;
  getNextPlayer(player: Player, numberOfPlayers: number): Player;
  getTermination(state: State): boolean;
  getValue(state: State): number;
  getNumberOfPlayers(): number;
  getPlayerName(player: Player): string;
  printState(state: State): void;
}
