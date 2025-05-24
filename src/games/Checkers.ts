import { Game, Player } from "src/shared/Game";
import { Coord } from "src/utils/Coord";
import { RANDOM } from "../utils/Random";

/* As regras implementadas são das regras americanas do 
jogo de damas. Pode ser importante verificar as regras para 
compreender a implementação. */

function even(n: number): boolean {
  /* Função auxiliar para verificar se um número é par. */
  return n % 2 == 0;
}

export enum Direction {
  /* Possíveis direções para mover a peça */

  LEFT,
  RIGHT,
}

export enum PieceType {
  /* Tipo de peça de dama */

  MAN, // peça comum
  KING, // dama
}

interface CheckersState {
  /* Estado do jogo de dama */

  board: (CheckersPiece | null)[][];
  lastPlayer: Player;
  currentPlayer: Player;

  // Peças que cada jogador ainda tem no tabuleiro
  piecesCount: number[];

  terminated: boolean;
  winner: Player | null;

  // Turnos sem que nenhuma peça fosse capturadas: critério de empate
  turnsWithoutCapturing: number;
}

interface CheckersPiece {
  /* Peça do jogo de damas, com um autor e um tipo */
  author: Player;
  type: PieceType;
}

interface CheckersAction {
  /* Ação do jogo de damas: mover uma peça de um slot ao outro */
  fromSlot: Coord;
  toSlot: Coord;
}

export const PIECES_SYMBOLS = new Map<string, string>([
  /* Mapeia a string de uma peça, em um caracter que representa tal peça. */
  [JSON.stringify({ author: 0, type: PieceType.MAN }), "a"],
  [JSON.stringify({ author: 1, type: PieceType.MAN }), "b"],
  [JSON.stringify({ author: 0, type: PieceType.KING }), "A"],
  [JSON.stringify({ author: 1, type: PieceType.KING }), "B"],
  [null, "."],
]);

export const SYMBOLS_PIECES = new Map<string, CheckersPiece | null>([
  /* Mapeia o símbolo de uma peça, em uma  peça.*/
  ["a", { author: 0, type: PieceType.MAN }],
  ["b", { author: 1, type: PieceType.MAN }],
  ["A", { author: 0, type: PieceType.KING }],
  ["B", { author: 1, type: PieceType.KING }],
  [" ", null],
]);

const DIRECTIONS = [
  /* Possíveis direções para as quais uma peça pode se mover. */
  new Coord(1, 1),
  new Coord(-1, 1),
  new Coord(-1, -1),
  new Coord(1, -1),
];

export class Checkers implements Game {
  /* Representa o jogo de damas */

  private state: CheckersState;
  private boardShape: Coord;

  constructor() {
    this.boardShape = new Coord(8, 8);
    this.state = this.getInitialState();
  }

  // ================
  // Public Methods
  // ================

  public clone(): Game {
    let newGame = new Checkers();
    newGame.state = structuredClone(this.state);
    return newGame;
  }

  public playAction(
    action: CheckersAction,
    autoPlayMode: boolean = false
  ): void {
    let captureActions = this.getValidActions(true);
    // Registra se a peça fez captura - usada como critério para soprar ou não a peça
    let hasCaptured = false;

    const piece = this.getPiece(action.fromSlot);

    this.validateAction(action);

    // Para critério de empate
    this.state.turnsWithoutCapturing++;

    // Se for um salto
    if (this.moveMultiplicity(action) > 1) {
      // Verificar se foi um salto válido
      this.validateJump(action);

      const capturedSlot = this.capturedSlot(action);
      const capturedPiece = this.capturedPiece(action);

      // Fazer captura se for o caso (damas podem fazer saltos sem capturar)
      if (capturedPiece != null) {
        this.setPiece(capturedSlot, null);
        this.decrementPieceCount(this.getOpponent());
        hasCaptured = true;
        this.state.turnsWithoutCapturing = 0;
      }
    }

    // Mover peça
    this.setPiece(action.fromSlot, null);
    this.setPiece(action.toSlot, piece);

    // Soprar peça se necessário (se tinha movimento de captura e não o fez)
    if (
      captureActions.length > 0 &&
      !this.isCaptureAction(action, captureActions)
    ) {
      this.losePiece(action, captureActions);
      this.state.turnsWithoutCapturing = 0;
    }

    // Capturas múltiplas: Não passa a vez se ainda for possível fazer alguma captura
    let opponentsTurn = true;
    if (hasCaptured && this.getValidActions(true).length > 0)
      opponentsTurn = false;

    this.updatePromotions();
    this.progressPlayers(opponentsTurn);
    this.evaluateState(autoPlayMode);
  }

