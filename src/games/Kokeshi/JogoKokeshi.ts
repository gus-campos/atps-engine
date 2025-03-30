
type Jogador = number;

const NUMERO_JOGADORES = 2;

// TODO: Inicialização

class JogoKokeshi {

  private static readonly pecasIniciais: Peca[] = PECAS_INICIAIS;
  private static readonly ofertaPecas: Peca[];

  private tabuleirosHabilidades: TabuleiroHabilidades[];
  private tabuleiroAnimais: TabuleiroAnimais;
  private pontuacao: number[];
  private estoque: Peca[];

  constructor() { 

    this.tabuleiroAnimais = new TabuleiroAnimais();
    this.tabuleirosHabilidades = Array.from(Array(NUMERO_JOGADORES), () => new TabuleiroHabilidades());
    this.pontuacao = Array(NUMERO_JOGADORES).fill(0)
  }
}
