import { Game, Player, Action } from "../shared/Game";
import { Coord } from "src/utils/Coord";

enum Size {
  S = 0,
  M = 1,
  L = 2,
}

interface GgPiece {

  /* Representa uma peça do jogo. */

  author: Player;
  size: Size;
}

interface GgBoard {
  slots: (GgPiece | null)[][]; // Número da posição no 3D
}

interface GgState {

  /* 
  Representa um estado do jogo (deveria ter 
  essas propriedades diretamente 
  como propriedades do jogo).
  */

  board: GgBoard;

  /*
  Formato do estoque:
  
    stock[num do jogador][tamanho da peça] -> retorna quantidade d
    e peças de tal tamanho que tal jogador possui
  
  Tamanho da peça de acordo com o enum Size.
  */
  stock: number[][];

  currentPlayer: Player;
  lastPlayer: Player;

  terminated: boolean;
  winner: null | Player;

  turns: number;
}

// Especificação do formato de ação do Gobblet Gobblers
interface GgAction extends Action {
  piece: GgPiece;
  slot: number; // Número da posição no 2D
  movedFrom: number | null;
}

// Sequências que se preenchidas pelo mesmo jogador leva à vitória
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

// Limite de turnos no jogo antes de ser declarado um empate
// (evita jogos intermináveis, economizando tempo e recursos)
const TURNS_TO_DRAW = 30;

// Mapeamento do jogador correspondente a um símbolo
let PLAYERS_SYMBOLS = new Map();
PLAYERS_SYMBOLS.set(0, ["a", "â", "A"]);
PLAYERS_SYMBOLS.set(1, ["o", "ô", "O"]);
PLAYERS_SYMBOLS.set(null, ".");

// Mapeamento do símbolo correspondente a um jogador
let SYMBOLS_PLAYERS = new Map();
SYMBOLS_PLAYERS.set("A", 0);
SYMBOLS_PLAYERS.set("B", 1);
SYMBOLS_PLAYERS.set(".", null);


export class GobbletGobblers implements Game {

  // Estas 4 poderiam ser propriedades estáticas
  private numberOfPlayers: number;
  private nSlots: number;
  private nSizes: number;
  private boardShape: Coord;

  // Estado encapsulado do jogo
  private state: GgState;
  
  constructor() {

    this.numberOfPlayers = 2;
    this.nSlots = 9;
    this.nSizes = 3;
    this.boardShape = new Coord(3,3);
    
    this.state = this.getInitialState();
  }

  // Public

  public clone(): GobbletGobblers {
    let newGame = new GobbletGobblers();
    newGame.state = structuredClone(this.state);
    return newGame;
  }

  public setState(boardDraw: string[][][], stock: number[]=null, players: Player[]=null) {

    /* 
    Modifica o estado do jogo a partir de definições externas.
    Usado exclusivamente para facilitar testagem. Ver testes para
    compreender o formato esperado.
    */

    if (stock != null && stock.length != 6)
      throw new Error("stock has wrong dimensions");

    if (players != null && players.length != 2)
      throw new Error("players has wrong dimensions");

    if (boardDraw.length != 3 
        || boardDraw.some(level => level.length != 3 
        || level.some(row => row.length != 3))
      )
      throw new Error("boardDraw has wrong dimensions");

    // Slots

    let slots = this.state.board.slots;

    for (let slot of this.iterSlots()) {
      for (let size of this.iterSizes()) {

        const i = Math.floor(slot / this.boardShape.y);
        const j = slot % this.boardShape.y;

        const player = SYMBOLS_PLAYERS.get(boardDraw[size][i][j]);
        const piece: GgPiece|null = player != null ? { author: player, size: size } : null;

        slots[slot][size] = piece;
      }
    }

    // Stock

    if (stock != null)
      this.state.stock = [[stock[0],stock[1],stock[2]],[stock[3],stock[4],stock[5]]]
    
    // Players

    if (players != null) {
      this.state.lastPlayer = players[0];
      this.state.currentPlayer = players[1];
    }

    this.evaluateState();
  }

  public playAction(action: GgAction, autoPlayMode: boolean=false): void {

    // Ver testes para compreender formato da ação

    let pieceToPlace;
    const topPieceAt = this.getTopPieceAt(action.slot); 

    // Ação de colocar peça
    if (action.movedFrom == null) {

      pieceToPlace = action.piece;

      if (pieceToPlace.author != this.state.currentPlayer)
        throw new Error("Can only place it's own pieces");

      if (!this.canGobble(pieceToPlace, topPieceAt))
        throw new Error("Invalid piece placement");

      this.decrementStock(action.piece);
    } 
    
    // Ação de mudar uma peça do tabuleiro
    else {

      pieceToPlace = this.getTopPieceAt(action.movedFrom);
      
      if (pieceToPlace == null)
        throw new Error("No piece in this slot to move");

      if (pieceToPlace.author != this.state.currentPlayer)
        throw new Error("Can only move it's own pieces");

      if (!this.canGobble(pieceToPlace, topPieceAt))
        throw new Error("Invalid piece placement");

      this.setPiece(action.movedFrom, null);
    }

    this.setPiece(action.slot, pieceToPlace);
    this.progressPlayers();
    this.evaluateState();

    this.state.turns++;
  }

