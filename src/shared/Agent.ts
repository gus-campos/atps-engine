
import { Action } from "src/shared/Game";

export interface Agent {

  nextAction(): Action;
}
