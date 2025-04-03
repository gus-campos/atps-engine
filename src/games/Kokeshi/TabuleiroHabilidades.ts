
type Index = number;

// TODO: Como diferenciar para o jogo quando a peça atinge o limite? Usar uma flag que é lida externamente?

class TrilhaHabilidade {

  private static tamanho = 8;
  private cor: Kokeshi;
  private trilha: Peca[];
  private posicao: Index;

  constructor(cor: Kokeshi) {

    this.cor = cor;

    const criarPecaNula = () => Peca.criarPecaNula(this.cor);

    this.trilha = Array.from(Array(TrilhaHabilidade.tamanho), criarPecaNula);
    this.posicao = 0;
  }

  public moverKokeshi(movimento: Movimento): Peca|null {

    if (movimento == Movimento.RETORNO)
      return this.retornar();

    return this.avancar(movimento);
  }

  public avancar(movimento: Movimento): Peca|null {

    if (movimento == Movimento.RETORNO)
      throw new Error("avancar não aceita movimento de retorno.");

    this.posicao += movimento;
    
    // Se atingiu o limite do tabuleiro
    if (this.posicao >= TrilhaHabilidade.tamanho) {

      // reconhecer
      // NÃO COMPRAR

      return this.retornar();
    }
    public retornar(): null {

      this.posicao = 0;
      return null;
    }
  
    const pecaAlcancada = this.trilha[this.posicao];

    return pecaAlcancada;
  }

  public retornar(): null {

    this.posicao = 0;
    return null;
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

  public posicionar(peca: Peca, posicionamento: Kokeshi): void {

    this.trilhas[posicionamento].posicionar(peca);
  }
  
  private static criarTrilhas(): TrilhaHabilidade[] {
    
    const trilhas = Array(TabuleiroHabilidades.tamanho); 
    
    for (let kokeshi of KOKESHIS)
      trilhas[kokeshi] = new TrilhaHabilidade(kokeshi);

    return trilhas;
  } 

  public moverKokeshi(kokeshi: Kokeshi, movimento: Movimento): Peca|null {
    
    return this.trilhas[kokeshi].moverKokeshi(movimento);
  }
}
