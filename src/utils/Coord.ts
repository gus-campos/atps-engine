
export class Coord {

  /* Representa uma coordenada de um slot
  em um tabuleiro de jogo. Usa propriedades públicas, 
  para simular um objeto simples com métodos.
  Seria contra um princípio de OO, mas a imutabilidade
  das propriedades torna isso seguro e prático. */

  public readonly x: number;
  public readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public sub(coord: Coord): Coord {

    /* Subtrai duas coordenadas */

    return new Coord(this.x - coord.x, this.y - coord.y);
  }

  public add(coord: Coord): Coord {

    /* Adiciona duas coordenadas */

    return new Coord(this.x + coord.x, this.y + coord.y);
  }

  public equals(coord: Coord): boolean {

    /* Compara duas coordenadas */

    return this.x == coord.x && this.y == coord.y;
  }

  public mult(k: number) {

    /* Multiplica uma coordenada por um escalar */

    return new Coord(k * this.x, k * this.y);
  }
}
