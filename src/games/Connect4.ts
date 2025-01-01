import { Game, Player, Coord } from "src/shared/Game";

interface CfState {

  board: (CfPiece|null)[][],
  lastPlayer: Player,
  currentPlayer: Player
}

interface CfPiece {
  
  author: Player
}

interface CfAction {

  author: Player,
  column: number
}

export const PLAYERS_SYMBOLS = new Map<Player|null, string>([
  [0, "X"],
  [1, "O"],
  [null, "."],
]);

export class ConnectFour implements Game {

  private state: CfState;
  private boardShape: Coord;

  constructor() {

    this.boardShape = new Coord(7,6);
    this.state = this.getInitialState();
  }

  public playAction(action: CfAction): void {

    if (action.column < 0 || action.column >= this.boardShape.x)
      throw new Error("Invalid column");

    let slot = this.lowestFreeSlot(action.column);

    if (slot == null)
      throw new Error("Column already filled");

    if (action.author != this.state.currentPlayer)
      throw new Error("A player can only play with its own pieces")

    const piece = this.createPiece(action.author);
    this.setPiece(slot, piece);

    this.progressPlayers();
  }

  public printState(): void {
   
    console.log(this.stateToString());
  }

  public stateToString(): string {

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

  private lowestFreeSlot(column: number): Coord {

    for (let slot of this.iterColumn(column))
      if (this.getPiece(slot) == null)
        return slot;

    return null;
  }

  private getInitialState(): CfState {

    let board: CfPiece[][] = Array.from(  
      Array(this.boardShape.x), 
      ()=>Array(this.boardShape.y).fill(null)
    );

    return {

      board: board,
      lastPlayer: 1,
      currentPlayer: 0
    }
  }

  private progressPlayers(): void {
    this.state.lastPlayer = this.state.lastPlayer;
    this.state.currentPlayer = this.nextPlayer();
  }

  private nextPlayer(): Player {
    return (this.state.currentPlayer + 1) % 2;
  }

  private getPiece(coord: Coord): CfPiece|null {

    return this.state.board[coord.x][coord.y];
  }

  private setPiece(coord: Coord, piece: CfPiece|null): void {

    this.state.board[coord.x][coord.y] = piece;
  }

  private createPiece(author: Player): CfPiece {

    return { author: author };
  }

  private *iterBoard() {

    for (let y=this.boardShape.y; y>=0; y--)
      for (let x=0; x<this.boardShape.x; x++)
        yield new Coord(x, y);
  }

  private *iterColumn(column: number): Generator<Coord> {

    /* Pressupões que coluna já está validada */
    for (let row=0; row<this.boardShape.y; row++)
      yield new Coord(column, row);
  }
}
