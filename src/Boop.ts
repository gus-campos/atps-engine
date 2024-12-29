
import { Game, Player, State, Action } from "./Game"

enum PieceType {
    KITTEN = 0,
    CAT = 1
}

interface Coord {
  x: number,
  y: number
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
  coord: Coord,
  sequenceChose: number
}

const rows: Coord[][] = [
  // Horizontais
  [{x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2}],
  [{x: 1, y: 0}, {x: 1, y: 1}, {x: 1, y: 2}],
  [{x: 2, y: 0}, {x: 2, y: 1}, {x: 2, y: 2}],
  // Verticais
  [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}],
  [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}],
  [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}],
  // Diagonais
  [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 2}],
  [{x: 0, y: 2}, {x: 1, y: 1}, {x: 2, y: 0}],
];

// TODO: Invés de terminated ser um boolean, indicar quem ganhou
// TODO: Incluir ação de escolher qual sequência será promovida

export class Boop implements Game {
  
  private numberOfPlayers: number;
  private boardShape: Coord;
  private state: BoopState;
  
  constructor() {
    this.numberOfPlayers = 2;
    this.boardShape = { x: 6, y: 6};
    this.state = this.getInitialState();
  }

  // Public

  public clone(): Boop {
    let newGame = new Boop();
    newGame.state = structuredClone(this.state);
    return newGame;
  }
  
  public getValidActions(): Action[] {
      
    let validActions: Action[] = [];

    // ================ ESCOLHA DE SEQUÊNCIA ==========================

    // TODO?

    // ================ REMOÇÃO DE PEÇA ==========================

    if (this.emptyStock(this.state.currentPlayer)) {
      
      for (const coord of this.cellsIter()) {

        let piece = this.getPiece(coord);

        if (piece != null && piece.author == this.state.currentPlayer)
          validActions.push({ piece: null, coord: coord });
      }
    }

    // ================ POSICIONAMENTO DE PEÇA ==========================

    else {

      for (const coord of this.cellsIter()) {
  
        if (this.getPiece(coord) == null) {

          if (this.getStock(this.state.currentPlayer, PieceType.KITTEN) > 0) {

            let newPiece = this.createPiece(this.state.currentPlayer, PieceType.KITTEN);
            validActions.push({ piece: newPiece, coord: coord });
          }

          if (this.getStock(this.state.currentPlayer, PieceType.CAT) > 0) {

            let newPiece = this.createPiece(this.state.currentPlayer, PieceType.CAT);
            validActions.push({ piece: newPiece, coord: coord });
          }
        }
      }
    }

    return validActions;
    
  }

  public playAction(action: BoopAction): void {
    
    /* 
    Returns next state, based on action taken, 
    null piece indicates lone piece promotion,
    */

    // ========================== REMOÇÃO ============================
    
    if (action.piece == null) {

      let pieceToRemove = this.getPiece(action.coord);

      if (pieceToRemove.author != this.state.currentPlayer)
        throw new Error("Can only remove it's own pieces");

      this.promotePiece(action.coord);
    }

    else {
      
      // ========================== POSICIONAMENTO =====================
    
      if (action.piece.author != this.state.currentPlayer)
        throw new Error("Can only place it's own pieces");

      if (this.getStock(action.piece.author, action.piece.type) < 1)
        throw new Error("Out of stock");

      this.placePiece(action.piece, action.coord);

      // ====== Booping ======

      this.updateBoopings(action.coord);
      this.promoteOrWin();
    }
    
    // Só passar a vez se o jogador tiver estoque
    if (!this.emptyStock(this.state.currentPlayer)) {
      this.state.lastPlayer = this.state.currentPlayer;
      this.state.currentPlayer = this.getNextPlayer();
    }
  }

  public stateToString(): string {
      
    /* Prints a string that represents the game's board */

    let currentPlayer = `Vez do ${this.getPieceChar({ author: this.state.lastPlayer, type: 1})}:\n`;

    let table = "";

    for (let j=0; j<this.boardShape.y; j++) {
      for (let i=0; i<this.boardShape.x; i++) {

        // Get Piece At?
        table += this.getPieceChar(this.getPiece(this.createCoord(i, j))) + " ";  
      }

      table += "\n"
    }

    let stock = "Estoque: ";

    for (let player=0; player<2; player++)  
      for (let type=0; type<2; type++) 
        stock += `${this.getPieceChar({ author: player, type: type})}: ${this.getStock(player, type)} | `;

    return currentPlayer + "\n" + table + "\n" + stock + "\n";
  }

  public printState(): void {

    let table = this.stateToString();
    console.log(table);
  }

  // Private

  private *cellsIter(): Generator<Coord> {

    for (let j = 0; j < this.boardShape.y; j++)
      for (let i = 0; i < this.boardShape.x; i++)
        yield this.createCoord(i, j);
  }

  private *neighborIter(center: Coord): Generator<Coord> {
    
    // Para todas as posições adjacentes
    for (let k=-1; k<=1; k++) 
      for (let l=-1; l<=1; l++) 
        if (!(k == 0 && l == 0)) 
          yield this.createCoord(center.x + k,  center.y + l);
  }

