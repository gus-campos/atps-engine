
import { XORShift } from "random-seedable";

export class Random {

  /* Gerador de números aleatórios que 
  permite fixar uma seed */

  private generator: XORShift;

  constructor(seed: number=null) {

    /* Se seed não for passada, o timestamp é
    usada como seed. */

    if (seed == null)
      seed = Date.now();

    this.generator = new XORShift(seed);
  }

  public range(range: number): number {

    /* Número aleatório de 0 até range */

    return Math.floor(this.generator.float() * range);
  }

  public choice<T>(arr: T[]): T {

    /* Passada um array, retorna um elemento 
    aleatório dele */

    return this.generator.choice(arr);
  }

  public int(): number {

    /* Inteiro aleatório (atá valor máximo 
    armazenável */

    return this.generator.int();
  }

  public float(): number {

    /* Float aleatório, de 0 a 1 */

    return this.generator.float();
  }
}

export const RANDOM = new Random();
