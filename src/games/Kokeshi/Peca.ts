
type Efeitos = [Efeito|null, Efeito|null];

class Peca {

  /* Peças do tabuleiro que possuem cor, efeitos, posicao, e um tipo */

  private cor: Kokeshi;
  private tipo: TipoPeca;
  private efeitos: [Efeito, Efeito];
  private posicao: Kokeshi|null;

  private jogoKokeshi: JogoKokeshi;

  constructor(jogoKokeshi: JogoKokeshi, tipo: TipoPeca, cor: Kokeshi|null=null, efeitos: Efeitos=[null,null]) {
    
    this.cor = cor;

    if (!Peca.tipoValido(tipo, cor, efeitos))
      throw new Error("Tipo inválido para tais efeitos.");

    this.tipo = tipo;
    this.efeitos = efeitos;
  }

  private static tipoValido(tipo: TipoPeca, cor: Kokeshi, efeitos: Efeitos): boolean {
    
    /* É valido se possui quantidade correta de efeitos de acordo com tipo */ 
    
    if (tipo == TipoPeca.NULA)
      return cor == null && efeitos[0] == null && efeitos[1] == null;

    if ([TipoPeca.UNICA, TipoPeca.NULA].includes(tipo)) 
      return cor != null && efeitos[0] != null && efeitos[1] == null;

    if ([TipoPeca.DUPLA, TipoPeca.ESCOLHA, TipoPeca.INICIAL].includes(tipo)) 
      return cor != null && efeitos[0] != null && efeitos[1] != null;

    return false;
  }
  
  public ativar(escolha: EscolhaEfeito|null=null) {

    /* Ativa o(s) efeito(s) da peça, de acordo com tipo, e a escolha fornecida */

    if (this.tipo == TipoPeca.ESCOLHA) {
  
      if (escolha == null)
        throw new Error("Peça do tipo ESCOLHA, necessita de um escolha não nula.");
    
      this.efeitos[escolha].ativar();
    }

    else {

      if (escolha != null)
          throw new Error("Peça DUPLA ou UNICA não aceita escolha");

      this.efeitos[EscolhaEfeito.ESQUERDA].ativar();
      this.efeitos[EscolhaEfeito.DIREITA].ativar();
    }
  }

  public getPosicao(): Kokeshi {

    return this.posicao;
  }
}
