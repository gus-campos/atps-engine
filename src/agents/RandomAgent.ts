import { Action, Game } from "src/shared/Game";
import { RANDOM } from "src/utils/Random";
import { Agent } from "../shared/Agent";
import NoActionsAvailable from "src/shared/NoActionsAvailable";

export class RandomAgent implements Agent {

  private game: Game;

  constructor(game: Game) {

    this.game = game;
  }

  public nextAction(): Action {

    let validActions = this.game.getValidActions();

    if (validActions.length == 0)
      throw new NoActionsAvailable("No actions available to play");

    let randomIndex = RANDOM.range(validActions.length);
    return validActions[randomIndex];
  }
}
