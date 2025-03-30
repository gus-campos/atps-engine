
type DuplaEfeitos = [Efeito|null, Efeito|null];

class Peca {

  /* Peças do tabuleiro que possuem cor, efeitos, posicao, e um tipo */

  private cor: Kokeshi;
  private tipo: TipoPeca;
  private efeitos: [Efeito, Efeito];
  private posicao: Kokeshi|null;

  constructor(tipo: TipoPeca, cor: Kokeshi|null=null, efeitos: DuplaEfeitos=[null,null]) {
    
    if (!Peca.pecaValida(tipo, cor, efeitos))
      throw new Error("Tipo inválido para tais efeitos.");
    
    this.cor = cor;
    this.tipo = tipo;
    this.efeitos = efeitos;
  }

  private static pecaValida(tipo: TipoPeca, cor: Kokeshi, efeitos: DuplaEfeitos): boolean {
    
    /* É valido se possui quantidade correta de efeitos de acordo com o tipo */ 

    if (tipo == TipoPeca.NULA)
      return cor == null && efeitos[0] == null && efeitos[1] == null;

    if (tipo == TipoPeca.UNICA) 
      return cor != null && efeitos[0] != null && efeitos[1] == null;

    const tipos2Efeitos = [TipoPeca.DUPLA, TipoPeca.ESCOLHA, TipoPeca.INICIAL];

    if (tipos2Efeitos.includes(tipo)) 
      return cor != null && efeitos[0] != null && efeitos[1] != null;

    return false;
  }
  
  public ativar(jogoKokeshi: JogoKokeshi, escolha: SelecaoEfeito|null=null) {

    /* Ativa o(s) efeito(s) da peça, de acordo com tipo, e a escolha fornecida */

    if ((this.tipo == TipoPeca.ESCOLHA) === (escolha == null))
      throw new Error("Escolha deve ser passada se e somente se for peça de ESCOLHA");

    if (this.tipo == TipoPeca.ESCOLHA) {
  
      this.efeitos[escolha].ativar(jogoKokeshi);

    } else {

      this.efeitos[SelecaoEfeito.ESQUERDA].ativar(jogoKokeshi);
      this.efeitos[SelecaoEfeito.DIREITA].ativar(jogoKokeshi);
    }
  }

  public getPosicao(): Kokeshi {

    return this.posicao;
  }
}
