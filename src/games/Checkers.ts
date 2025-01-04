import { Game, Player, Coord } from "src/shared/Game";
import { RANDOM } from "../utils/Random"

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

  piecesCount: number[],

  terminated: boolean,
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

const DIRECTIONS = [
  new Coord( 1, 1),
  new Coord(-1, 1),
  new Coord(-1,-1),
  new Coord( 1,-1)
]

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

    let captureActions = this.getValidActions(true);
    let hasCaptured = false;

    const piece = this.getPiece(action.fromSlot);

    this.validateAction(action);

    // Saltos
    if (this.moveMultiplicity(action) > 1) {

      this.validateJump(action);

      const capturedSlot = this.capturedSlot(action);
      const capturedPiece = this.capturedPiece(action);
      
      if (capturedPiece != null) {
        this.setPiece(capturedSlot, null);
        this.decrementPieceCount(this.getOpponent());
        hasCaptured = true;
      }
    }

    // Move
    this.setPiece(action.fromSlot, null);
    this.setPiece(action.toSlot, piece);



    // Soprar peça se necessário
    if (captureActions.length > 0 && !this.isCaptureAction(action, captureActions)) {

      this.losePiece(action, captureActions);
    }

    // Capturas múltiplas: Não passa a vez se pelo menos mais uma captura puder ser feita
    let opponentsTurn = true;
    if (hasCaptured && this.getValidActions(true).length > 0)
      opponentsTurn = false;

    this.updatePromotions();
    this.progressPlayers(opponentsTurn);
    this.evaluateState();
  }

  public getValidActions(captureOnly: boolean=false): CheckersAction[] {

    if (this.state.terminated)
      return [];

    let actions: CheckersAction[] = [];

    for (let fromSlot of this.iterSlots()) {

      const piece = this.getPiece(fromSlot);
      
      if (piece == null || piece.author != this.state.currentPlayer)
        continue;

      if (piece.type == PieceType.MAN)
        actions = actions.concat(this.manValidActions(fromSlot, captureOnly));

      if (piece.type == PieceType.KING)
        actions = actions.concat(this.kingValidActions(fromSlot, captureOnly));
    }

    return actions;
  }

  public printState(): void {
   
    console.log(this.stateToString());
    console.log(this.state.piecesCount)
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

    if (!this.validActionDirection(action))
      throw new Error("Invalid direction");
    
    if (!this.emptySlot(action.toSlot))
      throw new Error("Can't move to an ocuppied slot");
  }

  private validateJump(action: CheckersAction): void {

    // Detectar captura
    const piece = this.getPiece(action.fromSlot);
    const capturedPiece = this.capturedPiece(action);
      
    // Validar MAN
    if (piece.type == PieceType.MAN 
        && (capturedPiece == null || this.moveMultiplicity(action) > 2))
        throw new Error("Invalid man movement");
    
    // Se não capturou
    if (capturedPiece != null) {
      
      if (capturedPiece.author != this.getOpponent())
        throw new Error("Can only capture opponent's pieces");
      
      const direction = this.getNormalizedDirection(action);
      const firstOccupiedSlot = this.firstOccupiedSlot(action.fromSlot, direction);

      if (!firstOccupiedSlot.equals(action.toSlot.sub(direction)))
        throw new Error("Can't jump over more than 1 piece");
    }
  }

  private validActionDirection(action: CheckersAction): boolean {

    const piece = this.getPiece(action.fromSlot);
    const displacement = action.toSlot.sub(action.fromSlot);

    return this.validDirection(piece, displacement);
  }

  private validDirection(piece: CheckersPiece, direction: Coord): boolean {

    const player = piece.author;
    const upwards = direction.y > 0;

    if (Math.abs(direction.x) != Math.abs(direction.y))
      return false;

    if ((player == 0 && upwards) || (player == 1 && !upwards))
      return true;

    if (piece.type == PieceType.KING)
      return true;

    return false;
  }

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

  // =========================
  // Auxiliar Private Methods
  // =========================

  private emptySlot(coord: Coord): boolean {

    if (this.getPiece(coord) != null)
      return false;

    return true;
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

  private isCaptureAction(action: CheckersAction, captureActions: CheckersAction[]): boolean {

    const stringify = (action: CheckersAction) => JSON.stringify(action);
      if (captureActions.map(stringify).includes(stringify(action)))
        return true;

    return false;
  }

  private losePiece(action: CheckersAction, captureActions: CheckersAction[]) {

    // TODO: Permitir seleção da peça perdida?
    let pieceToLoseSlot = RANDOM.choice(captureActions).fromSlot;

    // Correção para caso a peça condenada tenha sido movida
    pieceToLoseSlot = this.getPiece(pieceToLoseSlot) != null ? pieceToLoseSlot : action.toSlot;
    
    this.setPiece(pieceToLoseSlot, null);      
    this.decrementPieceCount(this.state.currentPlayer);
  }

  private capturedSlot(action: CheckersAction): Coord|null {

    const multiplicity = this.moveMultiplicity(action);
    
    if (multiplicity == 1)
      return null;

    const normalized = this.getNormalizedDirection(action);
    return action.toSlot.sub(normalized);
  }

  private firstOccupiedSlot(fromSlot: Coord, direction: Coord): Coord|null {

    for (let slot of this.iterDirection(fromSlot, direction))
      if (this.getPiece(slot) != null)
        return slot;
  
    return null;
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

    return this.getValidActions().length == 0;
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

  private progressPlayers(opponentTurn: boolean=true): void {

    /*
    Passa a vez, alternando os players atual e último
    */

    this.state.lastPlayer = this.state.currentPlayer;
    if (opponentTurn)
      this.state.currentPlayer = this.getOpponent();
  }

  private updatePromotions(): void {

    for (let column=0; column<this.boardShape.x; column++) {

      for (let promotion of [
        
        { player: 0, finalRow: this.boardShape.y-1 },
        { player: 1, finalRow: 0 }, 
      
      ]) {

        const slot = new Coord(column, promotion.finalRow);
        const piece = this.getPiece(slot);
        
        if (piece != null && piece.author == promotion.player)
          this.setPiece(slot, { author: promotion.player, type: PieceType.KING });
      }
    }
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

  private manValidActions(fromSlot: Coord, captureOnly: boolean=false): CheckersAction[] {

    const piece = this.getPiece(fromSlot);
    
    let actions: CheckersAction[] = [];
    
    for (let direction of DIRECTIONS) {
      let toSlot = fromSlot.add(direction);

      if (!this.validSlot(toSlot))
        continue;

      if (this.validDirection(piece, direction)) {

        // Se o slot estiver vazio, mover para ele
        if (this.emptySlot(toSlot)) {

          if (!captureOnly)
            actions.push({ fromSlot: fromSlot, toSlot: toSlot });
        }

        // Se não estiver vazio, checar captura
        else {
          
          const capturedPiece = this.getPiece(toSlot);
          toSlot = toSlot.add(direction);

          if (!this.validSlot(toSlot))
            continue;

          if (capturedPiece.author == this.getOpponent() && this.emptySlot(toSlot))
            actions.push({ fromSlot: fromSlot, toSlot: toSlot })
        }
      }
    }

    return actions;
  }

  private kingValidActions(fromSlot: Coord, captureOnly: boolean=false): CheckersAction[] {

    let actions: CheckersAction[] = [];

    for (let direction of DIRECTIONS) {

      // Varrer a direção
      for (let toSlot of this.iterDirection(fromSlot, direction)) {
        
        // Posições movíveis
        if (this.emptySlot(toSlot)) {

          if (!captureOnly)
            actions.push({ fromSlot: fromSlot, toSlot: toSlot });
        }

        // Tentar captura
        else {

          const capturedPiece = this.getPiece(toSlot);
          toSlot = toSlot.add(direction);

          if (this.validSlot(toSlot) && capturedPiece.author == this.getOpponent() && this.emptySlot(toSlot))
            actions.push({ fromSlot: fromSlot, toSlot: toSlot });
          
          // Parar de procurar, pois não é permitido saltar mais de uma peça
          break;
        }
      }
    }

    return actions;
  }

  // ================
  // Itarators
  // ================

  private *iterSlots(): Generator<Coord> {

    for (let row of this.iterRows()) {

      for (let column of this.iterColumns()) {
        const slot = new Coord(column, row);
        if (this.validSlot(slot))
          yield slot;
      }
    }
    
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

  private *iterDirection(fromSlot: Coord, direction: Coord): Generator<Coord> {

    for (let slot = fromSlot.add(direction); this.validSlot(slot); slot = slot.add(direction))
      yield slot;
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
