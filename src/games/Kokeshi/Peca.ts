import { Kokeshi, Opcoes, Movimento } from "./Types";
import { Acao, MoverKokeshi, ComprarPeca, AcaoMultipla } from "./Acao";

export class Peca {
  /* Representa uma peça do tabuleiro que possuem cor, ação, posicao, e tipo */

  private cor: Kokeshi;
  private acao: Acao;
  private posicao: Kokeshi | null;

  constructor(cor: Kokeshi, acao: Acao) {
    this.cor = cor;
    this.acao = acao;
    this.posicao = null;
  }

  public associarPosicao(posicao: Kokeshi): void {
    /* Associa uma posição à peça. Além de guardar a informação de onde a peça 
    está posicionada, também pode guardar a informação de onde uma peça SERÁ 
    posicionada. */

    if (posicao == null) throw new Error("Não pode associar posição nula.");

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
    /* Cria uma cópia da peça por valor e não referência. */

    // FIXME: Ação é copiada por referência!
    // Mas não tem problema se nunca for modificada diretamente...

    const peca = new Peca(this.cor, this.acao);

    if (this.posicao != null) peca.associarPosicao(this.posicao);

    return peca;
  }

  public toString() {
    /* Retorna a string que representa a peça. */

    return this.acao.toString();
  }
}

export class PecaNula extends Peca {
  constructor(posicionamento: Kokeshi) {
    /* Peças nulas preenchem o tabuleiro todo desde o início, até serem 
    substituídas por outra peça durante um posicionamento. No jogo real 
    corresponde a um espaço vazio. Esta sempre possui uma ação múltipla, uma de 
    mover a kokeshi da trilha atual de volta para o início da trilha, e outra de
    comprar uma  peça. Isso serve pra replicar as ações causadas por cair numa 
    posição vazia. */

    const acaoRetorno = new MoverKokeshi(
      Opcoes.UNICA,
      posicionamento,
      Movimento.RETORNO
    );

    const acaoCompra = new ComprarPeca(Opcoes.UNICA, posicionamento);
    const acaoDupla = new AcaoMultipla(acaoRetorno, acaoCompra, true);

    const cor = posicionamento;

    super(cor, acaoDupla);
  }
}
