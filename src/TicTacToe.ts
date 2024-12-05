
import { Game, Player, Piece, Board, State, Action } from "./Game"

// TODO: Estudar significado dessas estruturas

export interface TicTacToePiece extends Piece {
  author: Player
}

export interface TicTacToeBoard extends Board {
  slots: (TicTacToePiece | null)[]
}

export interface TicTacToeState extends State {
  board: TicTacToeBoard,
  currentPlayer: Player,
  lastPlayer: Player,
  terminated: boolean,
  value: number
}

export interface TicTacToeAction extends Action {
  piece: TicTacToePiece,
  slot: number
}

// Game and MCTS
export class TicTacToe implements Game {
  
  private readonly shape: number[];
  private readonly numberOfPlayers: number;
  
  constructor() {
    this.shape = [3,3];
    this.numberOfPlayers = 2;
  }

  // Public methods

  public getNextPlayer(currentPlayer: Player, numberOfPlayers: number=2, skipPlayers: number=0): Player {
    return (currentPlayer + 1 + skipPlayers) % (numberOfPlayers);
  }

  public changePerspective(state: TicTacToeState, numberOfPlayers: number=2, skipPlayers: number=0): TicTacToeState {

    let newState = structuredClone(state);
    let slots = newState.board.slots;

    for (let i=0; i<slots.length; i++)
      if (slots[i] != null) 
        slots[i].author = this.getNextPlayer(slots[i].author!, numberOfPlayers, skipPlayers);

    return newState;
  }

  public getValidActions(state: TicTacToeState): TicTacToeAction[] {

    let actions = [];

    let slots = state.board.slots;

    for (let i=0; i<slots.length; i++) {
      if (slots[i] == null) {

        let action: TicTacToeAction = {
          slot: i,
          piece: { author: state.currentPlayer }
        };
        
        actions.push(action);
      }
    }

    return actions;
  }

  public checkWin(state: TicTacToeState): boolean {
    
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
    
    let slots = state.board.slots;

    for (const row of rows) {
      
      if (row.every(cell => slots[cell] != null)) {
        
        if (row.every(cell => slots[cell].author == slots[row[0]].author))
          return true;
      }
    }
    
    return false; 
  }

  private evaluatedState(state: TicTacToeState) {

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

  public getTermination(state: TicTacToeState): boolean {
      return state.terminated;
  }

  public getValue(state: TicTacToeState): number {
      return state.value;
  }

  public getInitialState(): TicTacToeState {
    
    /* Gera estado inicial do jogo (tabuleiro linearizado) */

    let board: TicTacToeBoard = {
      slots: Array.from(Array(9), () => structuredClone(null)),
    }

    let state: TicTacToeState = {
      board: board,
      currentPlayer: 0, // Começa com o 0 (o X)
      lastPlayer: 1,     // Não é verdade, mas supões-se que não gere efeitos negativo 
      terminated: false,
      value: 0
    }

    return state;
  }

  public getNextState(state: TicTacToeState, action: TicTacToeAction) : TicTacToeState {

    /* 
    Gera um novo estado a partir da realização de uma ação
    */
    
    let newState = structuredClone(state);

    // Asserting
    if (newState.board.slots[action.slot] != null)
      throw new Error("Invalid action")

    newState.board.slots[action.slot] = action.piece;
    
    // Changing player
    newState.lastPlayer = state.currentPlayer;
    newState.currentPlayer = this.getNextPlayer(state.currentPlayer);

    // Avaliar estado e retornar
    return this.evaluatedState(newState);
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

  private getPieceAuthorName(piece: TicTacToePiece|null): string {

    if (piece == null)
      return ".";

    return this.getPlayerName(piece.author);
  }

  public printState(state: TicTacToeState): void {

    /* Gera uma string que representa o tabuleiro do jogo */

    let table = "";

    for (let i=0; i<this.shape[0]; i++) {
      for (let j=0; j<this.shape[1]; j++) {
      
        table += this.getPieceAuthorName(state.board.slots[3*i+j]) + " ";
      }
      table += "\n";
    }

    console.log(table);
  }

  public getNumberOfPlayers() {
    return this.numberOfPlayers;
  }

  public setCurrentAndLastPlayer(state: TicTacToeState, current: Player, lastPlayer: Player) {
    
    let newState = structuredClone(state);
    
    newState.currentPlayer = current;
    newState.lastPlayer = lastPlayer;

    return newState;
  }
}
