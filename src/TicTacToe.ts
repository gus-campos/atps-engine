
import { Game, Player, Piece, Board, State, Action } from "./Game"
import { Outcome, outcomeValues } from "./Game";

// TODO: Estudar significado dessas estruturas

interface TicTacToePiece extends Piece {
  author: Player
}

export interface TicTacToeBoard extends Board {
  slots: (TicTacToePiece | null)[]
}

interface TicTacToeState extends State {
  board: TicTacToeBoard,
  currentPlayer: Player,
  lastPlayer: Player,
  terminated: boolean,
  winner: (null|Player)
}

export interface TicTacToeAction extends Action {
  slot: number
  piece: TicTacToePiece,
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
export class TicTacToe implements Game {
  
  private shape: number[];
  private numberOfPlayers: number;
  private state: TicTacToeState;
  
  constructor() {
    this.shape = [3,3];
    this.numberOfPlayers = 2;
    this.state = this.getInitialState();
  }

  // Public

  public clone(): TicTacToe {
    let newGame = new TicTacToe();
    newGame.state = structuredClone(this.state);
    return newGame;
  }

  public getValidActions(): TicTacToeAction[] {

    if (this.state.terminated)
        return [];

    let actions = [];

    let slots = this.state.board.slots;

    for (let i=0; i<slots.length; i++) {
      if (slots[i] == null) {

        let action: TicTacToeAction = {
          slot: i,
          piece: { author: this.state.currentPlayer }
        };
        
        actions.push(action);
      }
    }

    return actions;
  }

  public playAction(action: TicTacToeAction): void {

    /* 
    Atualiza o estado de acordo com uma ação
    */

    // Asserting
    if (this.state.board.slots[action.slot] != null)
      throw new Error("Invalid action");

    this.state.board.slots[action.slot] = action.piece;
    
    this.state.lastPlayer = this.state.currentPlayer;
    this.state.currentPlayer = this.getNextPlayer();

    // Avaliar estado
    this.evaluateState();
  }

  public printState(): void {

    /* Gera uma string que representa o tabuleiro do jogo */

    let table = "";

    for (let i=0; i<this.shape[0]; i++) {
      for (let j=0; j<this.shape[1]; j++) {
      
        table += this.getPieceChar(this.state.board.slots[3*i+j]) + " ";
      }

      table += "\n";
    }

    console.log(table);
  }

  public getAbsValue(): number {

    if (this.state.winner == null)
      return outcomeValues.get(Outcome.DRAW);

    return outcomeValues.get(Outcome.WIN);
  }

  // Getters

  public getTermination(): boolean {
    return this.state.terminated;
  }

  public getLastPlayer(): Player {
    return this.state.currentPlayer;
  }

  public getCurrentPlayer(): Player {
    return this.state.currentPlayer;
  }

  public getWinner(): Player {
    return this.state.winner;
  }

  public getState(): TicTacToeState {
    return this.state;
  }

  // Private

  public getInitialState(): TicTacToeState {
    
    /* Gera estado inicial do jogo (tabuleiro linearizado) */

    let board: TicTacToeBoard = {
      slots: Array.from(Array(9), () => null),
    }

    let state: TicTacToeState = {
      board: board,
      currentPlayer: 0,  // Começa com o 0 (o X)
      lastPlayer: 1,     // Não é verdade, mas supões-se que não gere efeitos negativo 
      terminated: false,
      winner: null
    }

    return state;
  }

  private checkWin(): boolean {
    
    /* 
    Verifica se jogo foi ganho.
    Pode ser melhorado ao verificar apenas onde foi jogado
    */
    
    let slots = this.state.board.slots;

    for (const row of rows) {
      
      if (row.every(cell => slots[cell] != null)) {
        
        if (row.every(cell => slots[cell].author == slots[row[0]].author))
          return true;
      }
    }
    
    return false; 
  }

  private evaluateState() {

    // Vitória
    if (this.checkWin()) {
      this.state.terminated = true;
      this.state.winner = this.state.lastPlayer;
    }

    // Empate
    else if (this.getValidActions().length == 0) {
      this.state.terminated = true;
      this.state.winner = null;
    }
  }

  private getPieceChar(piece: TicTacToePiece|null): string {

    if (piece == null)
      return ".";

    return this.getPlayerChar(piece.author);
  }

  private getNextPlayer(skipPlayers: number=0): Player {
    return (this.state.currentPlayer + 1 + skipPlayers) % (this.numberOfPlayers);
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
}
