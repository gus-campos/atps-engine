
// =========================================================

export type Player = number;

/* Especificado para cada jogo, 
dentro de seus respectivos códigos fonte */
export type Action = {};

export enum Outcome {
  WIN,
  LOSE,
  DRAW
}

// =========================================================

export interface Game {

  // Retorna uma cópia por valor do jogo
  clone(): Game;

  // Retorna o último jogador a jogar
  getLastPlayer(): Player;

  // Retorna o jogador do turno atual
  getCurrentPlayer(): Player;
  
  // Retorna as ações pssíveis válidas no estado atual
  getValidActions(): Action[];

  // Executa uma ação passada, modificando o estado
  // autoPlayMode supõe que a ação é válida
  playAction(action: Action, autoPlayMode: boolean): void;
  
  // Retorna se o jogo já terminou
  isGameOver(): boolean;

  // Retorna o jogador vencedor
  getWinner(): number;

  // Retorna uma representação do estado como uma sting
  stateToString(): string;

  // Imprime no console string que representa o estado
  printState(): void;
  
  // Modifica o estado para registrar um empate
  forceDraw(): void;
}
