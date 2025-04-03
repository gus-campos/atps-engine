
type DuplaEfeitos = [Efeito|null, Efeito|null];

enum TipoPeca {
  UNICA,    // só um efeito possível
  DUPLA,    // dois efeitos simultâneos 
  ESCOLHA,  // dois efeitos possíveis a se escolher
  NULA      // casa vazia
}

enum EscolhaEfeito {
  PRIMEIRO,
  SEGUNDO,
  AMBOS
}

class Peca {

  /* Peças do tabuleiro que possuem cor, efeitos, posicao, e um tipo */

  private cor: Kokeshi;
  private tipo: TipoPeca;
  private efeitos: [Efeito, Efeito];
  private posicao: Kokeshi|null;

  constructor(tipo: TipoPeca, cor: Kokeshi, efeitos: DuplaEfeitos=[null,null]) {
    
    if (!Peca.pecaValida(tipo, efeitos))
      throw new Error("Tipo inválido para tais efeitos.");
    
    this.cor = cor;
    this.tipo = tipo;
    this.efeitos = efeitos;
  }
  
  public static criarPecaNula(posicionamento: Kokeshi): Peca {

    /* Cria uma peça nula para dado posicionamento no tabuleiro. */

    const efeitoRetorno = new EfeitoMoverKokeshi(Opcoes.UNICA, posicionamento, Movimento.RETORNO);
    const efeitoCompra = new EfeitoAdicionarPeca(Opcoes.UNICA, posicionamento);
    const efeitos: DuplaEfeitos = [efeitoRetorno, efeitoCompra];

    return new Peca(TipoPeca.NULA, null, efeitos);
  }

  private static pecaValida(tipo: TipoPeca, efeitos: DuplaEfeitos): boolean {
    
    /* É valido se possui quantidade correta de efeitos de acordo com o tipo,
    se for dupla, não pode ter efeito de mover kokeshi na segunda posição */ 

    const possuiPrimeiro = efeitos[0] != null;
    const possuiSegundo = efeitos[1] != null;
    
    const tiposComDoisEfeitos = [TipoPeca.DUPLA, TipoPeca.ESCOLHA, TipoPeca.NULA];
    
    if (tipo == TipoPeca.UNICA) 
      return possuiPrimeiro && !possuiSegundo;
    
    if (tiposComDoisEfeitos.includes(tipo)) {

      if (tipo == TipoPeca.DUPLA && (efeitos[1] instanceof EfeitoMoverKokeshi))
        return false;

      return possuiPrimeiro && possuiSegundo;
    }

    return false;
  }

  public associarPosicao(posicao: Kokeshi): void {
    this.posicao = posicao;
  }

  public getEfeito(escolha: EscolhaEfeito): Efeito {
    
    if (escolha == EscolhaEfeito.AMBOS)
      throw new Error("Para AMBOS, usar 'getEfeitos'");

    if (escolha == EscolhaEfeito.PRIMEIRO)
      return this.efeitos[0];

    if (escolha == EscolhaEfeito.SEGUNDO)
      return this.efeitos[1]; 
  }

  public posicaoAssociada(): boolean {

    return this.posicao != null;
  }

  public definida() {
    return this.tipo != TipoPeca.ESCOLHA;
  }

  public getTipo(): TipoPeca {
    return this.tipo;
  }

  public getEfeitos(): DuplaEfeitos {
    return this.efeitos;
  }

  public getPosicao(): Kokeshi {

    return this.posicao;
  }
}
