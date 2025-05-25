import { Kokeshi, Movimento } from "./Types";
import { KOKESHIS } from "./Globals";
import { Peca, PecaNula } from "./Peca";

type Index = number;

// TODO: Como diferenciar para o jogo quando a peça atinge o limite? Usar uma
// flag que é lida externamente?
// TODO: Escolher posicionar, ou não, a peça de reconhecimento
// TODO: Atingir o limite do tabuleiro só causa reconhecimento se movimento
// simples

export class TabuleiroHabilidades {
  /* Tabuleiro de habilidade com várias trilhas.  */

  public static readonly tamanho: number = KOKESHIS.length;
  // Array de trilhas indexadas a partir do enum Kokeshi, e suas
  // correspondências com números (ver enum Kokeshi em ./Types.ts)
  private trilhas: TrilhaHabilidade[];

  constructor() {
    this.trilhas = Array(TabuleiroHabilidades.tamanho);

    for (let Kokeshi of KOKESHIS)
      this.trilhas[Kokeshi] = new TrilhaHabilidade(Kokeshi);
  }

  public adicionar(peca: Peca, posicionamento: Kokeshi): void {
    /* Acrescenta uma peça em determinada trilha. */

    this.trilhas[posicionamento].adicionar(peca);
  }

  public moverKokeshi(Kokeshi: Kokeshi, movimento: Movimento): Peca | null {
    /* Move a Kokeshi correspondente de acordo com movimento passado. */

    return this.trilhas[Kokeshi].moverKokeshi(movimento);
  }

  public toString(): String {
    /* Retorna string que representa o objeto. */

    let string = "";

    for (let trilha of this.trilhas) {
      string += trilha.toString() + "\n";
    }

    return string;
  }
}

class TrilhaHabilidade {
  /* Trilha do tabuleiro de habilidade, que consiste em uma sequência (array)
  de peças, e a marcação de em que posição dessa sequência se encontra a kokeshi
  do jogador desta trilha. A posição "-1" significa que a kokeshi está na 
  posição inicial, não estando sobre nenhuma peça ainda.  */

  private static tamanho = 8;
  private cor: Kokeshi;
  private trilha: Peca[];
  private posicao: Index;

  constructor(cor: Kokeshi) {
    this.cor = cor;

    // Função axiliar para criar peça nula
    const criarPecaNula = () => new PecaNula(this.cor);

    // Inicializando a trilha como uma sequência de peças nulas (no jogo real
    // essas posições estariam vazias).
    this.trilha = Array.from(Array(TrilhaHabilidade.tamanho), criarPecaNula);
    this.posicao = -1;
  }

  public moverKokeshi(movimento: Movimento): Peca | null {
    /* Move a Kokeshi de acordo com o tipo movimento especificado. */

    if (movimento == Movimento.RETORNO) {
      this.retornarKokeshi();
      return null;
    }

    return this.avancar(movimento);
  }

  public avancar(movimento: Movimento): Peca | null {
    /* Avança a posição da Kokeshi na trilha, de acordo com o movimento 
    especificado. */

    if (movimento == Movimento.RETORNO)
      throw new Error("avancar não aceita movimento de retorno.");

    this.posicao += movimento;

    // Verifica que passou do limite do tabuleiro
    if (this.posicao >= TrilhaHabilidade.tamanho) {
      // reconhecer
      // FIXME: NÃO COMPRAR
      // FIXME: Não premia se pular espaço vazio

      this.retornarKokeshi();
      // Não alcança nem retorna peça
      return null;
    }

    // Peça sobre a qual a kokeshi parou
    const pecaAlcancada = this.trilha[this.posicao];

    return pecaAlcancada;
  }

  public retornarKokeshi(): void {
    /* Devolve a Kokeshi pra posição inicial. */

    this.posicao = -1;
  }

  public adicionar(peca: Peca): void {
    /* Adiciona uma peça na primeira posição que estiver preechida por peça
    nula. */

    const posicao = this.primeiraPosicaoDisponivel();

    if (posicao == null) throw new Error("Nenhuma posição disponível.");

    this.trilha[posicao] = peca;
  }

  private primeiraPosicaoDisponivel(): Index | null {
    /* Retorna primeira posição que possui uma peça nula (a primeir aposição 
    "vazia", ou disponível para posicionamento de peça), mas sem contar a 
    primeira posição, já que ela é reservada como posição incial das 
    kokeshis. */

    for (let i = 0; i < TrilhaHabilidade.tamanho; i++)
      if (this.trilha[i] instanceof PecaNula) return i;

    return null;
  }

  public toString(): String {
    /* Retorna string que representa a trilha de habilidade. */

    let string = "";

    for (let i = 0; i < this.trilha.length; i++) {
      const peca = this.trilha[i];

      let pecaString = peca.toString();

      const padding = i == this.posicao ? "*" : " ";
      pecaString = padding + pecaString + padding;

      string += pecaString + "|";
    }

    return string;
  }
}
