import { Game, Player, Action } from "../shared/Game";


/* Esta implementação guarda as informações do tabuleiro
de jogo da velha num array de 9 posições. Ficando sub
entendido o mapeamento:

0|1|2
-----
3|4|5
-----
6|7|8

*/

interface TicTacToePiece {

  /* 
  Peça do jogo da velha 
  (isso foi bem exagerado pra ser honesto) 
  */

  author: Player;
}

export interface TicTacToeBoard {

  /* 
  Tabuleiro do jogo da velha, como um array de 9 slots,
  cada slot podendo ter uma peça, ou não.
  */

  slots: (TicTacToePiece | null)[];
}

interface TicTacToeState {

  /* Um estado jogo da velha.
  (o ideal era que essas propriedades estivessem diretamente 
  nas propriedaes do jogo, e não encapsuladas dentro de um 
  objeto extra, ferindo um princípio de OO, mas funciona). 
  */

  board: TicTacToeBoard;
  currentPlayer: Player;
  lastPlayer: Player;
  terminated: boolean;
  winner: null | Player;
}

export interface TicTacToeAction extends Action {

  /* Especificação do formato da ação para o jogo da velha. */

  slot: number;
  piece: TicTacToePiece;
}

const rows: number[][] = [

  /* 
  Todas as possíveis sequências no tabuleiro, 
  que quando completas, ganham o jogo.
  (talvez devesse chamar "winningRows")
  */

  // Horizontal
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],

  // Vertical
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],

  // Diagonal
  [0, 4, 8],
  [2, 4, 6],
];

// Um mapeamento entre o número do jogador e seu símbolo
// Usado na geração da representação legível do estado em uma string
let PLAYERS_SYMBOLS = new Map();
PLAYERS_SYMBOLS.set(0, "X");
PLAYERS_SYMBOLS.set(1, "O");
PLAYERS_SYMBOLS.set(null, ".");


export class TicTacToe implements Game {

 // Estas 2 poderiam ser propriedades estáticas
  private shape: number[];          // [num de linhas, num de colunas]
  private numberOfPlayers: number;

  // Estado encapsulado do jogo
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
    
    /* "Se slot vazio, é uma ação válida jogar nele" */
    
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
  
    // Asserting
    if (this.state.board.slots[action.slot] != null)
      throw new Error("Invalid action");

    // Marca o tabuleiro / coloca a peça
    this.state.board.slots[action.slot] = action.piece;

    // Muda os jogadores
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

  public isGameOver(): boolean {
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

    /* Gera o estado inicial: tabuleiro 3x3 vazio,
    com jogador 0 começando. */

    let board: TicTacToeBoard = {
      slots: Array.from(Array(9), ():null => null),
    };

    let state: TicTacToeState = {
      board: board,
      currentPlayer: 0,   // Começa com o 0 (o X)
      lastPlayer: 1,      // Não é verdade que o jogador 1 acabou de jogar, mas funciona
      terminated: false,
      winner: null,
    };

    return state;
  }

  private checkWin(): boolean {

    /* 
    Verifica se jogo foi ganho.
    (Pode ser melhorado ao verificar apenas onde foi jogado, 
    mas provavelmente é uma otimização desnecessária).
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

    /* 
    Faz verificaçãoes de fim de turno, checando se
    o jogo foi ganho ou empatado, atualiando o estado
    de acordo.
    */

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

    /* Verifica se jogo empatou */

    if (autoPlayMode)
      return false

    return this.getValidActions().length == 0;
  }

  private getNextPlayer(skipPlayers: number = 0): Player {

    /* Retorna o jogador que jogará em seguida. */
    
    return (this.state.currentPlayer + 1 + skipPlayers) % this.numberOfPlayers;
  }

  private playerSymbol(player: Player|null): string {

    /* Retorna o símbolo legíel d eum jogador,
    de acordo com o mapeamento. */

    return PLAYERS_SYMBOLS.get(player);
  }

  private getPieceChar(piece: TicTacToePiece | null): string {
    
    /* Retorna o caracter correspondente de uma peça. */

    if (piece == null) 
      return this.playerSymbol(null);

    return this.playerSymbol(piece.author);
  }

  public forceDraw(): void {

    this.state.terminated = true;
    this.state.winner = null;
  }
}
