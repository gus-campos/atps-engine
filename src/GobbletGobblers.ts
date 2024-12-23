
import { Game, Player, Piece, Board, State, Action } from "./Game"

// TODO: Estudar significado dessas estruturas

enum Size {
  S = 0, // Small
  M = 1, // Medium
  L = 2  // Large
}

type Shape = {
  rows: number,
  columns: number
}

interface GgPiece extends Piece {
  author: Player,
  size: Size
}

interface GgBoard extends Board {
  slots: (GgPiece|null)[][] // Número da posição no 3D
}

interface GgState extends State {
  board: GgBoard,
  stock: number[][], 

  currentPlayer: Player,
  lastPlayer: Player,

  terminated: boolean,
  winner: null|Player
}

interface GgAction extends Action {
  piece: GgPiece,
  slot: number // Número da posição no 2D
  movedFrom: number|null;
}

const rows: number[][] = [
  [0,1,2],
  [3,4,5],
  [6,7,8],
  [0,3,6],
  [1,4,7],
  [2,5,8],
  [0,4,8],
  [2,4,6]
];

// Game and MCTS
export class GobbletGobblers implements Game {
  
  private numberOfPlayers: number;
  private slotsNum: number;
  private sizesNum: number;
  private boardShape: Shape;
  private state: GgState;
  
  constructor() {
    this.numberOfPlayers = 2;
    this.slotsNum = 9;
    this.sizesNum = 3;
    this.boardShape = {rows: 3, columns: 3}

    this.state = this.getInitialState();
  }

  // Public

  public clone(): GobbletGobblers {
    let newGame = new GobbletGobblers();
    newGame.state = structuredClone(this.state);
    return newGame;
  }

  public playAction(action: GgAction): void {

    let boardTop = this.getBoardTop();
    
    // Se não foi movida, decrementar do estoque
    if (action.movedFrom == null){
      this.state.stock[action.piece.author][action.piece.size] -= 1;
    } 
    
    // Se foi movida, remover antiga e fazer checagens
    else {

      let slots = this.state.board.slots;
      let pieceMoved = boardTop[action.movedFrom];

      if (pieceMoved.author != action.piece.author || pieceMoved.size != action.piece.size) 
      {
        throw new Error("Not valid piece realocation");
      }

      // Remove from board
      slots[action.movedFrom][pieceMoved.size] = null;
    }

    // Put piece in place
    this.state.board.slots[action.slot][action.piece.size] = action.piece;

    // Update players
    this.state.lastPlayer = this.state.currentPlayer;
    this.state.currentPlayer = this.getNextPlayer();

    this.evaluateState();
  }

  public getNextPlayer(skipPlayers: number=0): Player {
    return (this.state.currentPlayer + 1 + skipPlayers) % (this.numberOfPlayers);
  }

  public getValidActions(): GgAction[] {
    
    let actions = [];
    let slotsTop = this.getBoardTop();

    // ============== Colocando peças do estoque ==============

    // Para cada tamanho
    for (let size=0; size<this.sizesNum; size++) {

      // Se houver estoque de tal tamanho
      if (this.state.stock[this.state.currentPlayer][size] > 0) {
        
        // Para cada slot do tabuleiro
        for (let slot=0; slot<this.slotsNum; slot++) {
          
          // Se o tamanho da peça for maior que o tamanho da maior peça do slot
          if (slotsTop[slot] == null || size > slotsTop[slot].size) {

            let action: GgAction = {
              slot: slot, 
              movedFrom: null, 
              piece: { 
                author: this.state.currentPlayer,
                size: size
              }
            }

            actions.push(action);
          }
        }
      }
    } 

    // ============== Movendo peças ==============

    // Para cada slot de origem
    for (let fromSlot=0; fromSlot<this.slotsNum; fromSlot++) {
      
      // Se tiver peça, e ela for do jogador
      if (slotsTop[fromSlot] != null && slotsTop[fromSlot].author == this.state.currentPlayer) {
        
        let pieceToBeMoved = slotsTop[fromSlot];

        // Para cada slot de destino
        for (let toSlot=0; toSlot<this.slotsNum; toSlot++) {
          
          // Se for diferente do de origem e além disso a peça for maior que a maior do slot
          if (toSlot != fromSlot && (slotsTop[toSlot] == null || pieceToBeMoved.size > slotsTop[toSlot].size)) {
            
            let action: GgAction = {
              slot: toSlot, 
              movedFrom: fromSlot, 
              piece: pieceToBeMoved
            }

            actions.push(action);
          }
        }
      }
    }

    return actions;
  }

