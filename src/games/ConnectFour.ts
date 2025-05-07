import { Game, Player, Action } from "src/shared/Game";
import { Coord } from "src/utils/Coord";

interface CfState {

  board: (CfPiece|null)[][],
  lastPlayer: Player,
  currentPlayer: Player
  terminated: boolean;
  winner: Player|null
}

interface CfPiece {
  
  author: Player
}

interface CfAction {

  author: Player,
  column: number
}

export const PLAYERS_SYMBOLS = new Map<Player|null, string>([
  [0, "X"],
  [1, "O"],
  [null, "."],
]);

export const SYMBOLS_PLAYERS = new Map<string, Player|null>([
  ["X", 0],
  ["O", 1],
  [".", null]
]);

export class ConnectFour implements Game {

  private state: CfState;
  private boardShape: Coord;
  
  constructor() {
    this.boardShape = new Coord(7,6);
    this.state = this.getInitialState();
  }

  // ================
  // Public
  // ================

  public clone(): Game {
    let newGame = new ConnectFour();
    newGame.state = structuredClone(this.state);
    return newGame;
  }

  public playAction(action: CfAction, autoPlayMode: boolean=false): void {

    if (action.column < 0 || action.column >= this.boardShape.x)
      throw new Error("Invalid column");

    let slot = this.lowestFreeSlot(action.column);

    if (slot == null)
      throw new Error("Column already filled");

    if (action.author != this.state.currentPlayer)
      throw new Error("A player can only play with its own pieces")

    const piece = this.createPiece(action.author);
    this.setPiece(slot, piece);

    this.progressPlayers();
    this.evaluateState(autoPlayMode);
  }

  public getValidActions(): Action[] {
      
    if (this.state.terminated)
      return [];

    let actions = [];

    for (let column of this.iterColumns())
      if (this.lowestFreeSlot(column) != null)
        actions.push({ author: this.state.currentPlayer, column: column });

    return actions;
  }

  public printState(): void {
   
    console.log(this.stateToString());
  }

  public stateToString(): string {

    let board = "";
    
    for (let row of this.iterRows(true)) {
      for (let column of this.iterColumns()) {

        let coord = new Coord(column, row);

        const piece = this.getPiece(coord);
        const player = piece != null ? piece.author : null;
        board += PLAYERS_SYMBOLS.get(player) + " ";
        
        if (coord.x == this.boardShape.x -1)
          board += "\n";
      }
    }

    const lastPlayer = PLAYERS_SYMBOLS.get(this.state.lastPlayer);
    const currentPlayer = PLAYERS_SYMBOLS.get(this.state.currentPlayer);
    const turns = `O "${lastPlayer}" jogou, vez do "${currentPlayer}":`;

    return board + "\n" + turns;
  }

  public setState(boardRep: string[][], players: Player[]) {

    /*
    Seta o estado de acordo com o desenho passado do tabuleiro,
    e dos player (anterior e atual). 
    
    cf.setState(

      [
        [".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", "."],
        [".", "X", ".", ".", ".", ".", "."],
        ["O", "O", ".", ".", ".", ".", "."],
        ["X", "X", ".", "X", ".", ".", "."]
      ],

      [1,0]
    );

    */

    const toRepCoord = (coord: Coord) => new Coord(coord.x, 5-coord.y); 

    for (let row of this.iterRows()) {
      for (let column of this.iterColumns()) {

        const coord = new Coord(column, row);
        const repCoord = toRepCoord(coord);

        const playerSymbol = boardRep[repCoord.y][repCoord.x];
        const player = SYMBOLS_PLAYERS.get(playerSymbol);
        const piece = player == null ? null : this.createPiece(player);

        this.setPiece(coord, piece);
      }
    }
    
    this.state.lastPlayer = players[0];
    this.state.currentPlayer = players[1];
    
    this.evaluateState();
  }

  // ================
  // Private
  // ================

  private evaluateState(autoPlayMode: boolean=false): void {

    if (this.gameWon()) {
      this.state.terminated = true;
      this.state.winner = this.state.lastPlayer;
    }

    else if (this.gameDrawn(autoPlayMode)) {
      this.state.terminated = true;
      this.state.winner = null;
    }
  }

