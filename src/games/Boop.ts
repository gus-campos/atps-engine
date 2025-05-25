import { Game, Player, Action } from "../shared/Game";
import { Coord } from "src/utils/Coord";

enum PieceType {
  /* Tipo de peça, pode ser gatinho, ou gatão */

  KITTEN = 0,
  CAT = 1,
}

interface BoopPiece {
  /* Peça do boop, tem um autor e um tipo */

  author: Player;
  type: PieceType;
}

interface BoopBoard {
  /* Tabuleiro de boop, formado por uma matriz de peças */

  slots: (BoopPiece | null)[][];
}

interface BoopState {
  /* Estado do jogo boop */

  board: BoopBoard;

  // Quantidade de peças que cada jogador tem em estoque, de cada tipo de peça
  // Exemplo:
  //    stock[0][1] == 3 -> o jogador 0 tem 3 gatões
  //    stock[1][0] == 2 -> o jogador 1 tem 2 gatinhos

  stock: number[][];

  currentPlayer: Player;
  lastPlayer: Player;

  terminated: boolean;
  winner: null | Player;

  // Turnos que se passaram desde o início
  turns: number;
}

const PLAYERS_CHARS = new Map<Player, string>([
  // Mapeia um jogador a um caracter que o simboliza
  [0, "A"],
  [1, "B"],
]);

const CHARS_PLAYERS = new Map<string, Player>([
  // Mapeia o caracter que simboliza um jogador, a um jogador
  ["A", 0],
  ["B", 1],
]);

interface BoopAction extends Action {
  /* Ação do jogo boop: posiciona uma peça e um determinada
  posição do tabuleiro. */

  piece: BoopPiece | null;
  slot: Coord;
}

