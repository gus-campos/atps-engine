
import { Movimento, Opcoes, EscolhaAcao, Kokeshi, Animal } from "./Types";

export abstract class Acao {

  /* As classes que obedecem essa interface, carregam
  informações sobre um acao, que deve ser interpretado
  e executado pelo jogo. */

  public abstract especificada(): boolean;
  public abstract toString(): String;
}

export class AcaoMultipla extends Acao {

  /* Acão múltipla que pode necessitar de escolha. */

  private acao1: Acao;
  private acao2: Acao;
  private dupla: boolean;

  constructor(acao1: Acao, acao2: Acao, dupla: boolean = false) {

    super();

    this.acao1 = acao1;
    this.acao2 = acao2;
    this.dupla = dupla;
  }

  public escolherAcao(escolha: EscolhaAcao): Acao {

    if (this.dupla)
      throw new Error("Ação múltipla do tipo dupla não pode ser escolhida.");

    switch (escolha) {

      case EscolhaAcao.PRIMEIRO:
        return this.acao1;

      case EscolhaAcao.SEGUNDO:
        return this.acao2;
    }
  }

  public getAcoes(): Acao[] {

    if (!this.dupla)
      throw new Error("Apenas ações duplas podem ter ambas ações obtidas.");

    return [ this.acao1, this.acao2 ];
  }

  public especificada(): boolean {
    return this.dupla;
  }

  public toString(): String {

    const conector = this.dupla ? "/" : "-";

    if (this.acao1 instanceof MoverKokeshi && this.acao2 instanceof ComprarPeca)
      return "     ";

    return this.acao1.toString() + conector + this.acao2.toString();
  }
}

// ============================================================================

export class EspecificarAcaoMultipla extends Acao {

  /* Ação de especificar a escolha feita sobre as
  ações múltiplas. */

  private escolha: EscolhaAcao;

  constructor(escolha: EscolhaAcao) {

    super();

    this.escolha = escolha;
  }

  public especificada(): boolean {
    return true;
  } 

  public getEscolha(): EscolhaAcao {
    return this.escolha;
  }

  public toString(): String {
    return "EAM";
  }
}

export class EspecificarKokeshi extends Acao {

  /* Ação de especificar uma kokeshi a ser movida. */

  private kokeshi: Kokeshi;

  constructor(kokeshi: Kokeshi) {

    super();

    this.kokeshi = kokeshi;
  }

  public especificada(): boolean {
    return true;
  } 

  public getKokeshi(): Kokeshi {
    return this.kokeshi;
  }

  public toString(): String {
    return "EK";
  }
}

export class EspecificarPosicao extends Acao {

  /* Ação de especificar uma kokeshi a ser movida. */

  private posicao: Kokeshi;

  constructor(posicao: Kokeshi) {

    super();
    this.posicao = posicao;
  }

  public especificada(): boolean {
    return true;
  } 

  public getPosicao(): Kokeshi {
    return this.posicao;
  }

  public toString(): String {
    return "EP";
  }
}

export class EspecificarAnimal extends Acao {

  /* Ação de especificar um animal a ser movido. */

  private animal: Animal;

  constructor(animal: Animal) {

    super();

    this.animal = animal;
  }

  public especificada(): boolean {
    return true;
  } 

  public getAnimal(): Animal {
    return this.animal;
  }

  public toString(): String {
    return "EA";
  }
}

// ============================================================================

export class MoverKokeshi extends Acao {

  /* Ação de mover koekshi. */

  private opcoes: Opcoes;
  private kokeshi: Kokeshi|null;
  private movimento: Movimento;

  constructor(opcoes: Opcoes, kokeshi: Kokeshi|null = null, movimento: Movimento = Movimento.SIMPLES) {
    
    super();

    MoverKokeshi.validar(opcoes, kokeshi);

    this.opcoes = opcoes;
    this.kokeshi = kokeshi;
    this.movimento = movimento;
  }

