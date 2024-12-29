
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

const ROWS_ARR = [
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

let ROWS: Coord[][] = ROWS_ARR.map(tuples => tuples.map(tuple => new Coord(tuple[0], tuple[1])));

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

    for (let slot of this.slotsIter())
      this.state.board.slots[slot.x][slot.y] = this.getPieceFromRep(boardDraw[slot.x][slot.y])

    if (stock != null)
      this.state.stock = [[stock[0], stock[1]], [stock[2], stock[3]]];   

    if (players != null) {
      this.state.lastPlayer = players[0];
      this.state.currentPlayer = players[1];
    }

    this.promoteOrWin();
  }
  
  public getValidActions(): Action[] {
      
    // TODO: escolha de sequência?

    if (this.state.terminated)
      return [];

    if (this.emptyStock(this.state.currentPlayer))
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

      if (!this.emptyStock(this.state.currentPlayer))
        throw new Error("Can't remove a piece, if thhe player has any stock");
      
      if (this.getPiece(action.slot).author != this.state.currentPlayer)
        throw new Error("Can only remove it's own pieces");

      this.promotePiece(action.slot);
    }

    // Ação de posicionamento a partir do estoque
    else {
    
      if (action.piece.author != this.state.currentPlayer)
        throw new Error("Can only place it's own pieces");

      if (this.emptyStockOfType(action.piece.author, action.piece.type))
        throw new Error("Out of stock");

      this.placePiece(action.piece, action.slot);
      this.updateBoopings(action.slot);
      this.promoteOrWin();
    }
    
    // Só passa vez se quem jogou terminar turno com algum estoque
    if (!this.emptyStock(this.state.currentPlayer)) {
      this.state.lastPlayer = this.state.currentPlayer;
      this.state.currentPlayer = this.getNextPlayer();
    }
  }

  public stateToString(): string {
      
    /* Prints a string that represents the state */
  
    // Board to string

    let board = "";
    for (let coord of this.slotsIter()) {

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

  private emptyStockOfType(player: Player, type: PieceType): boolean {
    return this.getStock(player, type) <= 0;
  }

  private emptyStock(player: Player): boolean {
    return this.emptyStockOfType(player, PieceType.KITTEN) && this.emptyStockOfType(player, PieceType.CAT);
  }

  private promoteOrWin() {

    /* Search for ROWS of 3, promoting them, or declaring victory */

    // BUG: Se houverem, por exemplo, 2 sequências com 4 peças, e ele encontrar
    // primeiro a sequência promovível, invés da sequência ganhável, o player vai 
    // deixar de ganhar o jogo, sendo que cumpriu os requisitos para vitória

    // Para cada possível centro de subtabuleiro
    for (let subBoardOffset of this.subBoardOffsetIter()) {

      // Pra cada fileira do subtabuleiro
      for (let row of ROWS) {

        // Peças da fileira
        const pieces = row.map(subBoardCoord => this.getPiece(subBoardOffset.add(subBoardCoord)));

        // Se todas forem do mesmo autor
        if (pieces.every(piece => piece != null && piece.author == pieces[0].author)) {
          
          // Se todos forem gatos -> vitória
          if (pieces.every(piece => piece.type == PieceType.CAT)) {
            this.state.terminated = true;
            this.state.winner = pieces[0].author;
            return;
          }

          // Se não, promover sequência
          else {
            
            for (let subBoardCoord of row) {
              const slot = subBoardOffset.add(subBoardCoord);
              this.promotePiece(slot);
            }
          }
        }
      }
    }
  }

  private getPieceRep(piece: BoopPiece): string {

    /* Return an one charcater string that represents the piece */
    
    if (piece == null)
      return ".";

    let character = this.getPlayerChar(piece.author);
    character = (piece.type == PieceType.CAT) ? character : character.toLowerCase();
    
    return character; 
  }

  private getPieceFromRep(pieceRep: string): BoopPiece|null {

    const playerRep = pieceRep.toUpperCase();
    
    if (playerRep != "A" && playerRep != "B")
      return null;
    
    const type = (pieceRep == pieceRep.toLowerCase()) ? PieceType.KITTEN : PieceType.CAT;
    const player = (playerRep == "A") ? 0 : 1;

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

    if (this.emptyStock(this.state.currentPlayer)) {
      for (let coord of this.slotsIter()) {

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
      if (!this.emptyStockOfType(this.state.currentPlayer, pieceType)) {
      
        // Para cada slot vazio
        for (let slot of this.slotsIter()) {
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

  private *slotsIter(): Generator<Coord> {

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

  private *subBoardOffsetIter(): Generator<Coord> {

    for (let i=0; i<this.boardShape.x-2; i++) {
      for (let j=0; j<this.boardShape.x-2; j++) {
        yield new Coord(i, j);
      }
    }
  }

  private getPlayerChar(player: Player) {
    return (player == 0) ? "A" : "B"
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
