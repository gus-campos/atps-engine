import { Game, Player, Coord } from "src/shared/Game";

export enum Direction {
  LEFT,
  RIGHT
}

export enum PieceType {
  MAN,
  KING
}

interface CheckersState {

  board: (CheckersPiece|null)[][],
  lastPlayer: Player,
  currentPlayer: Player

  piecesCount: number[];

  terminated: boolean;
  winner: Player|null
}

interface CheckersPiece {
  
  author: Player,
  type: PieceType
}

interface CheckersAction {

  fromSlot: Coord,
  toSlot: Coord
}

export const PIECES_SYMBOLS = new Map<string, string>([
  [JSON.stringify({ author: 0, type: PieceType.MAN }), "a"],
  [JSON.stringify({ author: 1, type: PieceType.MAN }), "b"],
  [JSON.stringify({ author: 0, type: PieceType.KING }), "A"],
  [JSON.stringify({ author: 1, type: PieceType.KING }), "B"],
  [null, "."]
]);

export const SYMBOLS_PIECES = new Map<string, CheckersPiece|null>([
  ["a", { author: 0, type: PieceType.MAN }],
  ["b", { author: 1, type: PieceType.MAN }],
  ["A", { author: 0, type: PieceType.KING }],
  ["B", { author: 1, type: PieceType.KING }],
  [" ", null]
]);

export class Checkers implements Game {

  private state: CheckersState;
  private boardShape: Coord;

  constructor() {

    this.boardShape = new Coord(8,8);
    this.state = this.getInitialState();
  }

  // ================
  // Public Methods
  // ================

  public clone(): Game {
    let newGame = new Checkers();
    newGame.state = structuredClone(this.state);
    return newGame;
  }

  public playAction(action: CheckersAction): void {

    const piece = this.getPiece(action.fromSlot);

    this.validateAction(action);

    const moveMultiplicity = this.moveMultiplicity(action);

    if (moveMultiplicity > 1) {

      this.validateJump(action);

      const capturedSlot = this.capturedSlot(action);
      const capturedPiece = this.capturedPiece(action);
      
      if (capturedPiece != null) {
        this.setPiece(capturedSlot, null);
        this.decrementPieceCount(this.getOpponent());
      }
    }
    
    // Move
    this.setPiece(action.fromSlot, null);
    this.setPiece(action.toSlot, piece);
    
    this.progressPlayers()
    this.evaluateState();
  }

