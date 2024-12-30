import { Action, Game } from "src/shared/Game";

import { XORShift } from "random-seedable";
let seed = Date.now(); // = 100;
export const random = new XORShift(seed);

export class RandomAgent {

  private game: Game;

  constructor(game: Game) {

    this.game = game;
  }

  public static nextGameAction(game: Game) {
    
    let randomAgent = new RandomAgent(game);
    return randomAgent.nextAction();
  }

  public nextAction(): Action {

    let validActions = this.game.getValidActions();
    let randomIndex = this.randRange(validActions.length);
    return validActions[randomIndex];
  }

  private randRange(range: number) {
    return Math.floor(random.float() * range);
  }
}
