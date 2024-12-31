
// =========================================================

export type Player = number;
export type Action = {};

export enum Outcome {
  WIN,
  LOSE,
  DRAW
}

// =========================================================

export interface Game {

  clone(): Game;

  getLastPlayer(): Player;
  getCurrentPlayer(): Player;
  
  getValidActions(): Action[];
  playAction(action: Action): void;
  
  getTermination(): boolean;
  getWinner(): number;

  stateToString(): string;
  printState(): void;

  getChannels(): void;
}
