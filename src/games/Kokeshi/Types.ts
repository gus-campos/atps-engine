export type Jogador = number;

export enum Kokeshi {
  /* Opções de tipos de kokeshis. Usado ao longo do jogo para especificar uma 
  trilha ou a cor de uma peça. Também usado como índices de array quando 
  conveniente, seguindo a correspondência abaixo com números. */

  PRINCESA = 0,
  BATCHAN = 1,
  PESCADOR = 2,
  SAMURAI = 3,
  SUMOTORI = 4,
}

export enum Animal {
  /* Opções de tipos de animais. Usado para especificar uma trilha de animal. 
  Também usado como índices de array quando conveniente, seguindo a 
  correspondência abaixo com números. */

  PANDA = 0,
  RAPOSA = 1,
  GATO = 2,
  COELHO = 3,
}

export enum Opcoes {
  /* Possibilidades de escolhas de posicionamento de peças, ou de movimento de 
  kokeshis. Quando única, significa "sem opção", pois ação já possui 
  opção/escolha definida. */

  TODAS,
  DIREITA,
  ESQUERDA,
  UNICA,
}

export enum Movimento {
  /* Tipos possiveis de movimento de kokeshi. retorno significa voltar kokeshi 
  para primeira posição.*/
  RETORNO = -1,
  SIMPLES = 1,
  DUPLO = 2,
}

export enum EscolhaAcao {
  /* Possibilidades de escolha de ação de AcaoMultipla, significando 
  literalmente se está sendo escolhida a primeira ou a segunda ação disponível 
  na AcaoMultipla. */
  PRIMEIRO,
  SEGUNDO,
}
