import { Action, Game } from "src/shared/Game";
import { RANDOM } from "src/utils/Random";
import { Agent } from "../shared/Agent";


export class RandomAgent implements Agent {

  private game: Game;

  constructor(game: Game) {

    this.game = game;
  }

  public nextAction(): Action {

    let validActions = this.game.getValidActions();
    let randomIndex = RANDOM.range(validActions.length);
    return validActions[randomIndex];
  }
}
