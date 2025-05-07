import { Game, Player, Action } from "src/shared/Game";
import { Coord } from "src/utils/Coord";

export enum CrabDirection {
  UP,
  DOWN,
  RIGHT,
  LEFT,
}

const DIRECTIONS = [
  CrabDirection.UP,
  CrabDirection.DOWN,
  CrabDirection.RIGHT,
  CrabDirection.LEFT,
]

export const DIRECTION_STEP = new Map<CrabDirection, Coord>([
  [CrabDirection.UP,    new Coord( 0, 1)],
  [CrabDirection.DOWN,  new Coord( 0,-1)],
  [CrabDirection.RIGHT, new Coord( 1, 0)],
  [CrabDirection.LEFT,  new Coord(-1, 0)]
]);

interface CrabState {

  board: (CrabPiece|null)[][],
  lastPlayer: Player,
  currentPlayer: Player

  piecesCount: number[],

  terminated: boolean,
  winner: Player|null,

  turnsWithoutCapturing: number
}

interface CrabPiece {
  
  author: Player,
}

interface CrabAction {

  fromSlot: Coord,
  direction: CrabDirection
}

export const PIECES_SYMBOLS = new Map<string, string>([
  [JSON.stringify({ author: 0 }), "A"],
  [JSON.stringify({ author: 1 }), "B"],
  [null, "."]
]);

export const SYMBOLS_PIECES = new Map<string, CrabPiece|null>([
  ["A", { author: 0 }],
  ["B", { author: 1 }],
  [".", null]
]);

export class CrabPuzzle implements Game {

  private state: CrabState;
  private boardShape: Coord;
  
  constructor() {
    
    this.boardShape = new Coord(8,8);
    this.state = this.getInitialState();

    this.setState(

      [
        ["B", ".", ".", "A", "B", ".", ".", "A"],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        ["A", ".", ".", ".", ".", ".", ".", "B"],
        ["B", ".", ".", ".", ".", ".", ".", "A"],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        ["A", ".", ".", "B", "A", ".", ".", "B"],
      ],

      [1,0]
    )
  }

  public clone(): Game {
    
    const game = new CrabPuzzle();
    game.state = structuredClone(this.state);


    return game;
  }

  public getLastPlayer(): Player {
    return this.state.lastPlayer;
  }

  public getCurrentPlayer(): Player {
    return this.state.currentPlayer;
  }

  public isGameOver(): boolean {
    return this.state.terminated;
  }

  public getWinner(): number {
    return this.state.winner;
  }

  public forceDraw(): void {
    this.state.terminated = true;
    this.state.winner = null;
  }

  private getInitialState(): CrabState {

    /*
    Retorna o estado inicial do jogo
    */

    let board: CrabPiece[][] = Array.from(  
      Array(this.boardShape.x), 
      ()=>Array(this.boardShape.y).fill(null)
    );

    return {

      board: board,
      lastPlayer: 1,
      currentPlayer: 0,
      piecesCount: [12, 12],
      terminated: false,
      winner: null,
      turnsWithoutCapturing: 0
    }
  }

  public playAction(action: CrabAction, autoPlayMode: boolean=false): void {

    const toSlot = this.lastSlotInDirection(action.fromSlot, action.direction)
    
    this.validateAction(action, toSlot);
    
    const piece = this.getPiece(action.fromSlot);

    // Move
    this.setPiece(action.fromSlot, null);
    this.setPiece(toSlot, piece)
    this.progressPlayers();
    this.evaluateState();
  }

  private evaluateState() {

    if (this.isWon()) {
      this.state.terminated = true;
      this.state.winner = this.state.lastPlayer;
    }
  }

  private isWon() {

    // Para cada posição em um linha ou coluna
    for (let horizontal of [true, false])
      for (let i of [0,1,2,3,4,5,6,7]) {
    
      for (let startOffset of [0,1,2,3,4]) {        

        const sequence = [];

        for (let deltaOffset of [0,1,2,3]) {
      
          const j = startOffset + deltaOffset;
          const coord = horizontal ? new Coord(i, j) : new Coord(j, i);
          
          sequence.push(this.getPiece(coord));           
        }
        
        if (sequence.every(piece => piece != null && piece.author == this.state.lastPlayer))
          return true;
      }
    }

    return false;
  }

  private validateAction(action: CrabAction, toSlot: Coord) {

    const piece = this.getPiece(action.fromSlot);

    if (piece == null)
      throw new Error("No piece to move in this cell");

    if (piece.author != this.state.currentPlayer)
      throw new Error("Can only play with its own pieces");

    if (toSlot == null || toSlot == action.fromSlot)
      throw new Error("Invalid move");        
  }

