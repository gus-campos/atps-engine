
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

export interface GgPiece extends Piece {
  author: Player,
  size: Size
}

export interface GgBoard extends Board {
  slots: (GgPiece|null)[][] // Número da posição no 3D
}

export interface GgState extends State {
  board: GgBoard,
  stock: number[][], 

  currentPlayer: Player,
  lastPlayer: Player,

  terminated: boolean,
  value: number
}

export interface GgAction extends Action {
  piece: GgPiece,
  slot: number // Número da posição no 2D
  movedFrom: number|null;
}

// Game and MCTS
export class GobbletGobblers implements Game {
  
  private readonly numberOfPlayers: number;
  private readonly slotsNum: number;
  private readonly sizesNum: number;
  private readonly boardShape: Shape;
  
  constructor() {
    this.numberOfPlayers = 2;
    this.slotsNum = 9;
    this.sizesNum = 3;
    this.boardShape = {rows: 3, columns: 3}
  }

  public getInitialState(): GgState {
    
    let slots = Array.from(Array(this.slotsNum), ()=> 
      (Array.from(Array(this.sizesNum), ()=>null)));

    return {
      board: { slots: slots },
      stock: [[2,2,2], [2,2,2]],
      currentPlayer: 0,
      lastPlayer: 1,
      terminated: false, 
      value: 0
    }
  }

  public getNextState(state: GgState, action: GgAction): GgState {

    let newState = structuredClone(state);
    let boardTop = this.getBoardTop(state);
    
    // Se não foi movida, decrementar do estoque
    if (action.movedFrom == null){
      newState.stock[action.piece.author][action.piece.size] -= 1;
    } 
    
    // Se foi movida, remover antiga e fazer checagens
    else {

      let slots = newState.board.slots;
      let pieceMoved = boardTop[action.movedFrom];

      if (pieceMoved.author != action.piece.author || pieceMoved.size != action.piece.size) 
      {
        throw new Error("Not valid piece realocation");
      }

      // Remove from board
      slots[action.movedFrom][pieceMoved.size] = null;
    }

    // Put piece in place
    newState.board.slots[action.slot][action.piece.size] = action.piece;

    // Update players
    newState.lastPlayer = newState.currentPlayer;
    newState.currentPlayer = this.getNextPlayer(newState.currentPlayer);

    return this.evaluatedState(newState);
  }

  public getBoardTop(state: GgState): GgPiece[] {

    let boardTop = Array(this.slotsNum).fill(null);

    for (let i=0; i<this.slotsNum; i++) {
      for (let j=this.sizesNum-1; j>=0; j--) {
        if (state.board.slots[i][j] != null) {
          boardTop[i] = state.board.slots[i][j];
          break;
        }
      }
    }

    return boardTop;
  }

  public checkWin(state: GgState): boolean {
    
    /* 
    Verifica se jogo foi ganho.
    Pode ser melhorado ao verificar apenas onde foi jogado
    */
    
    let rows: number[][] = [
      [0,1,2],
      [3,4,5],
      [6,7,8],
      [0,3,6],
      [1,4,7],
      [2,5,8],
      [0,4,8],
      [2,4,6]
    ];
    
    let boardTop = this.getBoardTop(state);
    //console.log(boardTop);

    for (const row of rows) 
      if (row.every(cell => boardTop[cell] != null)) 
        if (row.every(cell => boardTop[cell].author == boardTop[row[0]].author))
          return true;
    
    return false; 
  }

  public getPlayerName(player: Player): string {

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

  public getPieceAuthorName(piece: GgPiece): string {

    if (piece == null)
      return ".";

    return this.getPlayerName(piece.author);
  }

  public printState(state: GgState): void {

    let slots = state.board.slots;
    let slotsTop = this.getBoardTop(state);

    // Escrevendo tabuleiro como matrix 4x3 de símbolos (boardtop na quarta)
    let boards = Array.from(Array(this.sizesNum+1), ()=>
      Array.from(Array(this.boardShape.rows), ()=>Array(this.boardShape.columns).fill(null))
    );

    for (let k=0; k<this.sizesNum+1; k++) {               // Cada nível
      for (let i=0; i<this.boardShape.rows; i++) {        // Cada coluna
        for (let j=0; j<this.boardShape.columns; j++) {   // Cada fileira
          
          let slot = j*this.boardShape.columns + i;
          
          if (k < this.sizesNum)
            boards[k][i][j] = this.getPieceAuthorName(slots[slot][k]);
          else
            boards[k][i][j] = this.getPieceAuthorName(slotsTop[slot]);
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

  public getNextPlayer(currentPlayer: Player, numberOfPlayers: number=2, skipPlayers: number=0): Player {
    return (currentPlayer + 1 + skipPlayers) % (numberOfPlayers);
  }

  public changePerspective(state: GgState, numberOfPlayers: number, skipPlayers: number): GgState {
    
    let newState = structuredClone(state);
    let slots = newState.board.slots;

    for (let i=0; i<this.slotsNum; i++)
      for (let j=0; j<this.sizesNum; j++)
        if (slots[i][j] != null) 
          slots[i][j].author = this.getNextPlayer(slots[i][j].author, numberOfPlayers, skipPlayers);

    return newState;
  }

  public getNumberOfPlayers(): number {
    return this.numberOfPlayers;
  }

  public getValidActions(state: GgState): GgAction[] {
    
    let actions = [];
    let slotsTop = this.getBoardTop(state);

    // ============== Colocando peças do estoque ==============

    // Para cada tamanho
    for (let size=0; size<this.sizesNum; size++) {

      // Se houver estoque de tal tamanho
      if (state.stock[state.currentPlayer][size] > 0) {
        
        // Para cada slot do tabuleiro
        for (let slot=0; slot<this.slotsNum; slot++) {
          
          // Se o tamanho da peça for maior que o tamanho da maior peça do slot
          if (slotsTop[slot] == null || size > slotsTop[slot].size) {

            let action: GgAction = {
              slot: slot, 
              movedFrom: null, 
              piece: { 
                author: state.currentPlayer,
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
      if (slotsTop[fromSlot] != null && slotsTop[fromSlot].author == state.currentPlayer) {
        
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

  public evaluatedState(state: GgState) {
    let newState = structuredClone(state);

    // Vitória
    if (this.checkWin(state)) {
      newState.terminated = true;
      newState.value = 1;
      return newState;
    }

    // Empate
    if (this.getValidActions(state).length == 0) {
      newState.terminated = true;
      newState.value = 0;
      return newState;
    }
    
    // Em curso, não mudar estado
    return newState;
  }

  public getValue(state: GgState): number {
    return state.value;
  }

  public getTermination(state: GgState): boolean {
    return state.terminated;
  }
}

// TODO: Peças movíveis
// TODO: Estoque de peças
