
type Slot = number;

// TODO: Classe TrilhaHabilidade?

class TabuleiroHabilidade {

  /* Tabuleiro de habilidade.  */

  private static formato = new Coord(5,8);
  private trilhas: Peca[];
  private posicoes: Slot[];
  private jogoKokeshi: JogoKokeshi;

  constructor(jogoKokeshi: JogoKokeshi) {

    this.jogoKokeshi = jogoKokeshi;
  }
}
