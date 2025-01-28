
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

  public equals(coord: Coord): boolean {
    return this.x == coord.x && this.y == coord.y;
  }

  public mult(k: number) {
    return new Coord(k * this.x, k * this.y);
  }
}


// =========================================================

export interface Game {

  clone(): Game;

  getLastPlayer(): Player;
  getCurrentPlayer(): Player;
  
  getValidActions(): Action[];
  playAction(action: Action, autoPlayMode: boolean): void;
  
  isGameOver(): boolean;
  getWinner(): number;

  stateToString(): string;
  printState(): void;
  
  forceDraw(): void;
}
