
import { Game, Player, State, Action } from "./Game"

enum PieceType {
    KITTEN = 0,
    CAT = 1
}

interface BoopPiece {
  author: Player,
  type: PieceType
}

interface BoopBoard {
  slots: (BoopPiece|null)[][]
}

interface BoopState extends State {
  board: BoopBoard,
  stock: number[][],

  currentPlayer: Player,
  lastPlayer: Player,

  terminated: boolean,
  winner: null|Player
}

let PLAYERS_CHARS = new Map();
PLAYERS_CHARS.set(0, "A");
PLAYERS_CHARS.set(1, "B");

let CHARS_PLAYERS = new Map();
CHARS_PLAYERS.set("A", 0);
CHARS_PLAYERS.set("B", 1);

interface BoopAction extends Action {
  piece: BoopPiece|null,
  slot: Coord
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

const WINNING_ROWS_ARR = [
  // Verticais
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  // Horizontais
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  // Diagonais
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

let WINNING_ROWS: Coord[][] = WINNING_ROWS_ARR.map(tuples => tuples.map(tuple => new Coord(tuple[0], tuple[1])));

export class Boop implements Game {
  
  private numberOfPlayers: number;
  private boardShape: Coord;
  private state: BoopState;
  
  constructor() {
    this.numberOfPlayers = 2;
    this.boardShape = new Coord(6, 6);
    this.state = this.getInitialState();
  }

  // Public

  public clone(): Boop {
    let newGame = new Boop();
    newGame.state = structuredClone(this.state);
    return newGame;
  }

  public setState(boardDraw: string[][], stock: number[]=null, players: Player[]=null): void {

    /*
    Sets the state accordingly to the data provided
    */

    for (let slot of this.iterateSlots())
      this.state.board.slots[slot.x][slot.y] = this.getPieceFromRep(boardDraw[slot.x][slot.y])

    if (stock != null)
      this.state.stock = [[stock[0], stock[1]], [stock[2], stock[3]]];   

    if (players != null) {
      this.state.lastPlayer = players[0];
      this.state.currentPlayer = players[1];
    }

    this.updateTermination();
    this.updatePromotions();
  }
  
  public getValidActions(): Action[] {
      
    // TODO: escolha de sequência?

    if (this.state.terminated)
      return [];

    if (this.isStockEmpty(this.state.currentPlayer))
      return this.getValidRemoveActions();
    else
      return this.getValidPlaceActions();
  }

  public playAction(action: BoopAction): void {
    
    /* 
    Returns next state, based on action taken, null piece indicates 
    piece removal (and promotion), if player ends turn without stock
    he will play again next turn, making a piece removal action
    */

    // Ação de remoção de peça
    if (action.piece == null) {

      if (!this.isStockEmpty(this.state.currentPlayer))
        throw new Error("Can't remove a piece, if thhe player has any stock");
      
      if (this.getPiece(action.slot).author != this.state.currentPlayer)
        throw new Error("Can only remove it's own pieces");

      this.promotePiece(action.slot);
    }

    // Ação de posicionamento a partir do estoque
    else {
    
      if (action.piece.author != this.state.currentPlayer)
        throw new Error("Can only place it's own pieces");

      if (this.isStockEmptyOfType(action.piece.author, action.piece.type))
        throw new Error("Out of stock");

      this.placePiece(action.piece, action.slot);
      this.updateBoopings(action.slot);
      this.updateTermination();
      this.updatePromotions();
    }
    
    // Só passa vez se quem jogou terminar turno com algum estoque
    if (!this.isStockEmpty(this.state.currentPlayer)) {
      this.state.lastPlayer = this.state.currentPlayer;
      this.state.currentPlayer = this.getNextPlayer();
    }
  }

  public stateToString(): string {
      
    /* Prints a string that represents the state */
  
    // Board to string

    let board = "";
    for (let coord of this.iterateSlots()) {

      board += this.getPieceRep(this.getPiece(coord)) + " ";
      
      if (coord.x == this.boardShape.x - 1)
        board += "\n";
    }

    // Stock to string

    let stock = "";
    for (let player=0; player<2; player++)
      for (let type=0; type<2; type++) 
        stock += `${this.getPieceRep({ author: player, type: type})}: ${this.getStock(player, type)} | `;

    // Turns to string

    const lastPlayer = this.getPieceRep({ author: this.state.lastPlayer, type: 1});
    const currentPlayer = this.getPieceRep({ author: this.state.currentPlayer, type: 1});
    let turns = `${lastPlayer} jogou, vez do ${currentPlayer}:`;

    return board + "\n" + stock + "\n" + turns + "\n";
  }

  public printState(): void {

    const stateString = this.stateToString();
    console.log(stateString);
  }

  // Private

  private getInitialState(): BoopState {

    /* Returns initial Boop state */
  
    const slots = Array.from(Array(this.boardShape.x), () => Array(this.boardShape.y).fill(null));

    return {
      board: { slots: slots },
      stock: [[8,0] , [8,0]],
      currentPlayer: 0,
      lastPlayer: 1,
      terminated: false, 
      winner: null
    }
  }

  private getNextPlayer(skipPlayers: number=0): Player {
    
    /* Returns next player */
    
    return (this.state.currentPlayer + 1 + skipPlayers) % (this.numberOfPlayers);
  }

  private createPiece(author: Player, type: PieceType): BoopPiece {

    if (author != 0 && author != 1)
      throw new Error("Invalid author for piece");

    if (type != PieceType.KITTEN && type != PieceType.CAT)
      throw new Error("Invalid piece type");

    return { author: author, type: type };
  }

  private createAction(piece: BoopPiece, slot: Coord): BoopAction {
    return { piece: piece, slot: slot };
  }

  private getPiece(coord: Coord): BoopPiece {
    return this.state.board.slots[coord.x][coord.y];
  }

  private setPiece(coord: Coord, piece: BoopPiece) {
    this.state.board.slots[coord.x][coord.y] = piece;
  }

  private placePiece(piece: BoopPiece, coord: Coord): void {
    this.decrementStock(piece.author, piece.type);
    this.setPiece(coord, piece);
  }

  private incrementStock(player: Player, type: PieceType): void {
    this.state.stock[player][type]++
  }

  private decrementStock(player: Player, type: PieceType): void {
    this.state.stock[player][type]--;
  }

  private promotePiece(coord: Coord): void {
    
    const piece = this.getPiece(coord);

    if (piece == null)
      throw new Error("Can't remove a piece from an empty slot");

    this.setPiece(coord, null);
    this.incrementStock(piece.author, PieceType.CAT);
  }

  private sendPieceToStock(coord: Coord): void {
    const piece = this.getPiece(coord);
    this.setPiece(coord, null);
    this.incrementStock(piece.author, piece.type);
  }

  private movePiece(fromCoord: Coord, toCoord: Coord): void {
    const piece = this.getPiece(fromCoord);
    this.setPiece(fromCoord, null);
    this.setPiece(toCoord, piece);
  }

  private getStock(player: Player, type: PieceType): number {
    return this.state.stock[player][type];
  }

  private isStockEmptyOfType(player: Player, type: PieceType): boolean {
    return this.getStock(player, type) <= 0;
  }

  private isStockEmpty(player: Player): boolean {
    return this.isStockEmptyOfType(player, PieceType.KITTEN) && this.isStockEmptyOfType(player, PieceType.CAT);
  }

  private updateTermination(): void {

    for (let subBoardOffset of this.iterateSubBoardsOffsets()) {
      for (let row of WINNING_ROWS) {

        // Se todas do mesmo autor
        const pieces = row.map(subBoardCoord => this.getPiece(subBoardOffset.add(subBoardCoord)));
        if (pieces.every(piece => piece != null && piece.author == pieces[0].author)) {
          
          // Se todos forem gatos -> vitória
          if (pieces.every(piece => piece.type == PieceType.CAT)) {
            this.state.terminated = true;
            this.state.winner = pieces[0].author;
            return;
          }
        }
      }
    }
  }

  private updatePromotions(): void {

    for (let subBoardOffset of this.iterateSubBoardsOffsets()) {
      for (let row of WINNING_ROWS) {

        // Se todas do mesmo autor
        const pieces = row.map(subBoardCoord => this.getPiece(subBoardOffset.add(subBoardCoord)));
        if (pieces.every(piece => piece != null && piece.author == pieces[0].author)) {
            
          for (let subBoardCoord of row)
            this.promotePiece(subBoardOffset.add(subBoardCoord));
        }
      }
    }
  }

  private getPieceRep(piece: BoopPiece): string {

    /* Return an one charcater string that represents the piece */
    
    if (piece == null)
      return ".";

    let character = PLAYERS_CHARS.get(piece.author);
    character = (piece.type == PieceType.CAT) ? character : character.toLowerCase();
    
    return character; 
  }

  private getPieceFromRep(pieceRep: string): BoopPiece|null {

    const playerRep = pieceRep.toUpperCase();
    
    const playersChars = [...CHARS_PLAYERS.keys()];
    if (!playersChars.includes(playerRep))
      return null;
    
    const type = (pieceRep == pieceRep.toLowerCase()) ? PieceType.KITTEN : PieceType.CAT;
    const player = CHARS_PLAYERS.get(playerRep);

    return this.createPiece(player, type);
  }

  private boopingCoord(pusherCoord:  Coord, neighborCoord: Coord): Coord {
    /* Returns the coord to which a given piece is booped to */
    
    const displacement = neighborCoord.sub(pusherCoord);
    const newCoord = neighborCoord.add(displacement);
    return newCoord;
  }

  private validCoord(coord: Coord): boolean {
    /* Return if a coord inside board limits */

    const validRow = coord.x >= 0 && coord.x < this.boardShape.x;
    const validCollum = coord.y >= 0 && coord.y < this.boardShape.y;
    return validCollum && validRow;
  }

  private getValidNeighborsCoords(pusherCoord: Coord): Coord[] {

    let neighborsCoords = [];

    for (let neighborCoord of this.neighborIter(pusherCoord))
      if (this.validCoord(neighborCoord) && this.getPiece(neighborCoord) != null)
        neighborsCoords.push(neighborCoord);

    return neighborsCoords;
  }

  private getValidRemoveActions(): BoopAction[] {

    let validActions: BoopAction[] = [];

    if (this.isStockEmpty(this.state.currentPlayer)) {
      for (let coord of this.iterateSlots()) {

        const piece = this.getPiece(coord);
        if (piece != null && piece.author == this.state.currentPlayer)
          validActions.push(this.createAction(null, coord));
      }
    }  
    
    return validActions;
  }

  private getValidPlaceActions(): BoopAction[] {

    /*
    Iterates through the board, listing as valid placement actions,
    the action to place each available type of piece in each empty slot
    */

    let validActions: BoopAction[] = [];

    // Para cada tipo de peça
    for (let pieceType of [PieceType.KITTEN, PieceType.CAT]) {

      // Se tiver estoque
      if (!this.isStockEmptyOfType(this.state.currentPlayer, pieceType)) {
      
        // Para cada slot vazio
        for (let slot of this.iterateSlots()) {
          if (this.getPiece(slot) == null) {
  
            // Listar posicionamento de tal tipo em tal slot 
            const newPiece = this.createPiece(this.state.currentPlayer, pieceType);
            validActions.push(this.createAction(newPiece, slot));
  
          }
        }
      }
    }

    return validActions;
  }

  private updateBoopings(pusherCoord: Coord): void {

    /*
    Empurra de forma centrifuga em 1 slot de unidade, as peças
    vizinhas de um dado centro. Usado quando uma nova peça é
    colocada no tabuleiro.
    */

    const pusherPiece = this.getPiece(pusherCoord);
    
    for (let neighborCoord of this.getValidNeighborsCoords(pusherCoord)) {

      const neighborPiece = this.getPiece(neighborCoord);
      
      if (this.boopableTypes(pusherPiece.type, neighborPiece.type)) {

        const newCoord = this.boopingCoord(pusherCoord, neighborCoord);

        if (!this.validCoord(newCoord))
          this.sendPieceToStock(neighborCoord);
        
        else if (this.getPiece(newCoord) == null)
          this.movePiece(neighborCoord, newCoord);
      }
    }
  }

  private boopableTypes(pusherType: PieceType, neighborType: PieceType): boolean {
    return pusherType == PieceType.CAT || neighborType == PieceType.KITTEN;
  }

  private *iterateSlots(): Generator<Coord> {

    for (let j = 0; j < this.boardShape.y; j++)
      for (let i = 0; i < this.boardShape.x; i++)
        yield new Coord(i, j);
  }

  private *neighborIter(center: Coord): Generator<Coord> {
    
    // Para todas as posições adjacentes
    for (let k=-1; k<=1; k++) 
      for (let l=-1; l<=1; l++) 
        if (!(k == 0 && l == 0)) 
          yield center.add(new Coord(k,l));
  }

  private *iterateSubBoardsOffsets(): Generator<Coord> {

    for (let i=0; i<this.boardShape.x-2; i++) {
      for (let j=0; j<this.boardShape.x-2; j++) {
        yield new Coord(i, j);
      }
    }
  }

  // =============================================================

  // Getters

  public getTermination(): boolean {
    return this.state.terminated;
  }

  public getLastPlayer(): Player {
      return this.state.lastPlayer;
  }

  public getCurrentPlayer(): Player {
    return this.state.currentPlayer;
  }

  public getWinner(): null|Player {
      return this.state.winner;
  }
  
}
