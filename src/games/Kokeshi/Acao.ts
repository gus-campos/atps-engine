import { Movimento, Opcoes, EscolhaAcao, Kokeshi, Animal } from "./Types";

export abstract class Acao {
  /* Classe que representa uma ação a ser jogada, modificando
  o estado do jogo. Algumas ações permitem múltiplas escolhas,
  necessitando ser ESPECIFICADAS antes de serem executadas.
  Outras ações são ações de especificação.
  
  Outras ações servem para especificar ações.

  Exemplo: se uma ação MoverKokeshi permite a escolha de
  qual kokeshi mover, ela ficara numa fila de ações pendentes,
  sendo necessário que uma ação EspecificarKokeshi seja jogada,
  tornando a primeira ação MoverKokeshi uma ação especificada,
  que será executada automaticamente logo em seguida. */

  public abstract especificada(): boolean;
  public abstract toString(): String;
}

// ============================================================================
// ============================================================================

export class AcaoMultipla extends Acao {
  /* Acão múltipla, que encapsula duas outras ações. Se não
  for dupla, é necessário especificar qual das duas ações
  será escolhida. */

  private acao1: Acao;
  private acao2: Acao;
  // Se as duas ações são executadas sem necessitar escolha
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

    return [this.acao1, this.acao2];
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

export class EspecificarAcaoMultipla extends Acao {
  /* Ação de especificar a escolha entre as duas ações disponíveis
  em uma AcaoMultipla. */

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

// ============================================================================

export class ComprarPeca extends Acao {
  /* Ação de comprar peça. Causa uma peça a ser comprada
  da oferta de peças e reservada na reserva do jogador. Quando
  as ações do jogador acabam, as peças podem ser posicionadas. */

  private opcoes: Opcoes;
  private posicao: Kokeshi | null;

  constructor(opcoes: Opcoes, posicao: Kokeshi | null = null) {
    super();

    ComprarPeca.validar(opcoes, posicao);

    this.opcoes = opcoes;
    this.posicao = posicao;
  }

  private static validar(opcoes: Opcoes, posicao: Kokeshi) {
    /* Retorna se é uma ação válida de compra de peça. */

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

  public getPosicao(): Kokeshi | null {
    return this.posicao;
  }

  public toString(): String {
    return "CP";
  }
}

// ============================================================================

export class MoverKokeshi extends Acao {
  /* Ação de mover um koekshi no tabuleiro de habilidades. */

  private opcoes: Opcoes;
  private kokeshi: Kokeshi | null;
  private movimento: Movimento;

  constructor(
    opcoes: Opcoes,
    kokeshi: Kokeshi | null = null,
    movimento: Movimento = Movimento.SIMPLES
  ) {
    super();

    MoverKokeshi.validar(opcoes, kokeshi);

    this.opcoes = opcoes;
    this.kokeshi = kokeshi;
    this.movimento = movimento;
  }

  private static validar(opcoes: Opcoes, kokeshi: Kokeshi) {
    /* Verifica se ação é válida (só pode ter kokeshi especificada
    se a opção for única).  */

    if ((opcoes == Opcoes.UNICA) !== (kokeshi != null))
      throw new Error(
        "Opção ÚNICA e Kokeshi só podem e devem acontecer juntas."
      );
  }

  public especificar(kokeshiEscolhida: Kokeshi): MoverKokeshi {
    /* Quando esta ação ainda não está especificada (ou seja, 
    quando é necessário escolher qual kokeshi será movida), 
    este método, ao receber a escolha de uma kokeshi como parâmetro, 
    retorna uma nova ação MoverKokeshi já especificada de acordo 
    com a escolha informada. */

    if (this.especificada())
      throw new Error("Não pode especificar acao já decidio.");

    return new MoverKokeshi(Opcoes.UNICA, kokeshiEscolhida, this.movimento);
  }

  public especificada(): boolean {
    return this.opcoes == Opcoes.UNICA && this.kokeshi != null;
  }

  public getOpcoes(): Opcoes | null {
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

export class EspecificarKokeshi extends Acao {
  /* Ação de especificar uma ação MoverKokeshi (especificar
  qual kokeshi deve ser movida). */

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

// ============================================================================

export class PosicionarPeca extends Acao {
  /* Ação de especificar a posicao em que uma peça reservada
  deve ser posicionada. Posição setada como null seignifica
  que é uma ação que está na fila, mas que ainda não foi definido
  onde se deseja fazer o posicionamento. */

  private posicao: Kokeshi | null;

  constructor(posicao: Kokeshi | null = null) {
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

export class EspecificarPosicao extends Acao {
  /* Ação de especificar uma ação de PosicionarPeca (especificar 
  em qual posição uma peça deve ser posicionada). */

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

// ============================================================================

export class MoverAnimal extends Acao {
  /* Ação de mover um animal no tabuleiro de animais. */

  private opcoes: Opcoes;
  private animal: Animal;

  constructor(opcoes: Opcoes, animal: Animal | null = null) {
    super();

    MoverAnimal.validar(opcoes, animal);

    this.opcoes = opcoes;
    this.animal = animal;
  }

  private static validar(opcoes: Opcoes, animal: Animal) {
    /* Verifica a ação de mover animal é valida. Ou seja,
    verifica que não há inconsistência entre suas opções e
    definição de animal. */

    if (opcoes != Opcoes.TODAS && opcoes != Opcoes.UNICA)
      throw new Error(
        "Para MoverAnimal são permitidas apenas opções UNICA ou TODAS."
      );

    if ((opcoes == Opcoes.TODAS) !== (animal == null))
      throw new Error(
        "Só é permitido animal indefinido se for usada Opcoes.TODAS."
      );
  }

  public especificar(animalEscolhido: Animal): MoverAnimal {
    /* Para uma ação não especificada de MoverAnimal, ao se
    passa um animal escolhido, retorna uma ação com a escolha
    especificada. */

    if (this.especificada())
      throw new Error("Não pode especificar acao já especificada.");

    return new MoverAnimal(Opcoes.UNICA, animalEscolhido);
  }

  public especificada(): boolean {
    return this.opcoes == Opcoes.UNICA && this.animal != null;
  }

  public getOpcoes(): Opcoes | null {
    return this.opcoes;
  }

  public getAnimal(): Animal {
    return this.animal;
  }

  public toString(): String {
    return "MA";
  }
}

export class EspecificarAnimal extends Acao {
  /* Ação de especificar ação MoverAnimal (especificar 
  qual animal deve ser movido no tabuleiro de animais). */

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