  private gameWon(): boolean {

    /*
    Retorna se o jogo foi ganho, verifica isso varrendo
    todas as possíveis diagonais do tabuleiro
    */

    for (let descending of [false, true]) {

      for (let diagonalBegin of this.iterDiagonalsBegins(descending)) {
  
        const diagonal = [...this.iterDiagonal(diagonalBegin, descending)];
        const pieces = diagonal.map(slot => this.getPiece(slot));
        const win = pieces.every(piece => piece != null && piece.author == this.state.lastPlayer);
      
        if (win)
          return true;
      }
    }
    
    return false;
  }

  private gameDrawn(autoPlayMode: boolean=false) {

    if (autoPlayMode)
      return false;

    return this.getValidActions().length == 0;
  }

  private lowestFreeSlot(column: number): Coord {

    /*
    Retorna a coordenada do primeiro slot livre de uma 
    coluna, de baixo pra cima
    */

    for (let slot of this.iterColumnSlots(column))
      if (this.getPiece(slot) == null)
        return slot;

    return null;
  }

  private getInitialState(): CfState {

    /*
    Retorna o estado inicial do jogo
    */

    let board: CfPiece[][] = Array.from(  
      Array(this.boardShape.x), 
      ()=>Array(this.boardShape.y).fill(null)
    );

    return {

      board: board,
      lastPlayer: 1,
      currentPlayer: 0,
      terminated: false,
      winner: null
    }
  }

  private progressPlayers(): void {

    /*
    Passa a vez, alternando os players atual e último
    */

    this.state.lastPlayer = this.state.currentPlayer;
    this.state.currentPlayer = this.nextPlayer();
  }

  private nextPlayer(): Player {
    return (this.state.currentPlayer + 1) % 2;
  }

  private getPiece(coord: Coord): CfPiece|null {

    return this.state.board[coord.x][coord.y];
  }

  private setPiece(coord: Coord, piece: CfPiece|null): void {

    this.state.board[coord.x][coord.y] = piece;
  }

  private createPiece(author: Player): CfPiece {

    return { author: author };
  }

  // ================
  // Itarators
  // ================

  private *iterColumnSlots(column: number): Generator<Coord> {

    /*
    Itera pelas coordenadas dos slots de uma coluna do tabuleiro
    Assume que a coluna é valida
    */

    for (let row of this.iterRows())
      yield new Coord(column, row);
  }

  private *iterRows(reverse: boolean=false): Generator<number> {

    /*
    Itera pelos índices das linhas do tabuleiro, em
    ordem direta ou inversa
    */

    if (reverse)
      for (let row=this.boardShape.y-1; row>=0; row--)
        yield row;
  
    else
      for (let row=0; row<this.boardShape.y; row++)
        yield row;
  }

  private *iterColumns(): Generator<number> {

    /*
    Itera pelos índices das colunas do tabuleiro
    */

    for (let column=0; column<this.boardShape.x; column++)
      yield column;
  }

  private *iterDiagonalsBegins(descending: boolean=false) {

    /*
    Itera pelos offsets das possíveis diagonais
    */

    const subBoardShape = new Coord(4,4);
    const maxIndex = this.boardShape.sub(subBoardShape);
    const rowOffset = descending ? 3 : 0;

    const validCollum = (column: number) => column <= maxIndex.x;
    const validRow = (row: number) => row <= maxIndex.y;

    for (let row of this.iterRows()) if (validRow(row))
      for (let column of this.iterColumns()) if (validCollum(column))
        yield new Coord(column, row + rowOffset);
  }

  private *iterDiagonal(offset: Coord, descending: boolean=false): Generator<Coord> {

    /*
    Itera pelos slots de uma diagonal partindo de um offset
    */

    const dirFactor = descending ? -1 : 1;

    for (let i=0; i<4; i++)
      yield offset.add(new Coord(i, dirFactor*i));
  }

  // ==============
  // Getters
  // ==============

  public getLastPlayer(): Player {
    return this.state.lastPlayer;
  }

  public getCurrentPlayer(): Player {
    return this.state.currentPlayer;
  }
  
  public isGameOver(): boolean {
    return this.state.terminated;
  }

  public getWinner(): number {
    return this.state.winner;
  }

  public forceDraw(): void {
    this.state.terminated = true;
    this.state.winner = null;
  }
}
