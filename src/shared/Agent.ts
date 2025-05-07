
import { Action } from "src/shared/Game";

export interface Agent {

  // Retornar próxima ação do jogo
  nextAction(): Action;
}