  private *subBoardOffsetIter(): Generator<Coord> {

    for (let i=0; i<this.boardShape.x-2; i++) {
      for (let j=0; j<this.boardShape.x-2; j++) {
        yield this.createCoord(i, j);
      }
    }
  }

  private getInitialState(): BoopState {

    /* Returns initial Boop state */
  
    let slots = Array.from(Array(this.boardShape.x), () => Array(this.boardShape.y).fill(null));

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

  private createCoord(x: number, y: number): Coord {
    return { x: x, y: y};
  }

  private createPiece(author: Player, type: PieceType): BoopPiece {

    if (author != 0 && author != 1)
      throw new Error("Invalid author for piece");

    if (type != PieceType.KITTEN && type != PieceType.CAT)
      throw new Error("Invalid piece type");

    return { author: author, type: type };
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
    let piece = this.getPiece(coord);
    this.setPiece(coord, null);
    this.incrementStock(piece.author, PieceType.CAT);
  }

  private sendPieceToStock(coord: Coord): void {
    let piece = this.getPiece(coord);
    this.setPiece(coord, null);
    this.incrementStock(piece.author, piece.type);
  }

  private movePiece(fromCoord: Coord, toCoord: Coord): void {
    let piece = this.getPiece(fromCoord);
    this.setPiece(fromCoord, null);
    this.setPiece(toCoord, piece);
  }

  private getStock(player: Player, type: PieceType): number {
    return this.state.stock[player][type];
  }

  private emptyStock(player: Player) {
    return this.getStock(player, PieceType.KITTEN) + this.getStock(player, PieceType.CAT) < 1;
  }

  private promoteOrWin() {

    /* Search for rows of 3, promoting them, or declaring victory */

    // BUG: Se houverem, por exemplo, 2 sequências com 4 peças, e ele encontrar
    // primeiro a sequência promovível, invés da sequência ganhável, o player vai 
    // deixar de ganhar o jogo, sendo que cumpriu os requisitos para vitória

    // Para cada subtabuleiro
      // Para cada possível sequência




    // Para cada possível centro de subtabuleiro
    for (let subBoardOffset of this.subBoardOffsetIter()) {

      // Pra cada fileira do subtabuleiro
      for (const row of rows) {

        // Peças da fileira
        let pieces = row.map(coord => this.getPiece(this.createCoord(subBoardOffset.x+coord.x, 
                                                                     subBoardOffset.y+coord.y)));

        // Se todas forem do mesmo autor
        if (pieces.every(piece => piece != null) 
            && pieces.every(piece => piece.author == pieces[0].author)) {
          
          // Se todos forem gatos -> vitória
          if (pieces.every(piece => piece.type == PieceType.CAT)) {
            this.state.terminated = true;
            this.state.winner = pieces[0].author;
            return;
          }

          // Se não, promover sequência
          else {

            for (const coord of row) {

              let absoluteCoord = this.createCoord(subBoardOffset.x+coord.x, 
                                                   subBoardOffset.y+coord.y);
              
              this.promotePiece(absoluteCoord);
            }
          }
        }
      }
    }
  }

  private getPieceChar(piece: BoopPiece): string {

    /* Return an one charcater string that represents the piece */
    
    if (piece == null)
      return ".";

    let character;
    character = this.getPlayerChar(piece.author);
    character = (piece.type == PieceType.CAT) ? character : character.toLowerCase();
    
    return character; 
  }

  private boopedToCoord(pusherCoord:  Coord, neighborCoord: Coord): Coord {
    /* Returns the coord to which a given piece is booped to */
    
    let displacement = this.createCoord(neighborCoord.x - pusherCoord.x, neighborCoord.y - pusherCoord.y);
    let newCoord = this.createCoord(neighborCoord.x + displacement.x, neighborCoord.y + displacement.y);
    return newCoord;
  }

  private validCoord(coord: Coord): boolean {
    /* return if a coord inside board limits */

    let validRow = coord.x >= 0 && coord.x < this.boardShape.x;
    let validCollum = coord.y >= 0 && coord.y < this.boardShape.y;
    return validCollum && validRow;
  }

  private getValidNeighborsCoords(pusherCoord: Coord): Coord[] {

    let neighborsCoords = [];

    for (const neighborCoord of this.neighborIter(pusherCoord))
      if (this.validCoord(neighborCoord) && this.getPiece(neighborCoord) != null)
        neighborsCoords.push(neighborCoord);

    return neighborsCoords;
  }

  private updateBoopings(pusherCoord: Coord): void {

    let pusherPiece = this.getPiece(pusherCoord);
    
    let neighborsCoords = this.getValidNeighborsCoords(pusherCoord);

    for (let neighborCoord of neighborsCoords) {

      let neighborPiece = this.getPiece(neighborCoord);
      
      if (pusherPiece.type == PieceType.CAT || neighborPiece.type == PieceType.KITTEN) {

        let newCoord = this.boopedToCoord(pusherCoord, neighborCoord);

        // Se a nova coordenada não for válida, peça caiu do tabuleiro, devolver pro estoque
        if (!this.validCoord(newCoord))
          this.sendPieceToStock(neighborCoord);
        
        // Se a nova coordenada estiver vazia, mover peça para a nova posição
        else if (this.getPiece(newCoord) == null)
          this.movePiece(neighborCoord, newCoord);
      
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
