
type Index = number;

// TODO: Peças reservadas? Mais de uma? Na trilha ou no tabuleiro?

// TODO: Retornar um efeito

// TODO: Quando pular uma casa vazia, deve ser tratado diferente?


class TrilhaHabilidade {

  private static tamanho = 8;
  private cor: Kokeshi;
  private trilha: (Peca|null)[];
  private posicao: Index;

  constructor(cor: Kokeshi) {

    this.cor = cor;
    this.trilha = Array(TrilhaHabilidade.tamanho).fill(null);
    this.posicao = 0;
  }

  public avancar(): Peca|null {

    this.posicao++;
    
    // Se atingiu o limite do tabuleiro
    if (this.posicao >= TrilhaHabilidade.tamanho) {

      this.retornar();
      
      // reconhecer
      // NÃO COMPRAR

      return null;
    }

    const pecaAlcancada = this.trilha[this.posicao];

    // Se atingiu um espaço vazio
    if (pecaAlcancada == null) {

      this.retornar();
      
      // COMPRAR
      
      return null;
    }
  }

  public retornar(): void {

    this.posicao = 0;
  }

  public posicionar(peca: Peca): void {

    const posicao = this.primeiraPosicaoVazia();
    
    this.trilha[posicao] = peca;
  }

  private primeiraPosicaoVazia() : Index|null {

    for (let i = 0; i < TrilhaHabilidade.tamanho; i++)
      if (this.trilha[i] == null)
        return i;

    return null;
  }
}

class TabuleiroHabilidades {
  
  /* Tabuleiro de habilidade.  */
  
  private static tamanho = KOKESHIS.length;
  private trilhas: TrilhaHabilidade[]

  constructor() {

    this.trilhas = TabuleiroHabilidades.criarTrilhas();
  }
  
  private static criarTrilhas(): TrilhaHabilidade[] {
    
    const trilhas = Array(TabuleiroHabilidades.tamanho); 
    
    for (let kokeshi of KOKESHIS)
      trilhas[kokeshi] = new TrilhaHabilidade(kokeshi);

    return trilhas;
  } 

  public avancar(kokeshi: Kokeshi): Peca|null {
    
    return this.trilhas[kokeshi].avancar();
  }
}
