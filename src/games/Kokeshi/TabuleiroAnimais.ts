
type Ficha = Jogador;
type Indice = number;

class PilhaFichas {

  /* Pilha de fichas usada no trilhas de animais. Pode empilhar
  uma ficha, ou remover (reorganizando em seguida). */

  private pilha: Ficha[];
  private tamanho: number;

  constructor(tamanho: number) {
    this.tamanho = tamanho;
    this.pilha = Array(tamanho).fill(null);
  }

  public empilhar(ficha: Ficha) {

    /* Adiciona uma ficha no topo da pilha. */
    
    const primeiroIndiceLivre = this.primeiroIndiceLivre();

    if (primeiroIndiceLivre == null)
      throw new Error("PilhaFichas cheia.");

    this.pilha[primeiroIndiceLivre] = ficha;
  }

  public remover(jogador: Jogador) {

    /* Remove a ficha do jogador informado da pilha. Em seguida
    remove espaços vazios da pilha. */

    const indiceJogador = this.indiceJogador(jogador);

    if (indiceJogador == null)
      throw new Error("Ficha do jogador não se encontra empilhada.");

    this.pilha[indiceJogador] = null;

    this.removerBolhas();
  }

  public contem(jogador: Jogador): boolean {

    /* Retorna se a pilha contém a ficha de um dado jogador. */

    return this.indiceJogador(jogador) != null;
  }

  private removerBolhas(): void {

    /* Remove espaços vazios entre diferentes fichas. */

    for (let i=0; i<this.tamanho-1; i++) {

      if (this.pilha[i] == null && this.pilha[i+1] != null) {

        this.pilha[i] = this.pilha[i+1];
        this.pilha[i+1] = null;
      }
    }      
  }

  public vazia(): boolean {

    /* Retorna se a pilha está vazia. */
    
    return this.ultimaOcupada() == null; 
  }

  public topo(): Ficha {

    /* Retorna a pilha que está no topo da pilha. */

    return this.pilha[this.ultimaOcupada()];
  }

  private ultimaOcupada(): Indice|null {

    /* Retorna o último índice ocupado da pilha. */

    for (let i=this.tamanho-1; i >= 0; i--)
      if (this.pilha[i] != null)
        return i;

    return null;
  }

  private primeiroIndiceLivre(): Indice|null {

    /* Retorna o primeiro índice da pilha que se encontra vazia.
    Se não encontrar retorna null */

    for (let i=0; i<this.tamanho; i++)
      if (this.pilha[i] == null)
        return i;

    return null;
  }

  private indiceJogador(jogador: Jogador): Indice|null {

    /* Retorna o índice da pilha em que se encontra dado jogador.
    Se não encontrar retorna null */

    for (let i=0; i<this.tamanho; i++)
      if (this.pilha[i] == jogador)
        return i;

    return null;
  }
}

class TrilhaAnimal {

  private static tamanho = 8;
  private static posicaoLinhaVermelha = 3;
  private posicoes: PilhaFichas[];

  constructor() {

    this.posicoes = Array.from(Array(TrilhaAnimal.tamanho), () => new PilhaFichas(NUMERO_JOGADORES))
  }

  public avancar(jogador: Jogador) {

    /* Avança um jogador de posição. */

    const posicaoJogador = this.posicaoJogador(jogador);

    // Assegurando que não é última posição
    if (posicaoJogador == TrilhaAnimal.tamanho - 1)
      throw new Error("Jogador na última posição não pode avançar.");

    this.posicoes[posicaoJogador].remover(jogador);
    this.posicoes[posicaoJogador+1].empilhar(jogador); 
  }

  public ehPrimeiro(jogador: Jogador): boolean {

    /* Retorna se dado jogador é o primeiro colocado */

    return jogador == this.primeiroJogador();
  } 

  public primeiroJogador(): Jogador {

    /* Retorna o jogador que está em primeiro colocado na trilha. */

    for (let posicao = TrilhaAnimal.tamanho-1; posicao >= 0; posicao--)
      if (!this.posicoes[posicao].vazia())
        return this.posicoes[posicao].topo();

    throw new Error("Jogador não encontrado");
  }  

  public ehReconhecido(jogador: Jogador) {

    /* Retorna se um jogador tem reconhecimento na trilha, ou seja,
    se ele já ultrapassou a linha vermelha. */

    return this.posicaoJogador(jogador) > TrilhaAnimal.posicaoLinhaVermelha;
  }

  private posicaoJogador(jogador: Jogador): Indice {
    
    /* Retorna o índice da posição em que o jogador se encontra
    na trilha. */

    for (let posicao = TrilhaAnimal.tamanho-1; posicao >= 0; posicao--)
      if (this.posicoes[posicao].contem(jogador))
        return posicao;

    throw new Error("Jogador não encontrado");
  }
}

class TabuleiroAnimais {

  /* As trilhas têm 4 trilhas de animais, cada uma com 8 posições
  cada posição possui uma pilha de fichas. */

  private static formato: Coord = new Coord(4,8);
  private trilhas: TrilhaAnimal[];

  constructor() {

    this.trilhas = TabuleiroAnimais.criarTabuleiro();
  }

  private static criarTabuleiro(): TrilhaAnimal[] {

    /* Cria trilhas padrão. */

    return Array.from(Array(TabuleiroAnimais.formato.x), () => new TrilhaAnimal());
  }

  public avancar(animal: Animal, jogador: Jogador): void {

    /* Avança a ficha de um jogador em umaa trilha de animal
    para a posição seguinte */

    this.trilhas[animal].avancar(jogador);   
  }

  public ehPrimeiro(animal: Animal, jogador: Jogador): boolean {

    /* Verifica se dado jogador é o primeiro colocado na 
    trilha de um animal. */

    return this.trilhas[animal].ehPrimeiro(jogador);
  }

  public ehReconhecido(animal: Animal, jogador: Jogador): boolean {

    /* Verifica se o jogador é reconhecido na produção de tal animal.
    Para tal ele precisa ter ultrapassado a linha vermelha. */

    return this.trilhas[animal].ehReconhecido(jogador);
  }
}
