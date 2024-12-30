import { Game, Player, Piece, Board, State, Action } from "../shared/Game";

// TODO: Usar??
enum Size {
  S = 0,
  M = 1,
  L = 2,
}

type Coord = {
  x: number;
  y: number;
};

interface GgPiece extends Piece {
  author: Player;
  size: Size;
}

interface GgBoard extends Board {
  slots: (GgPiece | null)[][]; // Número da posição no 3D
}

interface GgState extends State {
  board: GgBoard;
  stock: number[][];

  currentPlayer: Player;
  lastPlayer: Player;

  terminated: boolean;
  winner: null | Player;
}

interface GgAction extends Action {
  piece: GgPiece;
  slot: number; // Número da posição no 2D
  movedFrom: number | null;
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

// TODO: Escrever testes usando um método "setState"

// Game and MCTS
export class GobbletGobblers implements Game {
  private numberOfPlayers: number;
  private nSlots: number;
  private nSizes: number;
  private boardShape: Coord;
  private state: GgState;

  constructor() {
    this.numberOfPlayers = 2;
    this.nSlots = 9;
    this.nSizes = 3;
    this.boardShape = { x: 3, y: 3 };

    this.state = this.getInitialState();
  }

  // Public

  public clone(): GobbletGobblers {
    let newGame = new GobbletGobblers();
    newGame.state = structuredClone(this.state);
    return newGame;
  }

  public playAction(action: GgAction): void {
    // Se do estoque, atualizar quantidade
    if (action.movedFrom == null) {
      this.decrementStock(action.piece);

      // Se mover, remover do tabuleiro
    } else {
      let pieceMoved = this.getTopPieceAt(action.movedFrom);

      if (
        pieceMoved.author != action.piece.author ||
        pieceMoved.size != action.piece.size
      )
        throw new Error("Not valid piece realocation");

      this.setPiece(action.movedFrom, null);
    }

    this.setPiece(action.slot, action.piece);
    this.progressPlayers();
    this.evaluateState();
  }

  public getNextPlayer(skipPlayers: number = 0): Player {
    return (this.state.currentPlayer + 1 + skipPlayers) % this.numberOfPlayers;
  }

