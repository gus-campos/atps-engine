
type Jogador = number;

enum Kokeshi {
  PRINCESA = 0,
  BATCHAN = 1,
  PESCADOR = 2,
  SAMURAI = 3,
  SUMOTORI = 4
}

enum Animal {
  PANDA = 0,
  RAPOSA = 1,
  GATO = 2,
  COELHO = 3
}

enum Estagio {
  ESPECIFICAR_KOKESHI,
  ESCOLHER_EFEITO,
  ESPECIFICAR_ANIMAL,
  ESPECIFICAR_POSICIONAMENTO
}

type Pendencia = Efeito|Peca;

type Acao = 
  | { tipo: Estagio.ESPECIFICAR_KOKESHI, kokeshi: Kokeshi }
  | { tipo: Estagio.ESCOLHER_EFEITO, escolha: EscolhaEfeito }
  | { tipo: Estagio.ESPECIFICAR_ANIMAL, animal: Animal }
  | { tipo: Estagio.ESPECIFICAR_POSICIONAMENTO, posicionamento: Kokeshi };

// TODO: Inicialização
// TODO: Escolher posicionar, ou não, reconhecimento
// TODO: Atingir o limite do tabuleiro só causa reconhecimento se movimento simples

class JogoKokeshi {

  private pecasIniciais: Peca[];
  private ofertaPecas: Peca[];

  private tabuleirosHabilidades: TabuleiroHabilidades[];
  private tabuleiroAnimais: TabuleiroAnimais;

  private estagio: Estagio;
  private jogadorAtual: Jogador;
  private pontuacao: number[];

  private pendencias: Pendencia[];
  private pecasReservadas: Peca[];

  constructor() { 

    this.pecasIniciais = structuredClone(PECAS_INICIAIS);
    this.ofertaPecas = [];
    
    this.estagio = Estagio.ESPECIFICAR_KOKESHI;
    this.jogadorAtual = 0;

    this.tabuleiroAnimais = new TabuleiroAnimais();
    this.tabuleirosHabilidades = Array.from(Array(NUMERO_JOGADORES), () => new TabuleiroHabilidades());
    this.pontuacao = Array(NUMERO_JOGADORES).fill(0)

    this.pendencias = [];
    this.pecasReservadas = [];
  }

  public jogarAcao(acao: Acao): void {

    if (acao.tipo != this.estagio)
      throw new Error("Ação de tipo inválido.");

    switch (acao.tipo) {
  
      case Estagio.ESPECIFICAR_KOKESHI:
        this.especificarKokeshi(acao);
        break;

      case Estagio.ESCOLHER_EFEITO:
        this.escolherEfeito(acao);
        break;
        
      case Estagio.ESPECIFICAR_ANIMAL:
        this.especificarAnimal(acao);
        break;
        
      case Estagio.ESPECIFICAR_POSICIONAMENTO:
        this.especificarPosicionamento(acao);
        break;
    }

    this.processarPendencias();
    this.terminarEstagio();
  }

  private terminarEstagio(): void {

    /* Avalia e muda o estágio de acordo com o estado do jogo, 
    e se não houver mais nada a ser feito nesse turno, passa o turno
    pro próximo jogador. */

    if (this.pendencias.length == 0) {

      this.posicionarPecasReservadas();

      // this.passarVez(); // Tem que escolher a posição das peças primeiro
    }

    const proximoEstagio = this.proximoEstagioDoTurno();

    if (proximoEstagio != null) {

      this.estagio = proximoEstagio;
    }
    
    else {
    
      this.passarVez();
      this.estagio == Estagio.ESPECIFICAR_KOKESHI;
    }
  }

  private posicionarPecasReservadas() {
    
    // Avaliar peças que estão reservadas do lado
    // Avaliar preseça de conflito
  }

  private processarPendencias(): void {

    let lidou = true;

    while (lidou || this.pendencias.length != 0) {

      const ultimaPendencia = this.pendencias.at(-1);
      lidou = this.lidarComPendencia(ultimaPendencia);
      
      if (lidou)
        this.pendencias.pop();
    }
  }

  private especificarKokeshi(acao: Acao) {

    if (acao.tipo != Estagio.ESPECIFICAR_KOKESHI)
      throw new Error("Esperada ação de estágio ESPECIFICAR_KOKESHI.");

    let peca;

    if (this.pendencias.length == 0) {
      
      peca = this.moverKokeshi(acao.kokeshi);
    } 
    
    else {
      
      const efeito = this.pendencias.pop() as EfeitoMoverKokeshi;
      efeito.especificar(acao.kokeshi);
      peca = this.ativarEfeito(efeito);
    }

    this.pendencias.push(peca);
  }

  private escolherEfeito(acao: Acao) {

    if (acao.tipo != Estagio.ESCOLHER_EFEITO)
      throw new Error("Esperada ação de estágio ESCOLHER_EFEITO.");

    const peca = this.pendencias.pop() as Peca;
    const efeito = peca.getEfeito(acao.escolha);
    
    this.pendencias.push(efeito);
  }

  private especificarAnimal(acao: Acao) {

    if (acao.tipo != Estagio.ESPECIFICAR_ANIMAL)
      throw new Error("Esperada ação de estágio ESPECIFICAR_ANIMAL.");

    const efeito = this.pendencias.pop() as EfeitoMoverAnimal;
    efeito.especificar(acao.animal);
    this.ativarEfeito(efeito);
  }

  private especificarPosicionamento(acao: Acao) {
   
    if (acao.tipo != Estagio.ESPECIFICAR_POSICIONAMENTO)
      throw new Error("Esperada ação de estágio ESPECIFICAR_POSICIONAMENTO.");
   
    const efeito = this.pendencias.pop() as EfeitoAdicionarPeca;
    this.ativarEfeito(efeito);
  }
    
