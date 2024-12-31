import { Action, Game } from "src/shared/Game";
import { RANDOM } from "src/utils/Random";

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
    let randomIndex = RANDOM.range(validActions.length);
    return validActions[randomIndex];
  }
}
