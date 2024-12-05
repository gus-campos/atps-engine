
import { Game, Player, State, Action } from "./Game"

enum PieceType {
    KITTEN = 0,
    CAT = 1
}

interface Coord {
  x: number,
  y: number
}

export interface BoopPiece {
  author: Player,
  type: PieceType
}

export interface BoopBoard {
  slots: (BoopPiece|null)[][]
}

export interface BoopState extends State {
  board: BoopBoard,
  stock: number[][],

  currentPlayer: Player,
  lastPlayer: Player,

  terminated: boolean,
  value: number
}

export interface BoopAction extends Action {
  piece: BoopPiece|null,
  coord: Coord,
  sequenceChose: number
}

// TODO: Invés de terminated ser um boolean, indicar quem ganhou
// TODO: Incluir ação de escolher qual sequência será promovida

export class Boop implements Game {
  
  private readonly numberOfPlayers: number;
  private readonly boardShape: Coord;
  
  constructor() {
    this.numberOfPlayers = 2;
    this.boardShape = { x: 6, y: 6};
  }

  private getPiece(state: BoopState, coord: Coord): BoopPiece {
    return state.board.slots[coord.x][coord.y];
  }

  private setPiece(state: BoopState, coord: Coord, piece: BoopPiece) {
    state.board.slots[coord.x][coord.y] = piece;
  }

  private promoteOrWin(state: BoopState): BoopState {

    /* Search for rows of 3, promoting them, or declaring victory */

    
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
    
    let newState = structuredClone(state);
    let slots = newState.board.slots;
    
    // Para cada possível centro de subtabuleiro 3x3
    for (let i=1; i<this.boardShape.x-1; i++) {
      for (let j=1; j<this.boardShape.x-1; j++) {
        
        // Extraindo subtabuleiro
        let subBoard = slots.slice(i-1, i+2);
        subBoard = subBoard.map(row => row.slice(j-1, j+2));

        for (const row of rows) {

          // Peças da fileira
          let pieces = row.map(coord => this.getPiece(newState, {x: i + coord.x, y: j + coord.y}));

          // Se essas fileira tiver preenchida com peças do mesmo autor
          if (pieces.every(piece => piece != null) && pieces.every(piece => piece.author == pieces[0].author)) {
              
            // Se todos forem gatos, vitória
            if (pieces.every(piece => piece.type == PieceType.CAT)) {
              newState.terminated = true;
              newState.value = 1;
              return newState;
            }

            // Se não, promover sequência
            else {

              for (const coord of row) {

                let absoluteCoord = { x: i + coord.x, y: j + coord.y };
                let piece = this.getPiece(newState, absoluteCoord);
                
                newState.stock[piece.author][PieceType.CAT]++;
                this.setPiece(newState, absoluteCoord, null);
              }
            }
          }
        }
      }
    }

    return newState;
  }

  private getPieceRepr(piece: BoopPiece): string {

    /* Return an one charcater string that represents the piece */
    
    if (piece == null)
      return ".";

    let character;
    character = this.getPlayerName(piece.author);
    character = (piece.type == PieceType.CAT) ? character : character.toLowerCase();
    
    return character; 
  }

  private boopedToCoord(pusherCoord:  Coord, neighborCoord: Coord): Coord {
    let displacement = { x: neighborCoord.x - pusherCoord.x, y: neighborCoord.y - pusherCoord.y };
    let newCoord = { x: neighborCoord.x + displacement.x, y: neighborCoord.y + displacement.y };
    return newCoord;
  }

  private validCoord(coord: Coord): boolean {
    let validRow = coord.x >= 0 && coord.x < this.boardShape.x;
    let validCollum = coord.y >= 0 && coord.y < this.boardShape.y;
    return validCollum && validRow;
  }

  private getValidNeighborsCoords(state: BoopState, pusherCoord: Coord): Coord[] {

    let neighborsCoords = [];

    // Varrendo vizinhos
    for (let k=-1; k<=1; k++) {
      for (let l=-1; l<=1; l++) {
    
        if (!(k == 0 && l == 0)) {
          
          let neighborCoord = { x: pusherCoord.x + k, y: pusherCoord.y + l };

          if (this.validCoord(neighborCoord) && this.getPiece(state, neighborCoord) != null) {

            neighborsCoords.push(neighborCoord);
          }
        }
      }
    }

    return neighborsCoords;
  }