  public getValidActions(captureOnly: boolean = false): CheckersAction[] {
    if (this.state.terminated) return [];

    let actions: CheckersAction[] = [];

    // Para cada slot válido
    for (let fromSlot of this.iterValidSlots()) {
      const piece = this.getPiece(fromSlot);

      // Se não tiver peça, ou a peça não for do jogador atual, pular iteração
      if (piece == null || piece.author != this.state.currentPlayer) continue;

      // Adicionar ações de peça comum ou de damas às ações possíveis
      if (piece.type == PieceType.MAN)
        actions.push(...this.manValidActions(fromSlot, captureOnly));

      if (piece.type == PieceType.KING)
        actions.push(...this.kingValidActions(fromSlot, captureOnly));
    }

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
        board += this.pieceToSymbol(piece) + " ";

        if (coord.x == this.boardShape.x - 1) board += "\n";
      }
    }

    // Símbolo dos jogadores igual ao símbolo da dama (letras maiúsculas)
    const lastPlayer = this.pieceToSymbol({
      author: this.state.lastPlayer,
      type: PieceType.KING,
    });

    const currentPlayer = this.pieceToSymbol({
      author: this.state.currentPlayer,
      type: PieceType.KING,
    });

    const turns = `O "${lastPlayer}" jogou, vez do "${currentPlayer}":`;

    return board + "\n" + turns + "\n" + this.state.turnsWithoutCapturing;
  }

  public setState(boardRep: string[][], players: Player[]) {
    /*
    Seta o estado de acordo com o desenho passado do tabuleiro,
    e dos player (anterior e atual). 

    Usado para setar um estado específico e fazer testes
    a partir deles (do contrário seria necessário jogar um
    jogo inteiro via código para chegar no caso a ser testado).
    
    cf.setState(

      [
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
        [".", ".", ".", ".", ".", ".", ".", "."],
      ],

      [1,0]
    );

    */

    // Função auxiliar que mapeia entre posição do tabuleiro para
    // posição da representação
    const toRepCoord = (coord: Coord) =>
      new Coord(coord.x, this.boardShape.y - 1 - coord.y);

    this.state.piecesCount = [0, 0];

    // Para cada fileira e coluna
    for (let row of this.iterRows()) {
      for (let column of this.iterColumns()) {
        // E suas coordenadas
        const coord = new Coord(column, row);
        const repCoord = toRepCoord(coord);

        const pieceSymbol = boardRep[repCoord.y][repCoord.x];
        const piece = this.symbolToPiece(pieceSymbol);

        // Posicionar as peças correspondentes no tabuleiro
        this.setPiece(coord, piece);

        // Incrementar as peças do jogador
        if (piece != null) this.state.piecesCount[piece.author]++;
      }
    }

    // Setar jogadores
    this.state.lastPlayer = players[0];
    this.state.currentPlayer = players[1];

    this.evaluateState();
  }

  // =========================
  // Validators
  // =========================

  private validateAction(action: CheckersAction): void {
    const piece = this.getPiece(action.fromSlot);

    if (piece == null) throw new Error("No piece to move in that slot");

    if (piece.author != this.state.currentPlayer)
      throw new Error("Can only play with its own pieces");

    if (!this.validActionDirection(action))
      throw new Error("Invalid direction");

    if (!this.emptySlot(action.toSlot))
      throw new Error("Can't move to an ocuppied slot");
  }

  private validateJump(action: CheckersAction): void {
    /* Valida movimento de salto */

    const piece = this.getPiece(action.fromSlot);
    const capturedPiece = this.capturedPiece(action);

    // Para peça comum, inválido se não capturou ou se moveu mais de 2 posições
    if (
      piece.type == PieceType.MAN &&
      (capturedPiece == null || this.moveMultiplicity(action) > 2)
    )
      throw new Error("Invalid man movement");

    // Se capturou
    if (capturedPiece != null) {
      // Mas capturou própria peça - inválido
      if (capturedPiece.author != this.getOpponent())
        throw new Error("Can only capture opponent's pieces");

      // Direção normalizada (com norma igual a 1)
      const direction = this.getNormalizedDirection(action);

      // Primeira posição ocupada em uma dada direção
      const firstOccupiedSlot = this.firstOccupiedSlot(
        action.fromSlot,
        direction
      );

      // Se capturou peça do oponente, mas não parou imediatamente depois - inválido
      if (!firstOccupiedSlot.equals(action.toSlot.sub(direction)))
        throw new Error("Can't jump over more than 1 piece");
    }
  }

  private validActionDirection(action: CheckersAction): boolean {
    const piece = this.getPiece(action.fromSlot);
    const displacement = action.toSlot.sub(action.fromSlot);

    return this.validDirection(piece, displacement);
  }

  private validDirection(piece: CheckersPiece, direction: Coord): boolean {
    /* Verifica se uma direção é válida para uma dada peça mover.  */

    const player = piece.author;

    // Se está ou não movendo tabuleiro a cima
    const upwards = direction.y > 0;

    // Inválido se movimento é em formato de "L"
    if (Math.abs(direction.x) != Math.abs(direction.y)) return false;

    // Válido se o jogador não estiver voltando
    if ((player == 0 && upwards) || (player == 1 && !upwards)) return true;

    // Válido se for dama
    if (piece.type == PieceType.KING) return true;

    return false;
  }

  private validSlot(coord: Coord) {
    /* Verifica se a coordenada passada é ua posição válida */

    let validXBound = coord.x >= 0 && coord.x < this.boardShape.x;
    let validYBound = coord.y >= 0 && coord.y < this.boardShape.y;

    // Inválido se não estiver nos limites do tabuleiro
    if (!validXBound || !validYBound) return false;

    const darkSquare = this.darkSquare(coord);

    // Inválido se for um quadrado preto (em damas, peças só
    // ficam em quadrados brancos)
    if (!darkSquare) return false;

    return true;
  }

  private darkSquare(coord: Coord): boolean {
    /* Verifica se é quadrado preto. */

    return (
      (even(coord.x) && even(coord.y)) || (!even(coord.x) && !even(coord.y))
    );
  }

  // =========================
  // Auxiliar Private Methods
  // =========================

  private emptySlot(coord: Coord): boolean {
    /* Verifica seposição está vazia */

    if (this.getPiece(coord) != null) return false;

    return true;
  }

  private moveMultiplicity(action: CheckersAction) {
    /* Verifica a magnitude/multiplicidade do movimento 
    
    Exemplo: 
      Delocamento (4,4) tem magnitude 4
      Delocamento (2,2) tem magnitude 2
    
    Assume que o movimento não é em formato de "L".
    */

    const displacement = action.toSlot.sub(action.fromSlot);

    return Math.abs(displacement.x);
  }

  private getNormalizedDirection(action: CheckersAction): Coord {
    /* Obtem a direção normalizada de um movimento. Ou seja, 
    dado um deslocamento, encontra o "vetor" de magnitude 1 em tal 
    direção. 
    
    Exemplo: 
      (0,0) -> (3,3) tem direção normalizada (1,1)
      (3,3) -> (0,0) tem direção normalizada (-1,-1)
      (5,5) -> (7,3) tem direção normalizada (1,-1)
    */

    const displacement = action.toSlot.sub(action.fromSlot);
    const multiplicity = this.moveMultiplicity(action);

    return displacement.mult(1 / multiplicity);
  }

  private capturedPiece(action: CheckersAction): CheckersPiece | null {
    /* Retorna a peça captura em dada ação. Retorna null se nenhuma
    peça foi capturada. */

    const slot = this.capturedSlot(action);

    if (slot == null) return null;

    return this.getPiece(slot);
  }

  private isCaptureAction(
    action: CheckersAction,
    captureActions: CheckersAction[]
  ): boolean {
    /* Verifica se uma ação foi de captura. Faz isso ao verificar se
    a ação passada por argumento se encontra no array de ações de captura
    também passado por argumento (poderia chamar "isActionInActionArray") */

    const stringify = (action: CheckersAction) => JSON.stringify(action);
    if (captureActions.map(stringify).includes(stringify(action))) return true;

    return false;
  }

  private losePiece(action: CheckersAction, captureActions: CheckersAction[]) {
    /* Sopra peça do jogador que se recusou a fazer uma captura. */

    // Peça aleatória entre as peças quue poderiam fazer captura
    let pieceToLoseSlot = RANDOM.choice(captureActions).fromSlot;

    // Correção para caso a peça condenada a ser perdida tenha sido movida em seguida
    pieceToLoseSlot =
      this.getPiece(pieceToLoseSlot) != null ? pieceToLoseSlot : action.toSlot;

    this.setPiece(pieceToLoseSlot, null);
    this.decrementPieceCount(this.state.currentPlayer);
  }

  private capturedSlot(action: CheckersAction): Coord | null {
    /* Dada uma ação, retorna a posição na qual uma captura
    teria sido feita (uma posição antes da posição para qual
    a peça foi movida).*/

    const multiplicity = this.moveMultiplicity(action);

    if (multiplicity == 1) return null;

    const normalized = this.getNormalizedDirection(action);
    return action.toSlot.sub(normalized);
  }

  private firstOccupiedSlot(fromSlot: Coord, direction: Coord): Coord | null {
    /* Dada um posição de origem e uma direção, retorna a primeira posição
    ocupada por alguma peça. Se não houver peça naquela direção, retorna null.  */

    for (let slot of this.iterDirection(fromSlot, direction))
      if (this.getPiece(slot) != null) return slot;

    return null;
  }

  private decrementPieceCount(player: Player): void {
    this.state.piecesCount[player]--;
  }

  // =====================
  // Main private methods
  // =====================

  private evaluateState(autoPlayMode: boolean = false): void {
    if (this.gameWon()) {
      this.state.terminated = true;
      this.state.winner = this.state.lastPlayer;
      return;
    } else if (this.gameDrawn(autoPlayMode)) {
      this.state.terminated = true;
      this.state.winner = null;
    }
  }

  private gameWon(): boolean {
    /* Verifica se o jogo foi ganho (quando o jogador atual, 
    após passar a vez, já não tem nenhuma peça restante). */

    return this.state.piecesCount[this.state.currentPlayer] <= 0;
  }

  private gameDrawn(autoPlayMode: boolean = false): boolean {
    /* Verifica se o jogo foi empatado (no autoplay mode
    economiza processamento ao não buscar as ações válidas, 
    deixando dar erro, caso a ação seja inválida). */

    if (this.state.turnsWithoutCapturing >= 20) return true;

    if (autoPlayMode) return false;

    if (this.getValidActions().length == 0) return true;
  }

  private getInitialState(): CheckersState {
    let board: CheckersPiece[][] = Array.from(Array(this.boardShape.x), () =>
      Array(this.boardShape.y).fill(null)
    );

    const filledRows = 3;

    for (let slot of this.iterValidSlots()) {
      if (slot.y < filledRows) board[slot.x][slot.y] = this.createPiece(0);

      if (slot.y >= this.boardShape.y - filledRows)
        board[slot.x][slot.y] = this.createPiece(1);
    }

    return {
      board: board,
      lastPlayer: 1,
      currentPlayer: 0,
      piecesCount: [12, 12],
      terminated: false,
      winner: null,
      turnsWithoutCapturing: 0,
    };
  }

  private pieceToSymbol(piece: CheckersPiece): string {
    if (piece == null) return PIECES_SYMBOLS.get(null);
    return PIECES_SYMBOLS.get(JSON.stringify(piece));
  }

  private symbolToPiece(symbol: string): CheckersPiece | null {
    if (![...SYMBOLS_PIECES.keys()].includes(symbol))
      throw new Error(`Invalid piece symbol: "${symbol}"`);

    return SYMBOLS_PIECES.get(symbol);
  }

  private progressPlayers(opponentsTurn: boolean = true): void {
    this.state.lastPlayer = this.state.currentPlayer;
    if (opponentsTurn) this.state.currentPlayer = this.getOpponent();
  }

  private updatePromotions(): void {
    /* Verifica se alguma peça precisa ser promovida (peça
    no lado oposto de origem no tabuleiro), e as promove.*/

    // Para cada coluna
    for (let column = 0; column < this.boardShape.x; column++) {
      // Considerando cada player e sua respectiva fileira
      for (let promotion of [
        { player: 0, finalRow: this.boardShape.y - 1 },
        { player: 1, finalRow: 0 },
      ]) {
        const slot = new Coord(column, promotion.finalRow);
        const piece = this.getPiece(slot);

        // Se tiver peça de um no lado do outro, promover
        if (piece != null && piece.author == promotion.player)
          this.setPiece(slot, {
            author: promotion.player,
            type: PieceType.KING,
          });
      }
    }
  }

  private getOpponent(): Player {
    return (this.state.currentPlayer + 1) % 2;
  }

  private getPiece(coord: Coord): CheckersPiece | null {
    return this.state.board[coord.x][coord.y];
  }

  private setPiece(coord: Coord, piece: CheckersPiece | null): void {
    this.state.board[coord.x][coord.y] = piece;
  }

  private createPiece(
    author: Player,
    pieceType: PieceType = PieceType.MAN
  ): CheckersPiece {
    return { author: author, type: pieceType };
  }

  private manValidActions(
    fromSlot: Coord,
    captureOnly: boolean = false
  ): CheckersAction[] {
    /* Retorna ações válidas para um peça comum em uma dada posição.
    Opcionalmente retorna apenas as ações de captura. */

    const piece = this.getPiece(fromSlot);

    let actions: CheckersAction[] = [];

    // Para cada direção possíve, e sua posição destino, se válida
    for (let direction of DIRECTIONS) {
      let toSlot = fromSlot.add(direction);
      if (!this.validSlot(toSlot)) continue;

      if (this.validDirection(piece, direction)) {
        // Se puder se mover para tal posição, é uma ação válida
        if (this.emptySlot(toSlot)) {
          if (!captureOnly)
            actions.push({ fromSlot: fromSlot, toSlot: toSlot });
        }

        // Se não estiver vazio, verificar se pode capturar
        else {
          const capturedPiece = this.getPiece(toSlot);
          toSlot = toSlot.add(direction);
          if (!this.validSlot(toSlot)) continue;

          if (
            capturedPiece.author == this.getOpponent() &&
            this.emptySlot(toSlot)
          )
            actions.push({ fromSlot: fromSlot, toSlot: toSlot });
        }
      }
    }

    return actions;
  }

  private kingValidActions(
    fromSlot: Coord,
    captureOnly: boolean = false
  ): CheckersAction[] {
    /* Retorna as ações possíveis da peça dama. */

    let actions: CheckersAction[] = [];

    for (let direction of DIRECTIONS) {
      // Em todas as posições vazias em uma direção
      for (let toSlot of this.iterDirection(fromSlot, direction)) {
        if (this.emptySlot(toSlot)) {
          if (!captureOnly)
            actions.push({ fromSlot: fromSlot, toSlot: toSlot });
        }

        // Se não estiver vazia, verificar se pode capturar
        else {
          const capturedPiece = this.getPiece(toSlot);
          toSlot = toSlot.add(direction);

          if (
            this.validSlot(toSlot) &&
            capturedPiece.author == this.getOpponent() &&
            this.emptySlot(toSlot)
          )
            actions.push({ fromSlot: fromSlot, toSlot: toSlot });

          // Parar de procurar, pois não é permitido saltar mais de uma peça
          break;
        }
      }
    }

    return actions;
  }

  // ================
  // Itarators
  // ================

  private *iterValidSlots(): Generator<Coord> {
    /* Itera pelos slots válidos do tabuleiro. */
    for (let row of this.iterRows()) {
      for (let column of this.iterColumns()) {
        const slot = new Coord(column, row);
        if (this.darkSquare(slot)) yield slot;
      }
    }
  }

  private *iterRows(reverse: boolean = false): Generator<number> {
    /* Itera pelas linhas do tabuleiro, em ordem direta ou inversa. */

    if (reverse)
      for (let row = this.boardShape.y - 1; row >= 0; row--) yield row;
    else for (let row = 0; row < this.boardShape.y; row++) yield row;
  }

  private *iterColumns(): Generator<number> {
    /* Itera pelas colunas do tabuleiro. */

    for (let column = 0; column < this.boardShape.x; column++) yield column;
  }

  private *iterDirection(fromSlot: Coord, direction: Coord): Generator<Coord> {
    /* A patir de uma posição inicial, itera pelas posições válidas em uma
    direção. */

    for (
      let slot = fromSlot.add(direction);
      this.validSlot(slot);
      slot = slot.add(direction)
    )
      yield slot;
  }

  // ==============
  // Getters
  // ==============

  public getState(): CheckersState {
    return this.state;
  }

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
