import { Game, Player, Action } from "../shared/Game";

interface TicTacToePiece {
  author: Player;
}

export interface TicTacToeBoard {
  slots: (TicTacToePiece | null)[];
}

interface TicTacToeState {
  board: TicTacToeBoard;
  currentPlayer: Player;
  lastPlayer: Player;
  terminated: boolean;
  winner: null | Player;
}

export interface TicTacToeAction extends Action {
  slot: number;
  piece: TicTacToePiece;
}

const rows: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];


let PLAYERS_SYMBOLS = new Map();
PLAYERS_SYMBOLS.set(0, "X");
PLAYERS_SYMBOLS.set(1, "O");
PLAYERS_SYMBOLS.set(null, ".");


export class TicTacToe implements Game {
  private shape: number[];
  private numberOfPlayers: number;
  private state: TicTacToeState;
  
  constructor() {
    this.shape = [3, 3];
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

    for (let i = 0; i < slots.length; i++) {
      if (slots[i] == null) {
        let action: TicTacToeAction = {
          slot: i,
          piece: { author: this.state.currentPlayer },
        };

        actions.push(action);
      }
    }

    return actions;
  }

  public playAction(action: TicTacToeAction, autoPlayMode: boolean=false): void {
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
    this.evaluateState(autoPlayMode);
  }

  public stateToString(): string {
    /* Gera uma string que representa o tabuleiro do jogo */

    let board = "";

    for (let i = 0; i < this.shape[0]; i++) {

      for (let j = 0; j < this.shape[1]; j++)
        board += this.getPieceChar(this.state.board.slots[3 * i + j]) + " ";
      
      board += "\n";
    }

    const lastPlayer = this.playerSymbol(this.state.lastPlayer);
    const currentPlayer = this.playerSymbol(this.state.currentPlayer);
    const playersTurns = `O "${lastPlayer}" jogou, vez do "${currentPlayer}":`;

    return board + "\n" + playersTurns + "\n";
  }

  public printState(): void {
    console.log(this.stateToString());
  }

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
      slots: Array.from(Array(9), ():null => null),
    };

    let state: TicTacToeState = {
      board: board,
      currentPlayer: 0, // Começa com o 0 (o X)
      lastPlayer: 1, // Não é verdade, mas supões-se que não gere efeitos negativo
      terminated: false,
      winner: null,
    };

    return state;
  }

  private checkWin(): boolean {
    /* 
    Verifica se jogo foi ganho.
    Pode ser melhorado ao verificar apenas onde foi jogado
    */

    let slots = this.state.board.slots;

    for (const row of rows) {
      if (row.every((cell) => slots[cell] != null)) {
        if (row.every((cell) => slots[cell].author == slots[row[0]].author))
          return true;
      }
    }

    return false;
  }

  private evaluateState(autoPlayMode: boolean=false) {

    // Vitória

    if (this.checkWin()) {
      this.state.terminated = true;
      this.state.winner = this.state.lastPlayer;
    }

    // Empate
    
    else if (this.gameDraw(autoPlayMode)) {
      this.state.terminated = true;
      this.state.winner = null;
    }
  }

  private gameDraw(autoPlayMode: boolean=false): boolean {

    if (autoPlayMode)
      return false

    return this.getValidActions().length == 0;
  }

  private getNextPlayer(skipPlayers: number = 0): Player {
    return (this.state.currentPlayer + 1 + skipPlayers) % this.numberOfPlayers;
  }

  private playerSymbol(player: Player|null): string {
    return PLAYERS_SYMBOLS.get(player);
  }

  private getPieceChar(piece: TicTacToePiece | null): string {
    
    if (piece == null) 
      return this.playerSymbol(null);

    return this.playerSymbol(piece.author);
  }

  public forceDraw(): void {
    this.state.terminated = true;
    this.state.winner = null;
  }
}
