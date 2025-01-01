import { Game, Player, Coord, Action } from "src/shared/Game";

interface CfState {

  board: (CfPiece|null)[][],
  lastPlayer: Player,
  currentPlayer: Player
  terminated: boolean;
  winner: Player|null
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

  public clone(): Game {4
    let newGame = new ConnectFour();
    newGame.state = structuredClone(this.state);
    return newGame;
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
    
    if (this.gameWon()) {
      this.state.terminated = true;
      this.state.winner = this.state.lastPlayer;
    }

  }

  public getValidActions(): Action[] {
      
    let actions = [];

    for (let column of this.iterColumns())
      if (this.lowestFreeSlot(column) != null)
        actions.push({ author: this.state.currentPlayer, column: column });

    return actions;
  }

  public printState(): void {
   
    console.log(this.stateToString());
  }

  public stateToString(): string {

    let board = "";
    
    for (let row of this.iterRows(true)) {
      for (let column of this.iterColumns()) {

        let coord = new Coord(column, row);

        const piece = this.getPiece(coord);
        const player = piece != null ? piece.author : null;
        board += PLAYERS_SYMBOLS.get(player) + " ";
        
        if (coord.x == this.boardShape.x -1)
          board += "\n";
      }
    }

    return board;
  }

  private gameWon(): boolean {

    for (let descending of [false, true]) {

      for (let offset of this.iterSubBoardsOffsets(descending)) {
  
        const diagonal = [...this.iterDiagonal(offset, descending)];
        
        const pieces = diagonal.map(slot => this.getPiece(slot));
        const win = pieces.every(piece => piece != null && piece.author == this.state.lastPlayer);
      
        if (win)
          return true;
      }
    }
    
    return false;
  }

  private lowestFreeSlot(column: number): Coord {

    for (let slot of this.iterColumnSlots(column))
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
      currentPlayer: 0,
      terminated: false,
      winner: null
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

  private *iterColumnSlots(column: number): Generator<Coord> {

    for (let row of this.iterRows())
      yield new Coord(column, row);
  }

  private *iterRows(reverse: boolean=false): Generator<number> {

    if (reverse)
      for (let row=this.boardShape.y-1; row>=0; row--)
        yield row;
  
    else
      for (let row=0; row<this.boardShape.y; row++)
        yield row;
  }

  private *iterColumns(): Generator<number> {

    for (let column=0; column<this.boardShape.x; column++)
      yield column;
  }

  private *iterSubBoardsOffsets(descending: boolean=false) {

    /*
    Itera pelos offsets de sub tabuleiros 4x4
    */

    const subBoardShape = new Coord(4,4);
    const maxIndex = this.boardShape.sub(subBoardShape);
    const rowOffset = descending ? 3 : 0;

    const validCollum = (column: number) => column <= maxIndex.x;
    const validRow = (row: number) => row <= maxIndex.y;

    for (let row of this.iterRows()) if (validRow(row))
      for (let column of this.iterColumns()) if (validCollum(column))
        yield new Coord(column, row + rowOffset);
  }

  private *iterDiagonal(offset: Coord, descending: boolean=false): Generator<Coord> {

    const dirFactor = descending ? -1 : 1;

    for (let i=0; i<4; i++)
      yield offset.add(new Coord(i, dirFactor*i));
  }

  // ==============
  // Getters
  // ==============

  public getLastPlayer(): Player {
    return this.state.lastPlayer;
  }

  public getCurrentPlayer(): Player {
    return this.state.currentPlayer;
  }
  
  public getTermination(): boolean {
    return this.state.terminated;
  }

  public getWinner(): number {
    return this.state.winner;
  }
}