  private updateBoopings(state: BoopState, pusherCoord: Coord): BoopState {

    let pusherPiece = this.getPiece(state, pusherCoord);
    
    let neighborsCoords = this.getValidNeighborsCoords(state, pusherCoord);

    for (let neighborCoord of neighborsCoords) {

      let neighborPiece = this.getPiece(state, neighborCoord);
      
      if (pusherPiece.type == PieceType.CAT || neighborPiece.type == PieceType.KITTEN) {

        let newCoord = this.boopedToCoord(pusherCoord, neighborCoord);

        // Se a nova coordenada não for válida, peça caiu do tabuleiro, devolver pro estoque
        if (!this.validCoord(newCoord)) {

          state.stock[neighborPiece.author][neighborPiece.type]++; // TODO: Aumentar nível de abstração -> Transformar em função
          this.setPiece(state, neighborCoord, null);
        }

        // Se a nova coordenada estiver vazia, mover peça para a nova posição
        else if (this.getPiece(state, newCoord) == null) {
          
          this.setPiece(state, newCoord, neighborPiece);
          this.setPiece(state, neighborCoord, null);
        }
      }
    }

    return state;
  }

  // =============================================================

  public getInitialState(): BoopState {

    /* Returns initial Boop state */
  
    let slots = Array.from(Array(this.boardShape.x), () => Array(this.boardShape.y).fill(null));

    return {
      board: { slots: slots },
      stock: [[8,0] , [8,0]],
      currentPlayer: 0,
      lastPlayer: 1,
      terminated: false, 
      value: 0
    }
  }
  
  public getNextPlayer(currentPlayer: Player, numberOfPlayers: number=2, skipPlayers: number=0): Player {
    
    /* Returns next player */
    
    return (currentPlayer + 1 + skipPlayers) % (numberOfPlayers);
  }

  public getNextState(state: BoopState, action: BoopAction): BoopState {
    
    /* 
    Returns next state, based on action taken, 
    null piece indicates lone piece promotion,
    
    TODO
    coord with two equals negative values, indicates 
    which sequence is being chosen to promote 
    BUG ???
    */

    // ========================== REMOÇÃO ============================
    
    let newState = structuredClone(state);

    if (action.piece == null) {

      this.setPiece(newState, action.coord, null);
      newState.stock[state.currentPlayer][PieceType.CAT]++;
    }

    else {
      
      // ========================== POSICIONAMENTO =====================
      
      // TODO: Habilitar limitação de estoque
    
      if (state.stock[action.piece.author][action.piece.type] < 1)
        throw new Error("Out of stock");

      // Adiciona peça
      this.setPiece(newState, action.coord, action.piece);

      // Decrementa estoque
      newState.stock[action.piece.author][action.piece.type]--;

      // ====== Booping ======

      this.updateBoopings(newState, action.coord);

      newState = this.promoteOrWin(newState);
    }
    
    // Só passar a vez se o jogador tiver estoque
    if (newState.stock[state.currentPlayer].reduce((a, b) => a+b, 0) > 0)
      newState.currentPlayer = this.getNextPlayer(newState.currentPlayer);

    return newState;
  }

  public getValidActions(state: BoopState): Action[] {
      
    let validActions: Action[] = [];
    let playerStock = state.stock[state.currentPlayer];

    // ================ ESCOLHA DE SEQUÊNCIA ==========================



    // ================ REMOÇÃO DE PEÇA ==========================

    if (state.stock[state.currentPlayer].reduce((a, b) => a+b, 0) < 1) {
      
      for (let j=0; j<this.boardShape.y; j++) {
        for (let i=0; i<this.boardShape.x; i++) {

          let coord = { x: i, y: j};
          let piece = this.getPiece(state, coord);

          if (piece != null && piece.author == state.currentPlayer) {
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
  
          if (this.getPiece(state, coord) == null) {
  
            if (playerStock[PieceType.KITTEN]) {
  
              let newPiece = { 
                author: state.currentPlayer, 
                type: PieceType.KITTEN 
              };
  
              validActions.push({ piece: newPiece, coord: coord });
            }
  
            if (playerStock[PieceType.CAT]) {
  
              let newPiece = { 
                author: state.currentPlayer, 
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

  public printState(state: BoopState): void {

    /* Prints a string that represents the game's board */

    let table = "";

    for (let j=0; j<this.boardShape.y; j++) {
      for (let i=0; i<this.boardShape.x; i++) {

        table += this.getPieceRepr(this.getPiece(state, { x: i, y: j })) + " ";  
      }

      table += "\n"
    }

    let stock = "Estoque: ";

    for (let k=0; k<2; k++)  
      for (let l=0; l<2; l++) 
        stock += `${this.getPieceRepr({ author: k, type: l})}: ${state.stock[k][l]} | `;

    let currentPlayer = `Vez do ${this.getPieceRepr({ author: state.currentPlayer, type: 1})}`;

    console.log(table + "\n" + stock + "\n" + currentPlayer + "\n");
  }

  public getPlayerName(player: Player) {
    return (player == 0) ? "A" : "B"
  }

  // =============================================================

  public getNumberOfPlayers(): number {
      return this.numberOfPlayers;
  }

  public getValue(state: BoopState): number {
    return state.value;
  }

  public getTermination(state: BoopState): boolean {
    return state.terminated;
  }
}
