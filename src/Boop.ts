
import { Game, Player, State, Action } from "./Game"
import { Outcome, outcomeValues } from "./Game";

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
  value: number,

  winner: null|Player
}

interface BoopAction extends Action {
  piece: BoopPiece|null,
  coord: Coord,
  sequenceChose: number
}

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
    let playerStock = this.state.stock[this.state.currentPlayer];

    // ================ ESCOLHA DE SEQUÊNCIA ==========================

    // TODO?

    // ================ REMOÇÃO DE PEÇA ==========================

    if (this.state.stock[this.state.currentPlayer].reduce((a, b) => a+b, 0) < 1) {
      
      for (let j=0; j<this.boardShape.y; j++) {
        for (let i=0; i<this.boardShape.x; i++) {

          let coord = { x: i, y: j};
          let piece = this.getPiece(coord);

          if (piece != null && piece.author == this.state.currentPlayer) {
            validActions.push({ piece: null, coord: coord });
          }
        }
      }
    }

    // ================ POSICIONAMENTO DE PEÇA ==========================

    else {

      for (let j=0; j<this.boardShape.y; j++) {
        for (let i=0; i<this.boardShape.x; i++) {
  
          let coord = { x: i, y: j};
  
          if (this.getPiece(coord) == null) {
  
            if (playerStock[PieceType.KITTEN]) {
  
              let newPiece = { 
                author: this.state.currentPlayer, 
                type: PieceType.KITTEN 
              };
  
              validActions.push({ piece: newPiece, coord: coord });
            }
  
            if (playerStock[PieceType.CAT]) {
  
              let newPiece = { 
                author: this.state.currentPlayer, 
                type: PieceType.CAT 
              };
  
              validActions.push({ piece: newPiece, coord: coord });
            }
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
    
    TODO
    coord with two equals negative values, indicates 
    which sequence is being chosen to promote 
    BUG ???
    */

    // ========================== REMOÇÃO ============================
    
    if (action.piece == null) {

      this.setPiece(action.coord, null);
      this.state.stock[this.state.currentPlayer][PieceType.CAT]++;
    }

    else {
      
      // ========================== POSICIONAMENTO =====================
      
      // TODO: Habilitar limitação de estoque
    
      if (this.state.stock[action.piece.author][action.piece.type] < 1)
        throw new Error("Out of stock");

      // Adiciona peça
      this.setPiece(action.coord, action.piece);

      // Decrementa estoque
      this.state.stock[action.piece.author][action.piece.type]--;

      // ====== Booping ======

      this.updateBoopings(action.coord);

      this.promoteOrWin();
    }
    
    // Só passar a vez se o jogador tiver estoque
    if (this.state.stock[this.state.currentPlayer].reduce((a, b) => a+b, 0) > 0)
      this.state.currentPlayer = this.getNextPlayer();
  }

  public printState(): void {

    /* Prints a string that represents the game's board */

    let table = "";

    for (let j=0; j<this.boardShape.y; j++) {
      for (let i=0; i<this.boardShape.x; i++) {

        table += this.getPieceChar(this.getPiece({ x: i, y: j })) + " ";  
      }

      table += "\n"
    }

    let stock = "Estoque: ";

    for (let k=0; k<2; k++)  
      for (let l=0; l<2; l++) 
        stock += `${this.getPieceChar({ author: k, type: l})}: ${this.state.stock[k][l]} | `;

    let currentPlayer = `Vez do ${this.getPieceChar({ author: this.state.currentPlayer, type: 1})}`;

    console.log(table + "\n" + stock + "\n" + currentPlayer + "\n");
  }

  public getAbsValue(): number {

    if (this.state.winner == null)
      return outcomeValues.get(Outcome.DRAW);

    return outcomeValues.get(Outcome.WIN);
  }

  // Getters

  public getValue(): number {
    return this.state.value;
  }

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

  // Private

  private getInitialState(): BoopState {

    /* Returns initial Boop state */
  
    let slots = Array.from(Array(this.boardShape.x), () => Array(this.boardShape.y).fill(null));

    return {
      board: { slots: slots },
      stock: [[8,0] , [8,0]],
      currentPlayer: 0,
      lastPlayer: 1,
      terminated: false, 
      value: 0,
      winner: null
    }
  }

  private getNextPlayer(skipPlayers: number=0): Player {
    
    /* Returns next player */
    
    return (this.state.currentPlayer + 1 + skipPlayers) % (this.numberOfPlayers);
  }

  private getNextGivenPlayer(player: Player): Player {
    
    /* Returns next player */
    
    return (player + 1) % (this.numberOfPlayers);
  }

  public changePerspective(): void {

    let slots = this.state.board.slots;
    
    // Chnage perspective of slots
    for (let i=0; i<slots.length; i++)
      for (let j=0; j<slots[i].length; j++)

        if (slots[i][j] != null) 
            slots[i][j].author = this.getNextGivenPlayer(slots[i][j].author);

    // Change perspective of players
    this.state.currentPlayer = this.getNextGivenPlayer(this.state.currentPlayer);
    this.state.lastPlayer = this.getNextGivenPlayer(this.state.lastPlayer);

    // Change perspective of stock
    let stockCopy = structuredClone(this.state.stock);

    for (let i=0; i<this.numberOfPlayers; i++)
      this.state.stock[i] = stockCopy[this.getNextGivenPlayer(i)];
  }

  private getPiece(coord: Coord): BoopPiece {
    return this.state.board.slots[coord.x][coord.y];
  }

  private setPiece(coord: Coord, piece: BoopPiece) {
    this.state.board.slots[coord.x][coord.y] = piece;
  }

  private promoteOrWin() {

    /* Search for rows of 3, promoting them, or declaring victory */

    // TODO: fica sendo recriado
    let rows: Coord[][] = [
      // Horizontais
      [{x:-1, y:-1}, {x:-1, y: 0}, {x:-1, y: 1}],
      [{x: 0, y:-1}, {x: 0, y: 0}, {x: 0, y: 1}],
      [{x: 1, y:-1}, {x: 1, y: 0}, {x: 1, y: 1}],
      // Verticais
      [{x:-1, y:-1}, {x: 0, y:-1}, {x: 1, y:-1}],
      [{x:-1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}],
      [{x:-1, y: 1}, {x: 0, y: 1}, {x: 1, y: 1}],
      // Diagonais
      [{x:-1, y:-1}, {x: 0, y: 0}, {x: 1, y: 1}],
      [{x: 1, y:-1}, {x: 0, y: 0}, {x:-1, y: 1}],
    ];
    
    let slots = this.state.board.slots;
    
    // Para cada possível centro de subtabuleiro 3x3
    for (let i=1; i<this.boardShape.x-1; i++) {
      for (let j=1; j<this.boardShape.x-1; j++) {
        
        // Extraindo subtabuleiro
        let subBoard = slots.slice(i-1, i+2);
        subBoard = subBoard.map(row => row.slice(j-1, j+2));

        for (const row of rows) {

          // Peças da fileira
          let pieces = row.map(coord => this.getPiece({x: i + coord.x, y: j + coord.y}));

          // Se essas fileira tiver preenchida com peças do mesmo autor
          if (pieces.every(piece => piece != null) && pieces.every(piece => piece.author == pieces[0].author)) {
              
            // Se todos forem gatos, vitória
            if (pieces.every(piece => piece.type == PieceType.CAT)) {
              this.state.terminated = true;
              this.state.value = 1;
              this.state.winner = pieces[0].author;
            }

            // Se não, promover sequência
            else {

              for (const coord of row) {

                let absoluteCoord = { x: i + coord.x, y: j + coord.y };
                let piece = this.getPiece(absoluteCoord);
                
                this.state.stock[piece.author][PieceType.CAT]++;
                this.setPiece(absoluteCoord, null);
              }
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
    
    let displacement = { x: neighborCoord.x - pusherCoord.x, y: neighborCoord.y - pusherCoord.y };
    let newCoord = { x: neighborCoord.x + displacement.x, y: neighborCoord.y + displacement.y };
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

    // Varrendo vizinhos
    for (let k=-1; k<=1; k++) {
      for (let l=-1; l<=1; l++) {
    
        if (!(k == 0 && l == 0)) {
          
          let neighborCoord = { x: pusherCoord.x + k, y: pusherCoord.y + l };

          if (this.validCoord(neighborCoord) && this.getPiece(neighborCoord) != null) {

            neighborsCoords.push(neighborCoord);
          }
        }
      }
    }

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
        if (!this.validCoord(newCoord)) {

          this.state.stock[neighborPiece.author][neighborPiece.type]++; // TODO: Aumentar nível de abstração -> Transformar em função
          this.setPiece(neighborCoord, null);
        } // TODO: "SendToStock"

        // Se a nova coordenada estiver vazia, mover peça para a nova posição
        else if (this.getPiece(newCoord) == null) {
          
          this.setPiece(newCoord, neighborPiece);
          this.setPiece(neighborCoord, null);
        }
      }
    }
  }

  private getPlayerChar(player: Player) {
    return (player == 0) ? "A" : "B"
  }

  // =============================================================

  
}