  // Getters

  public getTermination(): boolean {
    return this.state.terminated;
  }

  public getCurrentPlayer(): Player {
    return this.state.currentPlayer;
  }
  
  public getLastPlayer(): Player {
    return this.state.lastPlayer;
  }

  public getWinner(): number {
      return this.state.winner;
  }

  public printState(): void {

    let slots = this.state.board.slots;
    let slotsTop = this.getBoardTop();

    // Escrevendo tabuleiro como matrix 4x3 de símbolos (boardtop na quarta)
    let boards = Array.from(Array(this.sizesNum+1), ()=>
      Array.from(Array(this.boardShape.rows), ()=>Array(this.boardShape.columns).fill(null))
    );

    for (let k=0; k<this.sizesNum+1; k++) {               // Cada nível
      for (let i=0; i<this.boardShape.rows; i++) {        // Cada coluna
        for (let j=0; j<this.boardShape.columns; j++) {   // Cada fileira
          
          let slot = j*this.boardShape.columns + i;
          
          if (k < this.sizesNum)
            boards[k][i][j] = this.getPieceChar(slots[slot][k]);
          else
            boards[k][i][j] = this.getPieceChar(slotsTop[slot]);
        }
      }
    }

    // Criando string dos tabuleiros, com níveis lado a lado
    let table = "";
    for (let j=0; j<this.boardShape.columns; j++) {     // Cada fileira
      for (let k=0; k<this.sizesNum+1; k++) {           // Cada nível
        for (let i=0; i<this.boardShape.rows; i++) {    // Cada coluna
          table += boards[k][i][j] + " ";
        }

        // Separando table top
        if (k != this.sizesNum - 1)
          table += "\t";
        else
          table += "\t=>\t";
      }
      table += "\n"
    }

    // Imprimindo tabuleiro
    console.log(table);
  }

  // Private

  private getInitialState(): GgState {
    
    let slots = Array.from(Array(this.slotsNum), ()=> 
      (Array.from(Array(this.sizesNum), ()=>null)));

    return {
      board: { slots: slots },
      stock: [[2,2,2], [2,2,2]],
      currentPlayer: 0,
      lastPlayer: 1,
      terminated: false,
      winner: null
    }
  }

  private getBoardTop(): GgPiece[] {

    let boardTop = Array(this.slotsNum).fill(null);

    for (let i=0; i<this.slotsNum; i++) {
      for (let j=this.sizesNum-1; j>=0; j--) {
        if (this.state.board.slots[i][j] != null) {
          boardTop[i] = this.state.board.slots[i][j];
          break;
        }
      }
    }

    return boardTop;
  }

  private checkWin(): null|Player {
    
    /* 
    Verifica se jogo foi ganho.
    Pode ser melhorado ao verificar apenas onde foi jogado
    */
    
    let boardTop = this.getBoardTop();
    //console.log(boardTop);

    for (const row of rows) {

      if (row.every(cell => boardTop[cell] != null)) {

        if (row.every(cell => boardTop[cell].author == boardTop[row[0]].author)) {

          return boardTop[row[0]].author;
        }
      } 
    }
    
    return null; 
  }

  private evaluateState(): void {

    let winner = this.checkWin();

    // Vitória
    if (winner != null) {
      this.state.terminated = true;
      this.state.winner = winner;
    }

    // Empate
    if (this.getValidActions().length == 0) {
      this.state.terminated = true;
    }
  }

  private getPlayerChar(player: Player): string {

    let symbol = "";

    switch (player) {

      case 0:
        symbol = "X"
        break;

      case 1:
        symbol = "O"
        break;
    }

    return symbol;
  }

  private getPieceChar(piece: GgPiece): string {

    if (piece == null)
      return ".";

    return this.getPlayerChar(piece.author);
  }
}
