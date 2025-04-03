
enum Opcoes {
  TODAS,
  DIREITA,
  ESQUERDA,
  UNICA
}

enum Movimento {
  RETORNO = -1,
  SIMPLES = 1,
  DUPLO = 2
}

abstract class Efeito {

  /* As classes que obedecem essa interface, carregam
  informações sobre um efeito, que deve ser interpretado
  e executado pelo jogo. */

  public abstract especificado(): boolean;

  public static ehDuplaEfeitosValida(efeitos: any): boolean {
    
    return (
      efeitos instanceof Array 
      && efeitos.length == 2 
      && efeitos[0] instanceof Efeito 
      && efeitos[1] instanceof Efeito
    );
  }
}

// ============================================================================

class EfeitoAdicionarPeca extends Efeito {

  // TODO: Deve ser reservado

  private opcoes: Opcoes;
  private posicionamento: Kokeshi|null;

  constructor(opcoes: Opcoes, posicionamento: Kokeshi|null = null) {

    super();

    if (opcoes != Opcoes.TODAS && opcoes != Opcoes.UNICA)
      throw new Error("ComprarPeca só é permitido com opções TODAS ou UNICA.");

    this.opcoes = opcoes;
    this.posicionamento = posicionamento;
  }

  public especificado(): boolean {
    return this.posicionamento != null;
  }

  public getPosicionamento(): Kokeshi {
    return this.posicionamento;
  }

  public getOpcoes(): Opcoes|null {
    return this.opcoes;
  }
}

// ============================================================================

class EfeitoMoverKokeshi extends Efeito {

  private opcoes: Opcoes;
  private kokeshi: Kokeshi|null;
  private movimento: Movimento;

  constructor(opcoes: Opcoes, kokeshi: Kokeshi|null = null, movimento: Movimento = Movimento.SIMPLES) {
    
    super();

    if (opcoes != Opcoes.UNICA && kokeshi == null)
      throw new Error("Apenas peças com opções UNICA podem ter kokeshi nula.");

    this.opcoes = opcoes;
    this.kokeshi = kokeshi;
    this.movimento = movimento;
  }

  public especificar(kokeshi: Kokeshi): EfeitoMoverKokeshi {

    if (this.especificado())
      throw new Error("Não pode especificar efeito já decidio.");

    return new EfeitoMoverKokeshi(Opcoes.UNICA, kokeshi, this.movimento);
  }

  public especificado(): boolean {
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
}

// ============================================================================

class EfeitoMoverAnimal extends Efeito {
  
  private opcoes: Opcoes;
  private animal: Animal;

  constructor(opcoes: Opcoes, animal: Animal|null = null) {

    super();

    if (opcoes != Opcoes.TODAS && opcoes != Opcoes.UNICA)
      throw new Error("Para avançar animal são permitidas apenas opções UNICA ou TODAS.");

    if ((opcoes == Opcoes.TODAS) !== (animal == null))
      throw new Error("Só é permitido animal null com opções TODAS.");

    this.opcoes = opcoes;
    this.animal = animal;
  }

  public especificar(animal: Animal): EfeitoMoverAnimal {

    if (this.especificado())
      throw new Error("Não pode especificar efeito já decidio.");

    return new EfeitoMoverAnimal(Opcoes.UNICA, animal);
  }

  public especificado(): boolean {
      return this.opcoes == Opcoes.UNICA && this.animal != null;
  }

  public getOpcoes(): Opcoes|null {
    return this.opcoes;
  }

  public getAnimal(): Animal {
    return this.animal;
  }
}