  public getValidActions(): GgAction[] {
    let placeActions = this.getValidPlaceActions();
    let moveActions = this.getValidMoveActions();

    return placeActions.concat(moveActions);
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

  public stateToString(): string {
    /*
    Retorna uma string que representa o estado do jogo
    Alcança isso ao conectar a string que representa cada
    nível
    */

    // Gathering levels strings
    let levels = [];

    for (let size of this.iterSizes())
      levels.push(this.boardLevelToString(size));
    levels.push(this.topPiecesToString());

    // Concatenating each line
    let state = "";
    for (let i = 0; i < this.boardShape.y; i++) {
      for (let table of levels) state += table.split("\n")[i] + "   ";

      state += "\n";
    }

    return state + "\n";
  }

  public printState(): void {
    console.log(this.stateToString());
  }

  // Private

  private getInitialState(): GgState {
    let slots = Array.from(Array(this.nSlots), () =>
      Array.from(Array(this.nSizes), () => null)
    );

    return {
      board: { slots: slots },
      stock: [
        [2, 2, 2],
        [2, 2, 2],
      ],
      currentPlayer: 0,
      lastPlayer: 1,
      terminated: false,
      winner: null,
    };
  }

  private getValidPlaceActions(): GgAction[] {
    let actions = [];
    let topPieces = this.getTopPieces();

    for (let size of this.iterSizes()) {
      if (!this.isStockEmpty(this.state.currentPlayer, size)) {
        for (let slot of this.iterSlots()) {
          // Se o tamanho da peça for maior que o tamanho da maior peça do slot
          if (topPieces[slot] == null || size > topPieces[slot].size) {
            let action: GgAction = {
              slot: slot,
              movedFrom: null,
              piece: {
                author: this.state.currentPlayer,
                size: size,
              },
            };

            actions.push(action);
          }
        }
      }
    }

    return actions;
  }

  private getValidMoveActions(): GgAction[] {
    let actions = [];
    let topPieces = this.getTopPieces();

    // Para cada slot de origem
    for (let fromSlot of this.iterSlots()) {
      if (this.isMovablePiece(topPieces[fromSlot])) {
        let pieceToBeMoved = topPieces[fromSlot];

        for (let toSlot of this.iterSlots()) {
          if (
            toSlot != fromSlot &&
            this.canGobble(pieceToBeMoved, topPieces[toSlot])
          ) {
            let action: GgAction = {
              slot: toSlot,
              movedFrom: fromSlot,
              piece: pieceToBeMoved,
            };

            actions.push(action);
          }
        }
      }
    }

    return actions;
  }

  private isMovablePiece(piece: GgPiece): boolean {
    /*
    Retorna se uma peça é movível. Para isso deve existir
    e ser do jogador atual.
    */

    return piece != null && piece.author == this.state.currentPlayer;
  }

  private canGobble(piece: GgPiece, placedPiece: GgPiece) {
    return placedPiece == null || piece.size > placedPiece.size;
  }

  private setPiece(slot: number, piece: GgPiece): void {
    if (piece == null) piece = this.getTopPieceAt(slot);

    this.state.board.slots[slot][piece.size] = piece;
  }

  private getTopPieceAt(slot: number): GgPiece {
    for (let size of this.iterSizes(true))
      if (this.state.board.slots[slot][size] != null)
        return this.state.board.slots[slot][size];

    return null;
  }

  private getTopPieces(): GgPiece[] {
    let boardTop = Array(this.nSlots).fill(null);

    for (let slot = 0; slot < this.nSlots; slot++)
      boardTop[slot] = this.getTopPieceAt(slot);

    return boardTop;
  }

  private decrementStock(piece: GgPiece): void {
    this.state.stock[piece.author][piece.size]--;
  }

  private isStockEmpty(player: Player, size: number) {
    return this.state.stock[player][size] <= 0;
  }

  private checkWinner(): null | Player {
    /* 
    Verifica se jogo foi ganho.
    Pode ser melhorado ao verificar apenas onde foi jogado
    */

    let boardTop = this.getTopPieces();

    for (const row of rows)
      if (row.every((cell) => boardTop[cell] != null))
        if (
          row.every((cell) => boardTop[cell].author == boardTop[row[0]].author)
        )
          return boardTop[row[0]].author;

    return null;
  }

  private evaluateState(): void {
    let winner = this.checkWinner();

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

  private progressPlayers() {
    this.state.lastPlayer = this.state.currentPlayer;
    this.state.currentPlayer = this.getNextPlayer();
  }

  private *iterSizes(reverse: boolean = false): Generator<number> {

    if (reverse)
      for (let size = this.nSizes - 1; size >= 0; size--) 
        yield size;

    else
      for (let size = 0; size < this.nSizes; size++) 
        yield size;

  }

  private *iterSlots(): Generator<number> {
    for (let slot = 0; slot < this.nSlots; slot++) yield slot;
  }

  private slotsToString(slots: GgPiece[]): string {
    let table = "";

    for (let slot of this.iterSlots()) {
      const piece = slots[slot];
      table += this.getPieceChar(piece) + " ";

      if (slot % this.boardShape.y == this.boardShape.y - 1) table += "\n";
    }

    return table + "\n";
  }

  private getBoardLevel(levelSize: number): GgPiece[] {
    let boardLevel = Array(9).fill(null);
    for (let slot of this.iterSlots())
      boardLevel[slot] = this.state.board.slots[slot][levelSize];

    return boardLevel;
  }

  private boardLevelToString(levelSize: number): string {
    return this.slotsToString(this.getBoardLevel(levelSize));
  }

  private topPiecesToString(): string {
    return this.slotsToString(this.getTopPieces());
  }

  private getPieceChar(piece: GgPiece): string {

    if (piece == null)
      return PLAYERS_SYMBOLS.get(null);
    
    return PLAYERS_SYMBOLS.get(piece.author);
  }
}
