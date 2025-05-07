


import { Kokeshi, Movimento } from "./Types";
import { KOKESHIS } from "./Globals";
import { Peca, PecaNula } from "./Peca";

type Index = number;

// TODO: Como diferenciar para o jogo quando a peça atinge o limite? Usar uma flag que é lida externamente?
// TODO: Escolher posicionar, ou não, a peça de reconhecimento
// TODO: Atingir o limite do tabuleiro só causa reconhecimento se movimento simples

export class TabuleiroHabilidades {
  
  /* Tabuleiro de habilidade com várias trilhas.  */
  
  public static readonly tamanho: number = KOKESHIS.length;
  private trilhas: TrilhaHabilidade[];

  constructor() {

    this.trilhas = Array(TabuleiroHabilidades.tamanho); 
    
    for (let kokeshi of KOKESHIS)
      this.trilhas[kokeshi] = new TrilhaHabilidade(kokeshi);
  }

  public adicionar(peca: Peca, posicionamento: Kokeshi): void {

    /* Acrescenta uma peça em determinada trilha. */

    this.trilhas[posicionamento].adicionar(peca);
  }
  
  public moverKokeshi(kokeshi: Kokeshi, movimento: Movimento): Peca|null {

    /* Move a kokeshi correspondente de acordo com 
    movimento passado. */
    
    return this.trilhas[kokeshi].moverKokeshi(movimento);
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

  /* Trilha do tabuleiro de habilidade. */

  private static tamanho = 9;
  private cor: Kokeshi;
  private trilha: Peca[];
  private posicao: Index;

  constructor(cor: Kokeshi) {

    this.cor = cor;

    const criarPecaNula = () => new PecaNula(this.cor);

    this.trilha = Array.from(Array(TrilhaHabilidade.tamanho), criarPecaNula);
    this.posicao = 0;
  }

  public moverKokeshi(movimento: Movimento): Peca|null {

    /* Move a kokeshi de acordo com o movimento passado. */

    if (movimento == Movimento.RETORNO) {

      this.retornarKokeshi();
      return null;
    }

    return this.avancar(movimento);
  }

  public avancar(movimento: Movimento): Peca|null {

    /* Avança a posição da kokeshi. */

    if (movimento == Movimento.RETORNO)
      throw new Error("avancar não aceita movimento de retorno.");

    this.posicao += movimento;
    
    // Passou limite do tabuleiro
    if (this.posicao >= TrilhaHabilidade.tamanho) {

      // reconhecer
      // FIXME: NÃO COMPRAR
      // FIXME: Não premia se pular espaço vazio

      this.retornarKokeshi();
      return null;
    }
    
    const pecaAlcancada = this.trilha[this.posicao];

    return pecaAlcancada;
  }

  public retornarKokeshi(): void {

    /* Devolve a kokeshi pra posição inicial. */

    this.posicao = 0;
  }

  public adicionar(peca: Peca): void {

    /* Adiciona uma peça na primeira posição livre da trilha. */

    const posicao = this.primeiraPosicaoDisponivel();

    if (posicao == null)
      throw new Error("Nenhuma posição disponível.");

    this.trilha[posicao] = peca;
  }

  private primeiraPosicaoDisponivel() : Index|null {

    /* Retorna primeira posição com peça nula ("vazia"), sem contar
    a primeira posição. */

    for (let i = 1; i < TrilhaHabilidade.tamanho; i++)
      if (this.trilha[i] instanceof PecaNula)
        return i;

    return null;
  }

  public toString(): String {

    /* Retorna string que representa o objeto. */

    let string = "";

    for (let i=0; i<this.trilha.length; i++ ) {

      const peca = this.trilha[i];

      let pecaString = peca.toString();

      const padding = i == this.posicao ? "*" : " ";
      pecaString = padding + pecaString + padding;

      string += pecaString + "|";
    }

    return string;
  }
}