const WINNING_ROWS_ARR = [
  /* Dentro de um subdivisão 3x3 de um tabuleiro, as possíveis
  diagonais que geram vitória (assim como no jogo da velha). 
  Em formato de arrays. */

  // Verticais
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  // Horizontais
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  // Diagonais
  [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  [
    [0, 2],
    [1, 1],
    [2, 0],
  ],
];

// Fileiras vencedoras em formato de coordenadas
let WINNING_ROWS: Coord[][] = WINNING_ROWS_ARR.map((tuples) =>
  tuples.map((tuple) => new Coord(tuple[0], tuple[1]))
);

// Critério de empate baseado no número de turnos
const TURNS_CRITERIA_TO_DRAW = 90;

export class Boop implements Game {
  private numberOfPlayers: number;
  private boardShape: Coord;
  private state: BoopState;

  constructor() {
    this.numberOfPlayers = 2;
    this.boardShape = new Coord(6, 6);
    this.state = this.getInitialState();
  }

  // Public

  public clone(): Boop {
    let newGame = new Boop();
    newGame.state = structuredClone(this.state);
    return newGame;
  }

  public setState(
    boardDrawing: string[][],
    stock: number[] = null,
    players: Player[] = null
  ): void {
    /*
    Seta o estado de acordo com o desenho passado do tabuleiro,
    e dos player (anterior e atual). 

    Usado para setar um estado específico e fazer testes
    a partir deles (do contrário seria necessário jogar um
    jogo inteiro via código para chegar no caso a ser testado).
    */

    for (let slot of this.iterateSlots())
      this.state.board.slots[slot.x][slot.y] = this.getPieceFromRep(
        boardDrawing[slot.x][slot.y]
      );

    if (stock != null)
      this.state.stock = [
        [stock[0], stock[1]],
        [stock[2], stock[3]],
      ];

    if (players != null) {
      this.state.lastPlayer = players[0];
      this.state.currentPlayer = players[1];
    }

    this.updateTermination();
    this.updatePromotions();
  }

  public getValidActions(): Action[] {
    if (this.state.terminated) return [];

    // Se o jogador atual não tem estoque, retornar ações de remoção
    if (this.isStockEmpty(this.state.currentPlayer))
      return this.getValidRemoveActions();
    // Do contrário, retornar ações de posicionamento
    else return this.getValidPlaceActions();
  }

  public playAction(action: BoopAction, autoPlayMode: boolean = false): void {
    /* 
    Returns next state, based on action taken, null piece indicates 
    piece removal (and promotion), if player ends turn without stock
    he will play again next turn, making a piece removal action
    */

    // Ação de remoção de peça
    if (action.piece == null) {
      if (!this.isStockEmpty(this.state.currentPlayer))
        throw new Error("Can't remove a piece, if thhe player has any stock");

      if (this.getPiece(action.slot).author != this.state.currentPlayer)
        throw new Error("Can only remove it's own pieces");

      // Promover a peça a ser removida (internamente ela é removida)
      this.promotePiece(action.slot);
    }

    // Ações de posicionamento a partir do estoque
    else {
      if (action.piece.author != this.state.currentPlayer)
        throw new Error("Can only place it's own pieces");

      if (this.isStockEmptyOfType(action.piece.author, action.piece.type))
        throw new Error("Out of stock");

      this.placePiece(action.piece, action.slot);
      // Realiza o "booping" - afastamento das peças vizinhas (sé válido)
      this.updateBoopings(action.slot);
      this.updateTermination();

      // Só realiza as promoção se jogo não tiver terminado (evita processamento desnecessário)
      if (!this.state.terminated) this.updatePromotions();
    }

    // Só passa vez se quem jogou terminar turno com algum estoque
    // do contrário, jogador joga novamente, uma ação de remoção
    const opponentsTurn = !this.isStockEmpty(this.state.currentPlayer);
    this.progressPlayers(opponentsTurn);

    this.state.turns++;
  }

  public stateToString(): string {
    // Tabuleiro para string
    let board = "";
    for (let coord of this.iterateSlots()) {
      board += this.getPieceRep(this.getPiece(coord)) + " ";

      if (coord.x == this.boardShape.x - 1) board += "\n";
    }

    // Estoque para string
    let stock = "";
    for (let player = 0; player < 2; player++) {
      for (let type = 0; type < 2; type++) {
        stock += `${this.getPieceRep({ author: player, type: type })}: ${this.getStock(player, type)} | `;
      }
      stock += "\n";
    }

    // Jogadore anterior e atual
    const lastPlayer = this.getPieceRep({
      author: this.state.lastPlayer,
      type: 1,
    });
    const currentPlayer = this.getPieceRep({
      author: this.state.currentPlayer,
      type: 1,
    });

    // Turnos
    let turns = `O "${lastPlayer}" jogou, vez do "${currentPlayer}":`;

    return board + "\n" + stock + "\n\n" + turns;
  }

  public printState(): void {
    const stateString = this.stateToString();
    console.log(stateString);
  }

  // Private

  private getInitialState(): BoopState {
    const slots = Array.from(Array(this.boardShape.x), () =>
      Array(this.boardShape.y).fill(null)
    );

    return {
      board: { slots: slots },
      stock: [
        [8, 0],
        [8, 0],
      ],
      currentPlayer: 0,
      lastPlayer: 1,
      terminated: false,
      winner: null,
      turns: 0,
    };
  }

  private getNextPlayer(): Player {
    return (this.state.currentPlayer + 1) % this.numberOfPlayers;
  }

  private progressPlayers(opponentsTurn: boolean) {
    // Considera se deve passar a vez ou não com `opponentsTurn`

    this.state.lastPlayer = this.state.currentPlayer;
    if (opponentsTurn) this.state.currentPlayer = this.getNextPlayer();
  }

  private createPiece(author: Player, type: PieceType): BoopPiece {
    if (author != 0 && author != 1) throw new Error("Invalid author for piece");

    if (type != PieceType.KITTEN && type != PieceType.CAT)
      throw new Error("Invalid piece type");

    return { author: author, type: type };
  }

  private createAction(piece: BoopPiece, slot: Coord): BoopAction {
    return { piece: piece, slot: slot };
  }

  private getPiece(coord: Coord): BoopPiece {
    return this.state.board.slots[coord.x][coord.y];
  }

  private setPiece(coord: Coord, piece: BoopPiece) {
    this.state.board.slots[coord.x][coord.y] = piece;
  }

  private placePiece(piece: BoopPiece, coord: Coord): void {
    this.decrementStock(piece.author, piece.type);
    this.setPiece(coord, piece);
  }

  private incrementStock(player: Player, type: PieceType): void {
    this.state.stock[player][type]++;
  }

  private decrementStock(player: Player, type: PieceType): void {
    this.state.stock[player][type]--;
  }

  private promotePiece(coord: Coord): void {
    const piece = this.getPiece(coord);

    if (piece == null)
      throw new Error("Can't remove a piece from an empty slot");

    this.setPiece(coord, null);
    this.incrementStock(piece.author, PieceType.CAT);
  }

  private sendPieceToStock(coord: Coord): void {
    const piece = this.getPiece(coord);
    this.setPiece(coord, null);
    this.incrementStock(piece.author, piece.type);
  }

  private movePiece(fromCoord: Coord, toCoord: Coord): void {
    const piece = this.getPiece(fromCoord);
    this.setPiece(fromCoord, null);
    this.setPiece(toCoord, piece);
  }

  private getStock(player: Player, type: PieceType): number {
    return this.state.stock[player][type];
  }

  private isStockEmptyOfType(player: Player, type: PieceType): boolean {
    return this.getStock(player, type) <= 0;
  }

  private isStockEmpty(player: Player): boolean {
    return (
      this.isStockEmptyOfType(player, PieceType.KITTEN) &&
      this.isStockEmptyOfType(player, PieceType.CAT)
    );
  }

  private updateTermination(): void {
    /* Verifica se o jogo terminou. */

    // Se o jogo tiver estourado o critério de empate, causar empate
    if (this.state.turns >= TURNS_CRITERIA_TO_DRAW) {
      this.forceDraw();
      return;
    }

    // Verificar em cada subtabuleiro 3x3 todas as possíveis fileiras vencedoras
    for (let subBoardOffset of this.iterateSubBoardsOffsets()) {
      // Para cada possível fileira vencedora
      for (let row of WINNING_ROWS) {
        // E suas peças
        const pieces = row.map((subBoardCoord) =>
          this.getPiece(subBoardOffset.add(subBoardCoord))
        );

        // Se todas são peças válidas do mesmo autor
        if (
          pieces.every(
            (piece) => piece != null && piece.author == pieces[0].author
          )
        ) {
          // E todas peças forem do tipo gatão -> vitória
          if (pieces.every((piece) => piece.type == PieceType.CAT)) {
            this.state.terminated = true;
            this.state.winner = pieces[0].author;
            return;
          }
        }
      }
    }
  }

  private updatePromotions(): void {
    /* Verifica se há alguma sequência promovível de 
    peças, e as promove. Espera que terminação já tenha 
    sido verifica, portando não se preocupa em verificar
    se um sequênci de 3 peças do mesmo autor é formada
    pot gatões. */

    // Para cada subtabuleiro 3x3
    for (let subBoardOffset of this.iterateSubBoardsOffsets()) {
      // Suas possíveis fileiras vencedoras
      for (let row of WINNING_ROWS) {
        // E suas peças
        const pieces = row.map((subBoardCoord) =>
          this.getPiece(subBoardOffset.add(subBoardCoord))
        );
        // Se todas são peças válidas do mesmo autor
        if (
          pieces.every(
            (piece) => piece != null && piece.author == pieces[0].author
          )
        ) {
          // Promover cada uma
          for (let subBoardRowCoord of row)
            this.promotePiece(subBoardOffset.add(subBoardRowCoord));
        }
      }
    }
  }

  private getPieceRep(piece: BoopPiece): string {
    /* Retorna um carater que representa a peça. */

    if (piece == null) return ".";

    let character = PLAYERS_CHARS.get(piece.author);
    character =
      piece.type == PieceType.CAT ? character : character.toLowerCase();

    return character;
  }

  private getPieceFromRep(pieceRep: string): BoopPiece | null {
    /* Retorna a peça correspondente ao caracter que representa uma peça. */

    const playerRep = pieceRep.toUpperCase();

    const playersChars = [...CHARS_PLAYERS.keys()];
    if (!playersChars.includes(playerRep)) return null;

    const type =
      pieceRep == pieceRep.toLowerCase() ? PieceType.KITTEN : PieceType.CAT;
    const player = CHARS_PLAYERS.get(playerRep);

    return this.createPiece(player, type);
  }

  private boopingCoord(pusherCoord: Coord, neighborCoord: Coord): Coord {
    /* Retorna a coordenada para a qual uma peça é empurrada/boopada.
    pusherCoord sendo a posição de quem empurrda, e neighbor coord a 
    posição da peça vizinha que está sendo empurrada. É retornada a 
    posição que esta peça é empurrada. */

    const displacement = neighborCoord.sub(pusherCoord);
    const newCoord = neighborCoord.add(displacement);
    return newCoord;
  }

  private validCoord(coord: Coord): boolean {
    /* Verifica se uma coordenada se encontra dentro dos
    limites do tabuleiro. */

    const validRow = coord.x >= 0 && coord.x < this.boardShape.x;
    const validCollum = coord.y >= 0 && coord.y < this.boardShape.y;
    return validCollum && validRow;
  }

  private getValidRemoveActions(): BoopAction[] {
    /* Retorna ações válidas de remoção de peça. */

    let validActions: BoopAction[] = [];

    // Se o jogador atual não tem estoque
    if (this.isStockEmpty(this.state.currentPlayer)) {
      // Cada slot com uma peça sua, é uma possível ação de remoção
      for (let coord of this.iterateSlots()) {
        const piece = this.getPiece(coord);
        if (piece != null && piece.author == this.state.currentPlayer)
          validActions.push(this.createAction(null, coord));
      }
    }

    return validActions;
  }

  private getValidPlaceActions(): BoopAction[] {
    /* Retorna as possíveis ações de posicionamento de peças. */

    let validActions: BoopAction[] = [];

    // Para cada tipo de peça
    for (let pieceType of [PieceType.KITTEN, PieceType.CAT]) {
      // Se tiver estoque
      if (!this.isStockEmptyOfType(this.state.currentPlayer, pieceType)) {
        // Cada slot vazio é uma possível ação de posicionamento
        for (let slot of this.iterateSlots()) {
          if (this.getPiece(slot) == null) {
            const newPiece = this.createPiece(
              this.state.currentPlayer,
              pieceType
            );

            validActions.push(this.createAction(newPiece, slot));
          }
        }
      }
    }

    return validActions;
  }

  private updateBoopings(pusherCoord: Coord): void {
    /* Empurra gatos vizinhos (iguais ou menores) de forma centrifuga 
    em 1 slot de distância, a partir da posição de quem as empurra. 
    O booping é feito quando uma nova peça é colocada no tabuleiro. */

    const pusherPiece = this.getPiece(pusherCoord);

    // Para cada posição vizinha
    for (let neighborCoord of this.getValidNeighborsCoords(pusherCoord)) {
      const neighborPiece = this.getPiece(neighborCoord);

      // Se o tipo da peça for passível de ser empurrada (boopada)
      if (this.boopableTypes(pusherPiece.type, neighborPiece.type)) {
        const newCoord = this.boopingCoord(pusherCoord, neighborCoord);

        // Se a nova coordenada inválida, enviar a peça para o estoque
        if (!this.validCoord(newCoord)) this.sendPieceToStock(neighborCoord);
        // Se for válida, apenas mover a peça para a nova coordenada
        else if (this.getPiece(newCoord) == null)
          this.movePiece(neighborCoord, newCoord);
      }
    }
  }

  private getValidNeighborsCoords(pusherCoord: Coord): Coord[] {
    /* Retorna as coordenada das posições vizinhas à posição passada,
    mas apenas as posições válidas.
    
    Exemplo:
    Se pusherCoord = (1, 1), retorna
    
      (0,2)(1,2)(2,2)
      (0,1)     (2,1)
      (0,0)(1,0)(2,0)

    Se pusherCoord = (0, 0), retorna

      (0,1)(1,1)
           (1,0)
    */

    let neighborsCoords = [];

    for (let neighborCoord of this.neighborIter(pusherCoord))
      if (
        this.validCoord(neighborCoord) &&
        this.getPiece(neighborCoord) != null
      )
        neighborsCoords.push(neighborCoord);

    return neighborsCoords;
  }

  private boopableTypes(
    pusherType: PieceType,
    neighborType: PieceType
  ): boolean {
    /* Dado dois tipos de peças passados (da peça que empurra, 
    e da peça vizinha), retorna se a segunda peça é empurrável 
    (boopável) pela primeira. */

    return pusherType == PieceType.CAT || neighborType == PieceType.KITTEN;
  }

  private *iterateSlots(): Generator<Coord> {
    /* Itera sobre todas as posições do tabuleiro. */

    for (let j = 0; j < this.boardShape.y; j++)
      for (let i = 0; i < this.boardShape.x; i++) yield new Coord(i, j);
  }

  private *neighborIter(center: Coord): Generator<Coord> {
    /* Itera entre todas as posições vizinhas à uma posição de 
    centro (ignorando o próprio centro). */

    for (let k = -1; k <= 1; k++)
      for (let l = -1; l <= 1; l++)
        if (!(k == 0 && l == 0)) yield center.add(new Coord(k, l));
  }

  private *iterateSubBoardsOffsets(): Generator<Coord> {
    /* Itera sobre os inícios, ou offsets, dos subtabuleiros 3x3 
    dentro do tabuleiro completo. Importante para verificar as 
    possíveis fileiras vencedoras. */

    for (let i = 0; i < this.boardShape.x - 2; i++) {
      for (let j = 0; j < this.boardShape.x - 2; j++) {
        yield new Coord(i, j);
      }
    }
  }

  // =============================================================

  // Getters

  public getState(): BoopState {
    return this.state;
  }

  public isGameOver(): boolean {
    return this.state.terminated;
  }

  public getLastPlayer(): Player {
    return this.state.lastPlayer;
  }

  public getCurrentPlayer(): Player {
    return this.state.currentPlayer;
  }

  public getWinner(): null | Player {
    return this.state.winner;
  }

  // Setter

  public forceDraw(): void {
    this.state.terminated = true;
    this.state.winner = null;
  }
}
