
type Jogador = number;

const NUMERO_JOGADORES = 2;
const NUMERO_ANIMAIS = 4;

class JogoKokeshi {

  private tabuleirosHabilidades: TabuleiroHabilidade[];
  private tabuleiroAnimais: TabuleiroAnimais;
  private pontuacao: number[];
  private estoque: Peca[];

  constructor() {

    this.tabuleiroAnimais = new TabuleiroAnimais(this);
    this.tabuleirosHabilidades = Array.from(Array(NUMERO_JOGADORES), () => new TabuleiroHabilidade(this));
    this.pontuacao = Array(NUMERO_JOGADORES).fill(0)

  }
}