  private proximoEstagioDoTurno(): Estagio|null {

    /* A partir de uma avaliação do estado, retorna o próximo estágio
    que o turno deve assumir. */

    // TODO: Considerar peças a serem incluídas!!!

    if (this.pendencias.length == 0) {

      if (this.pecasReservadas.length == 0) {

        return null;
      }
    }

    const ultimaPendencia = this.pendencias.at(-1);
      
    if (ultimaPendencia instanceof Peca) {

      return Estagio.ESCOLHER_EFEITO;
    }

    else if (ultimaPendencia instanceof Efeito) {

      const efeito = ultimaPendencia as Efeito;

      return (
        
        efeito instanceof EfeitoMoverAnimal 
          ? Estagio.ESPECIFICAR_ANIMAL 
          : Estagio.ESPECIFICAR_KOKESHI
      );
    }
  }

  private passarVez() {

    /* Muda o jogador atual como sendo o próximo jogador */

    this.jogadorAtual = this.proximoJogador();
  }

  private proximoJogador(): Jogador {

    return (this.jogadorAtual + 1) % 2;
  }

  private lidarComPendencia(pendencia: Pendencia): boolean  {

    /* Lida com uma pendência, retorna se foi possível lidar. */

    if (pendencia instanceof Peca)
      return this.lidarComPendenciaPeca(pendencia as Peca);
    
    if (pendencia instanceof Efeito)
      return this.lidarComPendenciaEfeito(pendencia as Efeito);
  }

  private lidarComPendenciaPeca(peca: Peca): boolean {

    /* Lida com uma pendencia do tipo Peça. Primeiro avalia se
    a peça já está definida quanto a seus efeitos, ou seja, se não 
    precisa passar por escolha. Se positivo, ediciona os efeitos 
    dessa peça como pendências. Ainda retorna se teve sucesso ou
    não em lidar com tal pendência. */
        
    if (peca.definida()) {

      this.pendencias.pop();
      
      for (let efeito of peca.getEfeitos())
        if (efeito != null)
          this.pendencias.push(efeito); // Conta que em caso de dupla efeito kokeshi é o primeiro

      return true;
    }

    return false;
  }

  private lidarComPendenciaEfeito(efeito: Efeito) {

    /* Lida com uma pendencia do tipo Efeito. Ou seja, se o efeito 
    já estiver especificado (não precisando de intervenção), ele é 
    ativado. Ainda retorna se foi possível lidar com a pendência. */
        
    if (efeito.especificado()) {

      this.ativarEfeito(efeito);
      return true;
    }

    return false;
  }

  private ativarEfeito(efeito: Efeito): Peca|null {

    /* Ativa um efeito que já esteja especificado, de acordo
    com seu tipo. */

    if (!efeito.especificado())
      throw new Error("Um efeito deve estar decidido antes de ser executado.");

    if (efeito instanceof EfeitoAdicionarPeca) {
      
      const peca = this.comprarDaOferta();
      
      if (efeito.especificado())
        peca.associarPosicao(efeito.getPosicionamento());
    
      this.pecasReservadas.push(peca);

      return null;
    }

    if (efeito instanceof EfeitoMoverAnimal) {
      this.moverAnimal(efeito);
      return null;
    }

    if (efeito instanceof EfeitoMoverKokeshi) {
      return this.moverKokeshi(efeito);
    }
  }

  private posicionarPeca(peca: Peca): void {

    /* Posiciona uma peça, que já tenha uma posição associada,
    no tabuleiro de habilidade do jogador atual. */

    const tabuleiro = this.tabuleirosHabilidades[this.jogadorAtual];
    tabuleiro.posicionar(peca, peca.getPosicao());

    return null;
  }

  private moverAnimal(efeito: EfeitoMoverAnimal): void {

    /* Avança a ficha do jogador na fileira de um animal, no
    tabuleiro de animais. */

    this.tabuleiroAnimais.avancar(efeito.getAnimal(), this.jogadorAtual);

    return null;
  }

  private moverKokeshi(param1: EfeitoMoverKokeshi|Kokeshi): Peca {

    /* Executa um movimento sobre uma kokeshi. Se for passado uma Kokeshi,
    executa um avanço simples, se for passado um efeito, executa um movimento
    de acordo */

    // BUG: Movimento direto não pode dar algum problema?

    const tabuleiroJogador = this.tabuleirosHabilidades[this.jogadorAtual];
    
    if (param1 instanceof EfeitoMoverKokeshi) {

      const efeito = param1 as EfeitoMoverKokeshi;
      return tabuleiroJogador.moverKokeshi(efeito.getKokeshi(), efeito.getMovimento());
    }

    else {

      const kokeshi = param1 as Kokeshi;
      return tabuleiroJogador.moverKokeshi(kokeshi, Movimento.SIMPLES);
    }
  }

  private comprarDaOferta(): Peca {

    /* Remove e retorna uma peça alatória do estoque de oferta. */

    return this.pegarPeca(this.ofertaPecas);
  }

  private comprarDoInicial(): Peca {

    /* Remove e retorna uma peça aleatória do estoque inicial. */

    return this.pegarPeca(this.pecasIniciais);
  }

  private pegarPeca(estoque: Peca[]): Peca {

    /* Tira uma peça aleatória de um array e a retorna. */

    if (estoque.length == 0)
      throw new Error("Não é possível pegar peça de estoque vazio.");

    const index = RANDOM_IN_RANGE(estoque.length);
    return estoque[index];
  }
}