  public getValidActions(): Action[] {
    
    const validActions: Action[] = [];

    for (let column of this.iterColumns()) {
      for (let row of this.iterRows()) {

        const fromSlot = new Coord(column, row);
        const piece = this.getPiece(fromSlot);

        if (piece == null || piece.author != this.state.currentPlayer)
          continue;
        
        for (let direction of DIRECTIONS) {

          const toSlot = this.lastSlotInDirection(fromSlot, direction);

          if (toSlot != fromSlot)
            validActions.push({ fromSlot: fromSlot, direction: direction });
        }
      }   
    } 
    
    return validActions;
  }

  private lastSlotInDirection(fromSlot: Coord, direction: CrabDirection): Coord {

    let lastSlot = fromSlot;

    for (let slot of this.iterDirection(fromSlot, direction)) {

      if (this.getPiece(slot) != null)
        return lastSlot;

      lastSlot = slot;
    }

    return lastSlot;
  }

  private progressPlayers(): void {

    /*
    Passa a vez, alternando os players atual e último
    */

    this.state.lastPlayer = this.state.currentPlayer;
    this.state.currentPlayer = this.getOpponent();
  }

  private getOpponent(): Player {
    return (this.state.currentPlayer + 1) % 2;
  }

  private pieceToSymbol(piece: CrabPiece): string {
      
    if (piece == null)
      return PIECES_SYMBOLS.get(null);

    return PIECES_SYMBOLS.get(JSON.stringify(piece));
  }

  private symbolToPiece(symbol: string): CrabPiece|null {
    
    if (![...SYMBOLS_PIECES.keys()].includes(symbol))
      throw new Error(`Invalid piece symbol: "${symbol}"`);

    return SYMBOLS_PIECES.get(symbol);
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
        board += this.pieceToSymbol(piece) + " ";

        if (coord.x == this.boardShape.x -1)
          board += "\n";
      }
    }

    const lastPlayer = this.pieceToSymbol({ author: this.state.lastPlayer });
    const currentPlayer = this.pieceToSymbol({ author: this.state.currentPlayer });
    const turns = `O "${lastPlayer}" jogou, vez do "${currentPlayer}":`;

    return board + "\n" + turns + "\n";
  }

  public setState(boardRep: string[][], players: Player[]=null) {

    /*
    Seta o estado de acordo com o desenho passado do tabuleiro,
    e dos player (anterior e atual). 
    
    cf.setState(

      [
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
      ],

      [1,0]
    );

    */

    const toRepCoord = (coord: Coord) => new Coord(coord.x, (this.boardShape.y-1)-coord.y); 

    this.state.piecesCount = [0,0];
    
    for (let row of this.iterRows()) {
      for (let column of this.iterColumns()) {
        
        const coord = new Coord(column, row);
        const repCoord = toRepCoord(coord);

        const pieceSymbol = boardRep[repCoord.y][repCoord.x];
        const piece = this.symbolToPiece(pieceSymbol);

        this.setPiece(coord, piece);
        
        if (piece != null)
          this.state.piecesCount[piece.author]++;
      }
    }
    
    if (players != null) {
      
      this.state.lastPlayer = players[0];
      this.state.currentPlayer = players[1];
    }
    
    //this.evaluateState();
  }

  private getPiece(coord: Coord): CrabPiece|null {
    return this.state.board[coord.x][coord.y];
  }

  private setPiece(coord: Coord, piece: CrabPiece|null): void {
    this.state.board[coord.x][coord.y] = piece;
  }

  private validSlot(coord: Coord) {

    if (
      
      coord.x < 0 || coord.x >= this.boardShape.x
      || coord.y < 0 || coord.y >= this.boardShape.x
    )

      return false;

    return true;
  }

  private *iterRows(reverse: boolean=false): Generator<number> {

    /*
    Itera pelos índices das linhas do tabuleiro, em
    ordem direta ou inversa
    */

    if (reverse)
      for (let row=this.boardShape.y-1; row>=0; row--)
        yield row;
  
    else
      for (let row=0; row<this.boardShape.y; row++)
        yield row;
  }

  private *iterColumns(): Generator<number> {

    /*
    Itera pelos índices das colunas do tabuleiro
    */

    for (let column=0; column<this.boardShape.x; column++)
      yield column;
  }

  private *iterDirection(fromSlot: Coord, direction: CrabDirection): Generator<Coord> {

    const step = DIRECTION_STEP.get(direction);

    for (let slot = fromSlot.add(step); this.validSlot(slot); slot = slot.add(step))
      yield slot;
  }
}
