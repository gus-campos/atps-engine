import { Game, Player, Coord } from "src/shared/Game";

interface CFState {

  board: (CFPiece|null)[][],
  lastPlayer: Player,
  currentPlayer: Player
}

interface CFPiece {
  
  author: Player,
  slot: Coord
}

export const PLAYERS_SYMBOLS = new Map<Player|null, string>([
  [0, "X"],
  [1, "O"],
  [null, "."],
]);

export class ConnectFour implements Game {

  private state: CFState;
  private boardShape: Coord;

  constructor() {

    this.boardShape = new Coord(7,6);
    this.state = this.getInitialState();

    this.printState();

  }

  public printState(): void {
   
    let state = this.stateToString();
    console.log(state);
  }

  private stateToString() {

    let board = "";
    
    for (let coord of this.iterBoard()) {

      const piece = this.getPiece(coord);
      const player = piece != null ? piece.author : null;
      board += PLAYERS_SYMBOLS.get(player) + " ";
      
      if (coord.x == this.boardShape.x -1)
        board += "\n";
    }

    return board;
  }

  private getInitialState(): CFState {

    let board: CFPiece[][] = Array.from(  
      Array(this.boardShape.x), 
      ()=>Array(this.boardShape.y).fill(null)
    );

    return {

      board: board,
      lastPlayer: 0,
      currentPlayer: 1
    }
  }

  private getPiece(coord: Coord) {

    return this.state.board[coord.x][coord.y];
  }

  private *iterBoard() {

    for (let y=0; y<this.boardShape.y; y++)
      for (let x=0; x<this.boardShape.x; x++)
        yield new Coord(x, y);
  }
}
