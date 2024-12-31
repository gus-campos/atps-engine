
import { XORShift } from "random-seedable";

class Random {

  private generator: XORShift;

  constructor(seed: number=null) {

    if (seed == null)
      seed = Date.now();

    this.generator = new XORShift(seed);
  }

  public range(range: number): number {
    return Math.floor(this.generator.float() * range);
  }

  public choice<T>(arr: T[]): T {
    return this.generator.choice(arr);
  }

  public int(): number {
    return this.generator.int();
  }

  public float(): number {
    return this.generator.float();
  }
}

export const RANDOM = new Random();
