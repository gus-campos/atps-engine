
abstract class Efeito {

  /* Efeitos que podem ser ativados. */

  private jogoKokeshi: JogoKokeshi;

  constructor(jogoKokeshi: JogoKokeshi) {

    this.jogoKokeshi = jogoKokeshi;
  }

  public abstract ativar(): void;
};

// ====================== KOKESHI ======================

class MoverKokeshi extends Efeito {

  /*
  Efeito de movimentação sobre uma JogoKokeshi. Para que a escolha seja feita, 
  é necessário associar uma peça. Para que o efeito seja realizado, é 
  necessário escolher a kokeshi afetada primeiro, se ela já não tiver sido
  definida no construtor. 
  */

  private tipoSelecao: SelecaoKokeshi|null;
  private avanco: MovimentoKokeshi;
  private kokeshiMovida: Kokeshi|null;
  private peca: Peca;

  constructor (jogoKokeshi: JogoKokeshi, kokeshiMovida: Kokeshi|null, tipoSelecao: SelecaoKokeshi = SelecaoKokeshi.DEFINIDO, avanco: MovimentoKokeshi = MovimentoKokeshi.SIMPLES) {

    super(jogoKokeshi);

    if (!MoverKokeshi.efeitoValido(kokeshiMovida, tipoSelecao))
      throw new Error("Efeito inválido.");

    this.avanco = avanco;
    this.kokeshiMovida = kokeshiMovida;
    this.tipoSelecao = tipoSelecao;
  }

  private static efeitoValido(kokeshiMovida: Kokeshi, tipoSelecao: SelecaoKokeshi) {

    /*
    É válido se apenas um dos dois ocorrer: 
    Ou é opção definida, Ou kekeshi é nulo
    */
    
    return (kokeshiMovida == null) !== (tipoSelecao == SelecaoKokeshi.DEFINIDO);
  }

  public associar(peca: Peca): void {

    /* Associa peça ao efeito */

    if (this.peca != null)
      throw new Error("Só pode associar uma vez.");

    this.peca = peca;
  }

  public escolher(kokeshiMovida: Kokeshi) {

    /* Escolhe o kokeshiMovida a ser movido, se não tiver definido ainda */

    if (this.kokeshiMovida != null)
      throw new Error("Não é possível escolher efeito já definido.");
  
    // Validar escolha
    const delta = kokeshiMovida - this.peca.getPosicao();  

    const valida = 
      (this.tipoSelecao == SelecaoKokeshi.DIREITA && delta <= 0) || 
      (this.tipoSelecao == SelecaoKokeshi.ESQUERDA && delta >= 0);

    if (valida)
      throw new Error("Escolha inválida");

    this.kokeshiMovida = kokeshiMovida;
  }

  public ativar(): void {

    if (this.kokeshiMovida == null)
      throw new Error("Não é possível ativar efeito indefinido.");

    // Lógica: Mover kokeshi
  }
}

// ====================== ANIMAL ======================

class EfeitoAnimal extends Efeito {

  /*
  Efeito de movimentação sobre um animal. É necessário escolher
  o animal antes de ativar o efeito, se o animal já não estiver
  definido. 
  */

  private animal: Animal|null;

  constructor (jogoKokeshi: JogoKokeshi, animal: Animal|null) {

    super(jogoKokeshi);
    this.animal = animal;
  }

  public escolher(animal: Animal) {

    /* Escolhe em qual animal peça será movida, se já não estiver definido */

    if (this.animal != null)
      throw new Error("Não é possível escolher efeito já definido.");
  
    this.animal = animal;
  }

  public ativar(): void {

    if (this.animal == null)
      throw new Error("Não é possível ativar efeito indefinido.");
  
    // Lógica: avançar com disco no tabuleiro animais
  }
}

// ====================== COMPRA ======================

class EfeitoCompra extends Efeito {

  private opcao: SelecaoCompra;
  private posicaoEscolhida: Kokeshi|null;
  private peca: Peca;

  constructor(jogoKokeshi: JogoKokeshi, opcao: SelecaoCompra) {
    
    super(jogoKokeshi);
    this.opcao = opcao;
  }

  public associar(peca: Peca): void {

    if (this.peca != null)
      throw new Error("Não pode associar efeito já posicionado.");

    this.peca = peca;

    // Se for o caso, escolhe posição automaticamente
    if (this.opcao == SelecaoCompra.FRENTE)
      this.escolher(this.peca.getPosicao())
  }

  public escolher(posicaoEscolhida: Kokeshi): void {
    
    if (this.posicaoEscolhida != null)
      throw new Error("Não pode escolher efeito já definido.");
    
    this.posicaoEscolhida = posicaoEscolhida;
  }

  public ativar(): void {
      
    if (this.posicaoEscolhida == null)
      throw new Error("Não é possível ativar efeito indefinido.");
  
    // Lógica: Comprar e posicionar peça
  }
}

// ====================== RECONHECIMENTO ======================

class EfeitoReconhecimento extends Efeito {

  private pontos: number|null;

  constructor(jogoKokeshi: JogoKokeshi, pontos: number) {

    super(jogoKokeshi);

    if (![3,5,7].includes(pontos))
      throw new Error("Pontuação inválida");
  }

  public ativar(): void {
      
    if (this.pontos == null)
      throw new Error("Não é possível ativar efeito indefinido.");
  
    // Lógica: Avançar na pontuação do tabuleiro da felicidade
  }
}
