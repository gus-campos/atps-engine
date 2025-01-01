
// =========================================================

export type Player = number;
export type Action = {};

export enum Outcome {
  WIN,
  LOSE,
  DRAW
}

export class Coord {

  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public sub(coord: Coord): Coord {
    return new Coord(this.x - coord.x, this.y - coord.y);
  }

  public add(coord: Coord): Coord {
    return new Coord(this.x + coord.x, this.y + coord.y);
  }
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
