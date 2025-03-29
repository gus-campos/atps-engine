
type Ficha = Jogador;

/*
As trilhas de animais podem ter mais de uma ficha ao mesmo tempo
na mesma posição, então 
*/

class PilhaFicha {

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
    
    const primeiraLivre = this.primeiraLivre();

    if (primeiraLivre == -1)
      throw new Error("Pilha cheia.");

    this.pilha[primeiraLivre] = ficha;
  }

  public remover(jogador: Jogador) {

    /* Remove a ficha do jogador informado da pilha. Em seguida
    remove espaços vazios da pilha. */

    const indiceJogador = this.indiceJogador(jogador);

    if (indiceJogador == -1)
      throw new Error("Ficha do jogador não se encontra empilhada.");

    this.pilha[indiceJogador] = null;

    this.removerBolhas();
  }

  public contem(jogador: Jogador): boolean {

    return this.indiceJogador(jogador) != -1;
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
    
    return this.ultimaOcupada() == -1; 
  }

  public topo(): Ficha {

    return this.pilha[this.ultimaOcupada()];
  }

  private ultimaOcupada() {

    /* Retorna o último índice ocupado. */

    for (let i=this.tamanho-1; i >= 0; i--)
      if (this.pilha[i] != null)
        return i;

    return -1;
  }

  private primeiraLivre(): number {

    /* Retorna o primeiro índice da pilha que se encontra vazia.
    Se não encontrar retorna -1 */

    for (let i=0; i<this.tamanho; i++)
      if (this.pilha[i] == null)
        return i;

    return -1;
  }

  private indiceJogador(jogador: Jogador): number {

    /* Retorna o índice da pilha em que se encontra dado jogador.
    Se não encontrar retorna -1 */

    for (let i=0; i<this.tamanho; i++)
      if (this.pilha[i] == jogador)
        return i;

    return -1;
  }
}

// TODO: Classe TrilhaAnimal?

class TabuleiroAnimais {

  /* As trilhas têm 4 trilhas de animais, cada uma com 8 posições
  cada posição possui uma pilha de fichas. */

  private static formato: Coord = new Coord(4,8);
  private static posicaoLinhaVermelha = 3;
  private trilhas: PilhaFicha[][];
  private kokeshi: JogoKokeshi;

  constructor(kokeshi: JogoKokeshi) {

    this.trilhas = TabuleiroAnimais.criarTabuleiro();
    this.kokeshi = kokeshi;
  }

  private static criarTabuleiro(): PilhaFicha[][] {

    /* Cria trilhas padrão. */

    // Cria preenchendo com pilhas vazias
    const trilhas = Array.from(
      Array(TabuleiroAnimais.formato.x), ()=>Array.from(
        Array(TabuleiroAnimais.formato.y), ()=>new PilhaFicha(NUMERO_JOGADORES)));

    // Coloca fichas de todos os jogadores na primeira posição
    for (let animal=0; animal<NUMERO_ANIMAIS; animal++)
      for (let jogador=0; jogador<NUMERO_JOGADORES; jogador++)
        trilhas[animal][0].empilhar(jogador);
      
    return trilhas;
  }

  public avancar(animal: Animal, jogador: Jogador): void {

    /* Avança a ficha de um jogador em umaa trilha de animal
    para a posição seguinte */

    const posicaoJogador = this.posicaoJogador(animal, jogador);

    // Verificando se é última posição
    if (posicaoJogador == TabuleiroAnimais.formato.y - 1)
      throw new Error("Jogador na última posição não pode avançar.");

    this.trilhas[animal][posicaoJogador].remover(jogador);
    this.trilhas[animal][posicaoJogador+1].empilhar(jogador);    
  }

  public ehPrimeiro(animal: Animal, jogador: Jogador): boolean {

    /* Verifica se dado jogador é o primeiro colocado na 
    trilha de um animal. */

    return jogador == this.primeiro(animal);
  } 

  private primeiro(animal: Animal): Jogador {

    /* Retorna o primeiro colocado na trilha de um animal. */
  
    const posicoes = TabuleiroAnimais.formato.y;
    const trilha = this.trilha(animal);

    for (let posicao = posicoes-1; posicao >= 0; posicao--)
      if (!trilha[posicao].vazia())
        return trilha[posicao].topo();

    throw new Error("Jogador não encontrado");
  }

  public reconhecido(animal: Animal, jogador: Jogador): boolean {

    /* Verifica se o jogador é reconhecido na produção de tal animal.
    Para tal ele precisa ter ultrapassado a linha vermelha. */

    return this.posicaoJogador(animal, jogador) > TabuleiroAnimais.posicaoLinhaVermelha;
  }

  private posicaoJogador(animal: Animal, jogador: Jogador): number {
    
    /* Encontra o índice da posição em que o jogador se encontra
    na trilha de um animal. */

    const posicoes = TabuleiroAnimais.formato.y;
    const trilha = this.trilha(animal);

    for (let posicao = posicoes-1; posicao >= 0; posicao--)
      if (trilha[posicao].contem(jogador))
        return posicao;

    throw new Error("Jogador não encontrado");
  }

  private trilha(animal: Animal): PilhaFicha[] {

    /* Retorna a trilha de um animal. */

    return this.trilhas[animal];
  }
}