  public getValidActions(): CheckersAction[] {

    if (this.state.terminated)
      return [];
    
    let actions: CheckersAction[] = [];
    
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
        board += this.pieceToSymbol(piece) + " ";

        if (coord.x == this.boardShape.x -1)
          board += "\n";
      }
    }

    const lastPlayer = this.pieceToSymbol({ author: this.state.lastPlayer, type: PieceType.KING });
    const currentPlayer = this.pieceToSymbol({ author: this.state.currentPlayer, type: PieceType.KING });
    const turns = `O "${lastPlayer}" jogou, vez do "${currentPlayer}":`;

    return board + "\n" + turns + "\n";
  }

  public setState(boardRep: string[][], players: Player[]) {

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
    
    this.state.lastPlayer = players[0];
    this.state.currentPlayer = players[1];
    
    this.evaluateState();
  }

  // =========================
  // Validators
  // =========================

  private validateAction(action: CheckersAction): void {

    const piece = this.getPiece(action.fromSlot);

    if (piece == null)
      throw new Error("No piece to move in that slot");

    if (piece.author != this.state.currentPlayer)
      throw new Error("Can only play with its own pieces");

    if (!this.validSlot(action.toSlot))
      throw new Error("Can't move to a non valid slot");

    if (!this.validDirection(action))
      throw new Error("Invalid direction");
    
    if (!this.freeSlot(action.toSlot))
      throw new Error("Can't move to an ocuppied slot");
  }

  private validateJump(action: CheckersAction): void {

    // Detectar captura
    const piece = this.getPiece(action.fromSlot);
    const capturedPiece = this.capturedPiece(action);
      
    // Validar MAN
    if (piece.type == PieceType.MAN && capturedPiece == null)
      throw new Error("Man can only move more than 1 unit when capturing");
    
    // Se capturou
    if (capturedPiece != null) {
      
      if (capturedPiece.author != this.getOpponent())
        throw new Error("Can only capture opponent's pieces");
      
      if (this.amountOfPiecesJumpedOver(action) > 1)
        throw new Error("Can't jump over more than 1 piece");
    }
  }

  // =========================
  // Auxiliar Private Methods
  // =========================

  private validSlot(coord: Coord) {
    
    let validXBound = coord.x >= 0 && coord.x < this.boardShape.x;
    let validYBound = coord.y >= 0 && coord.y < this.boardShape.y;
    
    if (!validXBound || !validYBound)
      return false;
    
    const even = (n: number) => n%2==0;
    let darkSquare = (even(coord.x) && even(coord.y)) || (!even(coord.x) && !even(coord.y));

    if (!darkSquare)
      return false;

    return true;
  }

  private freeSlot(coord: Coord): boolean {

    if (this.getPiece(coord) != null)
      return false;

    return true;
  }

  private validDirection(action: CheckersAction) {

    const player = this.state.currentPlayer;
    const displacement = action.toSlot.sub(action.fromSlot);

    const upwards = displacement.y > 0;

    if ((player == 0 && upwards) || (player == 1 && !upwards))
      return true;

    const pieceToMove = this.getPiece(action.fromSlot);
    if (pieceToMove.type == PieceType.KING)
      return true;

    return false;
  }

  private moveMultiplicity(action: CheckersAction) {

    const displacement = action.toSlot.sub(action.fromSlot);

    return Math.abs(displacement.x);
  }

  private getNormalizedDirection(action: CheckersAction) : Coord {

    const displacement = action.toSlot.sub(action.fromSlot);
    const multiplicity = this.moveMultiplicity(action);

    return displacement.mult(1/multiplicity);
  }

  private capturedPiece(action: CheckersAction): CheckersPiece|null {

    const slot = this.capturedSlot(action);

    if (slot == null)
      return null;

    return this.getPiece(slot);
  }

  private capturedSlot(action: CheckersAction): Coord|null {

    const multiplicity = this.moveMultiplicity(action);
    
    if (multiplicity == 1)
      return null;

    const normalized = this.getNormalizedDirection(action);
    return action.toSlot.sub(normalized);
  }

  private amountOfPiecesJumpedOver(action: CheckersAction): number {

    let n = 0;

    for (let coord of this.iterTrace(action))
      if (this.getPiece(coord) != null)
        n++;
      
    return n;
  }

  private decrementPieceCount(player: Player): void {
    this.state.piecesCount[player]--;
  }

  // =====================
  // Main private methods
  // =====================


  private evaluateState(): void {

    if (this.gameWon()) {
      this.state.terminated = true;
      this.state.winner = this.state.lastPlayer;
    }

    else if (this.gameDrawn()) {
      this.state.terminated = true;
      this.state.winner = null;
    }
  }

  private gameWon(): boolean {
    
    // Estoque do oponente do lastPlayer
    return this.state.piecesCount[this.state.currentPlayer] <= 0;
  }

  private gameDrawn(): boolean {

    return false;
  }

  private getInitialState(): CheckersState {

    /*
    Retorna o estado inicial do jogo
    */

    let board: CheckersPiece[][] = Array.from(  
      Array(this.boardShape.x), 
      ()=>Array(this.boardShape.y).fill(null)
    );

    const filledRows = 3;

    for (let slot of this.iterSlots()) {

      if (slot.y < filledRows && this.validSlot(slot))
        board[slot.x][slot.y] = this.createPiece(0);

      if (slot.y >= this.boardShape.y-filledRows && this.validSlot(slot))
        board[slot.x][slot.y] = this.createPiece(1);
    }

    return {

      board: board,
      lastPlayer: 1,
      currentPlayer: 0,
      piecesCount: [12, 12],
      terminated: false,
      winner: null
    }
  }

  private pieceToSymbol(piece: CheckersPiece): string {
    
    if (piece == null)
      return PIECES_SYMBOLS.get(null);

    return PIECES_SYMBOLS.get(JSON.stringify(piece));
  }

  private symbolToPiece(symbol: string): CheckersPiece|null {
    
    if (![...SYMBOLS_PIECES.keys()].includes(symbol))
      throw new Error(`Invalid piece symbol: "${symbol}"`);

    return SYMBOLS_PIECES.get(symbol);
  }

  private progressPlayers(): void {

    /*
    Passa a vez, alternando os players atual e último
    */

    // TODO: Mudar ciclagem de players
    this.state.lastPlayer = this.state.currentPlayer;
    this.state.currentPlayer = this.getOpponent();
  }

  private getOpponent(): Player {
    return (this.state.currentPlayer + 1) % 2;
  }

  private getPiece(coord: Coord): CheckersPiece|null {
    return this.state.board[coord.x][coord.y];
  }

  private setPiece(coord: Coord, piece: CheckersPiece|null): void {
    this.state.board[coord.x][coord.y] = piece;
  }

  private createPiece(author: Player, pieceType: PieceType=PieceType.MAN): CheckersPiece {
    return { author: author, type: pieceType };
  }

  // ================
  // Itarators
  // ================

  private *iterSlots() {

    for (let row of this.iterRows())
      for (let column of this.iterColumns())
        yield new Coord(column, row);
    
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

  private *iterTrace(action: CheckersAction): Generator<Coord> {

    /* 
    Itera sobre os slots saltados por uma peça durante uma ação
    */

    const direction = this.getNormalizedDirection(action);
    const firstJumped = action.fromSlot.add(direction);

    for (let coord = firstJumped; !coord.equals(action.toSlot); coord = coord.add(direction))
      yield coord;
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
