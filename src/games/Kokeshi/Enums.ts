
enum Selecao {
  QUALQUER,
  DIREITA,
  ESQUERDA
}

enum MovimentoKokeshi {
  RETORNO = -1,
  SIMPLES = 1,
  DUPLO = 2
}

enum Kokeshi {
  PRINCESA = 0,
  BATCHAN = 1,
  PESCADOR = 2,
  SAMURAI = 3,
  SUMOTORI = 4
}

enum Animal {
  PANDA = 0,
  RAPOSA = 1,
  GATO = 2,
  COELHO = 3
}

enum TipoPeca {
  UNICA,    // só um efeito possível
  DUPLA,    // dois efeitos simultâneos 
  ESCOLHA,  // dois efeitos possíveis a se escolher
  INICIAL,  // caso especial de única
  NULA      // casa vazia
}

enum SelecaoEfeito {
  ESQUERDA = 0,
  DIREITA = 1
}
