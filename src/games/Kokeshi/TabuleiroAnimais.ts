import { Animal, Jogador } from "./Types";

type Ficha = Jogador;
type Indice = number;

import { NUMERO_JOGADORES } from "./Globals";

export class TabuleiroAnimais {
  /* O tabuleiro possui 4 trilhas de animais (PANDA, RAPOSA, GATO, COELHO), cada
  uma com 8 posições, e cada posição com uma pilha, que pode conter uma ficha de
  cada jogador. */

  private static tamanho: number = 4;
  // Trilhas indexadas através da correspondência Animal - número. Verificar o 
  // enum Animal em "./Types.ts"
  private trilhas: TrilhaAnimal[];

  constructor() {
    this.trilhas = TabuleiroAnimais.criarTabuleiro();
  }

  private static criarTabuleiro(): TrilhaAnimal[] {
    /* Retorna as trilhas vazias do tabuleiro. */

    return Array.from(
      Array(TabuleiroAnimais.tamanho),
      () => new TrilhaAnimal()
    );
  }

  public avancar(animal: Animal, jogador: Jogador): void {
    /* Avança a ficha de um jogador, em uma trilha de animal específica, para a 
    posição seguinte. */

    this.trilhas[animal].avancar(jogador);
  }

  public ehPrimeiro(animal: Animal, jogador: Jogador): boolean {
    /* Verifica se dado jogador é o primeiro colocado na trilha de um animal. */

    return this.trilhas[animal].ehPrimeiro(jogador);
  }

  public ehReconhecido(animal: Animal, jogador: Jogador): boolean {
    /* Verifica se o jogador é reconhecido na produção de tal animal. Para tal 
    ele precisa ter ultrapassado a linha vermelha na trilha de animal 
    correspondente. */

    return this.trilhas[animal].ehReconhecido(jogador);
  }

  public toString() {
    /* Retorna a string que representa o tabuleiro de animais. */

    let string = "";

    for (let trilha of this.trilhas) {
      string += trilha.toString() + "\n";
    }

    return string;
  }
}

class TrilhaAnimal {
  /* Representa uma trilha do tabuleiro de animais, que possui várias posições 
  nas quais as fichas vão avançando. Cada posição é representada por uma pilha 
  de fichas (ver PilhaFichas abaixo). */

  private static tamanho = 8;
  private posicoes: PilhaFichas[];
  // A posição que precisa ser ultrapassada pelo jogador para ser reconhecido
  // representado no tabuleiro real por uma linha vermelha
  private static posicaoLinhaVermelha = 3;

  constructor() {
    const gerarPilhaFichas = () => new PilhaFichas(NUMERO_JOGADORES);
    this.posicoes = Array.from(Array(TrilhaAnimal.tamanho), gerarPilhaFichas);

    for (let jogador = 0; jogador < NUMERO_JOGADORES; jogador++)
      this.posicoes[0].empilhar(jogador);
  }

  public avancar(jogador: Jogador) {
    /* Avança a posição de um jogador. */

    const posicaoJogador = this.posicaoJogador(jogador);

    // Assegurando que não é última posição
    if (posicaoJogador == TrilhaAnimal.tamanho - 1)
      throw new Error("Jogador na última posição não pode avançar.");

    this.posicoes[posicaoJogador].remover(jogador);
    this.posicoes[posicaoJogador + 1].empilhar(jogador);
  }

  public ehPrimeiro(jogador: Jogador): boolean {
    /* Retorna se dado jogador é o primeiro colocado */

    return jogador == this.primeiroJogador();
  }

  public primeiroJogador(): Jogador {
    /* Retorna o jogador que está em primeiro colocado na trilha. */

    for (let posicao = TrilhaAnimal.tamanho - 1; posicao >= 0; posicao--)
      if (!this.posicoes[posicao].vazia()) return this.posicoes[posicao].topo();

    throw new Error("Jogador não encontrado");
  }

  public ehReconhecido(jogador: Jogador) {
    /* Retorna se um jogador tem reconhecimento na trilha, ou seja, se ele já 
    ultrapassou a linha vermelha. */

    return this.posicaoJogador(jogador) > TrilhaAnimal.posicaoLinhaVermelha;
  }

  private posicaoJogador(jogador: Jogador): Indice {
    /* Retorna o índice da posição em que o jogador se encontra na trilha. */

    for (let posicao = TrilhaAnimal.tamanho - 1; posicao >= 0; posicao--)
      if (this.posicoes[posicao].contem(jogador)) return posicao;

    throw new Error("Jogador não encontrado");
  }

  public toString(): String {
    /* Retorna a string que representa o objeto. */

    let string = "";

    for (let pilha of this.posicoes) {
      string += pilha.toString() + " | ";
    }

    return string;
  }
}

class PilhaFichas {
  /* Pilha de fichas usada no trilhas de animais. Permite que se empilhe fichas 
  de jogadores em uma ordem, e permite também que uma ficha seja empilhada ou 
  removida. */

  private pilha: Ficha[];
  private tamanho: number;

  constructor(tamanho: number) {
    this.tamanho = tamanho;
    this.pilha = Array(tamanho).fill(null);
  }

  public empilhar(ficha: Ficha) {
    /* Adiciona uma ficha no topo da pilha. */

    const primeiroIndiceLivre = this.primeiroIndiceLivre();

    if (primeiroIndiceLivre == null) throw new Error("PilhaFichas cheia.");

    this.pilha[primeiroIndiceLivre] = ficha;
  }

  public remover(jogador: Jogador) {
    /* Remove da pilha a ficha jogador específico. Em seguida remove o espaço 
    vazio que ficar na pilha. */

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
    /* Remove qualquer espaço vazio que ficar em uma pilha após uma ou mais 
    fichas serem removidas. */

    for (let i = 0; i < this.tamanho - 1; i++) {
      if (this.pilha[i] == null && this.pilha[i + 1] != null) {
        this.pilha[i] = this.pilha[i + 1];
        this.pilha[i + 1] = null;
      }
    }
  }

  public vazia(): boolean {
    /* Retorna se a pilha está vazia. */

    return this.ultimaOcupada() == null;
  }

  public topo(): Ficha {
    /* Retorna a ficha que está no topo da pilha. */

    return this.pilha[this.ultimaOcupada()];
  }

  private ultimaOcupada(): Indice | null {
    /* Retorna o último índice ocupado da pilha. */

    for (let i = this.tamanho - 1; i >= 0; i--)
      if (this.pilha[i] != null) return i;

    return null;
  }

  private primeiroIndiceLivre(): Indice | null {
    /* Retorna o primeiro índice da pilha que se encontra vazia, (posição na 
    qual é possível empilhar uma ficha). Se não encontrar, retorna null */

    for (let i = 0; i < this.tamanho; i++) if (this.pilha[i] == null) return i;

    return null;
  }

  private indiceJogador(jogador: Jogador): Indice | null {
    /* Retorna o índice da pilha em que se encontra dado jogador. Se não 
    encontrar o jogador na pilha, retorna null. */

    for (let i = 0; i < this.tamanho; i++)
      if (this.pilha[i] == jogador) return i;

    return null;
  }

  public toString(): String {
    /* Retorna a string que representa a pilha de fichas. */

    let string = "";

    for (let nivel of this.pilha) {
      if (nivel != 0 && nivel != 1) string += "X";
      else string += nivel;
    }

    return string;
  }
}