  private static validar(opcoes: Opcoes, kokeshi: Kokeshi) {

    if ((opcoes == Opcoes.UNICA) !== (kokeshi != null))
      throw new Error("Opção ÚNICA e kokeshi só podem e devem acontecer juntas.");
  }

  public especificar(kokeshi: Kokeshi): MoverKokeshi {

    if (this.especificada())
      throw new Error("Não pode especificar acao já decidio.");

    return new MoverKokeshi(Opcoes.UNICA, kokeshi, this.movimento);
  }

  public especificada(): boolean {
    return this.opcoes == Opcoes.UNICA && this.kokeshi != null;
  }

  public getOpcoes(): Opcoes|null {
    return this.opcoes;
  }

  public getKokeshi(): Kokeshi {
    return this.kokeshi;
  }

  public getMovimento(): Movimento {
    return this.movimento;
  }

  public toString() {

    return "MK";
  }
}

export class MoverAnimal extends Acao {

  /* Ação de mover animal. */
  
  private opcoes: Opcoes;
  private animal: Animal;

  constructor(opcoes: Opcoes, animal: Animal|null = null) {

    super();

    MoverAnimal.validar(opcoes, animal);

    this.opcoes = opcoes;
    this.animal = animal;
  }

  private static validar(opcoes: Opcoes, animal: Animal) {

    if (opcoes != Opcoes.TODAS && opcoes != Opcoes.UNICA)
      throw new Error("Para avançar animal são permitidas apenas opções UNICA ou TODAS.");

    if ((opcoes == Opcoes.TODAS) !== (animal == null))
      throw new Error("Só é permitido animal null com opções TODAS.");
  }

  public especificar(animal: Animal): MoverAnimal {

    if (this.especificada())
      throw new Error("Não pode especificar acao já especificada.");

    return new MoverAnimal(Opcoes.UNICA, animal);
  }

  public especificada(): boolean {
      return this.opcoes == Opcoes.UNICA && this.animal != null;
  }

  public getOpcoes(): Opcoes|null {
    return this.opcoes;
  }

  public getAnimal(): Animal {
    return this.animal;
  }

  public toString(): String {
    return "MA";
  }
}

export class ComprarPeca extends Acao {

  /* Ação de comprar peça. */

  private opcoes: Opcoes;
  private posicao: Kokeshi|null;

  constructor(opcoes: Opcoes, posicao: Kokeshi|null = null) {

    super();

    ComprarPeca.validar(opcoes, posicao);

    this.opcoes = opcoes;
    this.posicao = posicao;
  }

  private static validar(opcoes: Opcoes, posicao: Kokeshi) {

    if (opcoes != Opcoes.TODAS && opcoes != Opcoes.UNICA)
      throw new Error("ComprarPeca só é permitido com opções TODAS ou UNICA.");

    if ((posicao != null) !== (opcoes == Opcoes.UNICA))
      throw new Error("Quando posicao especificado, opções deve ser UNICA.");
  }

  public especificada(): boolean {
    return true;
  }

  public getOpcoes(): Opcoes {
    return this.opcoes;
  }

  public getPosicao(): Kokeshi|null {
    return this.posicao;
  }

  public toString(): String {
    return "CP";
  }
}

export class PosicionarPeca extends Acao {

  /* Ação de especificar o posicao de uma peça
  comprada. */

  // Possibilidades de posicao: geral ou específico

  private posicao: Kokeshi|null;

  constructor(posicao: Kokeshi|null = null) {

    super();

    this.posicao = posicao;
  }

  public especificada(): boolean {
    return this.posicao != null;
  }
  
  public especificar(posicao: Kokeshi): PosicionarPeca {
    return new PosicionarPeca(posicao);
  }

  public getPosicao(): Kokeshi {
    return this.posicao;
  }

  public toString(): String {
    return "PP";
  }
}