  public getNextPlayer(skipPlayers: number = 0): Player {
    return (this.state.currentPlayer + 1 + skipPlayers) % this.numberOfPlayers;
  }

  public getValidActions(): GgAction[] {

    if (this.state.terminated)
      return [];

    let placeActions = this.getValidPlaceActions();
    let moveActions = this.getValidMoveActions();

    return placeActions.concat(moveActions);
  }

  public stateToString(): string {
    /*
    Retorna uma string que representa o estado do jogo
    Primeira gera a string de cada nível do tabuleiro,
    e depois conecta uma ao lada da outra.
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

    let stock = "";
    for (let player=0; player<2; player++) {

      const playerSymbol =  PLAYERS_SYMBOLS.get(player)[2];

      for (let size=0; size<3; size++) {
        stock += `${playerSymbol}${size} - ${this.state.stock[player][size]} | `;
      }

      stock += "\n";
    }


    const lastPlayer = PLAYERS_SYMBOLS.get(this.state.lastPlayer)[2];
    const currentPlayer = PLAYERS_SYMBOLS.get(this.state.currentPlayer)[2];
    const playersTurns = `O "${lastPlayer}" jogou, vez do "${currentPlayer}":`;

    return state + "\n" + stock + "\n\n" + playersTurns;
  }

  public printState(): void {
    console.log(this.stateToString());
  }

  // Getters

  public getState(): GgState {
    return this.state;
  }

  public isGameOver(): boolean {
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

  // Private

  private getInitialState(): GgState {

    /* Gera o estado inicial: tabuleiro 3x3x3 vazio,
    com jogador 0 começando e com cada jogador tendo
    2 peças de cada tipo no estoque. */

    let slots = Array.from(Array(this.nSlots), () =>
      Array.from(Array(this.nSizes), ():null => null)
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
      turns: 0
    };
  }

  private getValidPlaceActions(): GgAction[] {

    /* Obtem ações possíveis de posicionamento de peças */

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

    /* Obtem ações possíveis de mudar peças de posição */

    let actions = [];
    let topPieces = this.getTopPieces();
    
    for (let fromSlot of this.iterSlots()) {
      
      const pieceToBeMoved = topPieces[fromSlot];
      
      if (!this.isMovablePiece(pieceToBeMoved))
        continue;


      for (let toSlot of this.iterSlots()) {

        if (toSlot == fromSlot || !this.canGobble(pieceToBeMoved, topPieces[toSlot])) 
          continue;

        const action: GgAction = {
          slot: toSlot,
          movedFrom: fromSlot,
          piece: null,
        };

        actions.push(action);
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

  private canGobble(pieceToPlace: GgPiece, placedPiece: GgPiece) {

    /* 
    Verifica se uma peça pode sobrepor a outra (
    ser coloca no num nível superior a mesma)
    */

    return placedPiece == null || pieceToPlace.size > placedPiece.size;
  }

  private setPiece(slot: number, piece: GgPiece|null): void {

    /*
    Atribui uma peça a uma posição.
    */

    const size = piece != null ? piece.size : this.getTopPieceAt(slot).size;
    
    this.state.board.slots[slot][size] = piece;
  }

  private getTopPieceAt(slot: number): GgPiece {

    /* Obtem a maior peça em um slot do tabuleiro. */

    for (let size of this.iterSizes(true)) {

      const piece = this.state.board.slots[slot][size];
      
      if (piece != null)
        return piece;
    }

    return null;
  }

  private getTopPieces(): GgPiece[] {

    let boardTop = Array(this.nSlots).fill(null);

    for (let slot of this.iterSlots())
      boardTop[slot] = this.getTopPieceAt(slot);

    return boardTop;
  }

  private decrementStock(piece: GgPiece): void {
    this.state.stock[piece.author][piece.size]--;
  }

  private isStockEmpty(player: Player, size: number) {
    return this.state.stock[player][size] <= 0;
  }

  private checkWinner(): Player[] {
    /* 
    Verifica se jogo foi ganho.
    Pode ser melhorado ao verificar apenas onde foi jogado
    */

    let boardTop = this.getTopPieces();
    let winners = [];

    for (const row of rows)
      if (row.every((cell) => boardTop[cell] != null))
        if (row.every((cell) => boardTop[cell].author == boardTop[row[0]].author))
          winners.push(boardTop[row[0]].author)
    
    return [...new Set(winners)];
  }

  private evaluateState(): void {

    let winners = this.checkWinner();
    
    // Vitória
    if (winners.length == 1) {
      this.state.terminated = true;
      this.state.winner = winners[0];
    }

    // Empate
    else if (winners.length == 2 || this.state.turns >= TURNS_TO_DRAW) {
      this.state.terminated = true;
      this.state.winner = null;
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
    for (let slot = 0; slot < this.nSlots; slot++) 
      yield slot;
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
    
    return PLAYERS_SYMBOLS.get(piece.author)[piece.size];
  }

  public forceDraw(): void {
    this.state.terminated = true;
    this.state.winner = null;
  }
}
