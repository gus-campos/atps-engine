
import { Kokeshi, Opcoes, Movimento } from "./Types";
import { Acao, MoverKokeshi, ComprarPeca, AcaoMultipla } from "./Acao";

export class Peca {

  /* Peças do tabuleiro que possuem cor, efeitos, posicao, e um tipo */

  private cor: Kokeshi;
  private acao: Acao;
  private posicao: Kokeshi|null;

  constructor(cor: Kokeshi, acao: Acao) {
  
    this.cor = cor;
    this.acao = acao;
    this.posicao = null;
  }

  public associarPosicao(posicao: Kokeshi): void {

    /* Associa uma posição à peça. Além de guardar a informação
    de onde a peça está posicionada, também pode guardar a
    informação de onde uma peça SERÁ posicionada. */

    if (posicao == null)
      throw new Error("Não pode associar posição nula.");

    this.posicao = posicao;
  }

  public getAcao(): Acao {
    
    return this.acao;
  }

  public posicaoAssociada(): boolean {

    return this.posicao != null;
  }

  public getPosicao(): Kokeshi {

    return this.posicao;
  }

  public clone() {

    /* Cria uma cópia por valor */

    // FIXME: Ação é copiada por referência!
    // Não tem problema se nunca for modificada diretamente...

    const peca = new Peca(this.cor, this.acao);

    if (this.posicao != null)
      peca.associarPosicao(this.posicao);

    return peca;
  }

  public toString() {

    /* Retorna a string que representa o objeto. */

    return this.acao.toString();
  }
}

export class PecaNula extends Peca {

  constructor(posicionamento: Kokeshi) {

    const acaoRetorno = new MoverKokeshi(Opcoes.UNICA, posicionamento, Movimento.RETORNO);
    const acaoCompra = new ComprarPeca(Opcoes.UNICA, posicionamento);
    const acaoDupla = new AcaoMultipla(acaoRetorno, acaoCompra, true);
    
    const cor = posicionamento;

    super(cor, acaoDupla);
  }
}
