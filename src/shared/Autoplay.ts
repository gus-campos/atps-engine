// =========================================================

import { Action, Game } from "src/shared/Game";
import { MCTS } from "src/agents/MCTS";
import { RandomAgent } from "src/agents/Random";

import { TicTacToe } from "src/games/TicTacToe";
import { GobbletGobblers } from "src/games/GobbletGobblers";
import { Boop } from "src/games/Boop";


// =========================================================

interface Score {
  victories: number,
  defeats: number,
  draws: number
}

interface OwnGoals {
  unfavorable: number,
  favorable: number
}

export enum GameName {
  TIC_TAC_TOE,
  GOBLET_GOBBLERS,
  BOOP
}

export enum Agent {
  MCTS,
  RANDOM
}

const MCTS_TIME_CRITERIA = 1000;
const MCTS_GEN_GRAPH = false;

export class AutoPlay {

  private gameName: GameName;
  private game: Game;
  private agents: Agent[]
  private print: boolean;

  private score: Score;
  private ownGoals: OwnGoals;

  constructor(gameName: GameName, agents: Agent[], print: boolean) {
    
    this.gameName = gameName;
    this.agents = agents;
    this.print = print;

    this.resetInfo();
    this.resetGame();
  }

  // ============
  // Public
  // ============

  public play(): void {
  
    while (!this.game.getTermination()) {

      let action = this.agentAction();
      this.game.playAction(action);
  
      if (this.print) 
        this.game.printState();
    }

    this.updateInfo();
  }

  public playMultiple(rounds: number): void {

    for (let i=0; i<rounds; i++) {
  
      console.log(`Progresso: ${(100 * i) / rounds}%`);
      this.play();
      this.resetGame();
    }
  }

  public printInfo(): void {

    console.log(this.score);
    console.log(this.ownGoals);
  }

  public resetInfo(): void {

    this.score = {
      victories: 0,
      defeats: 0,
      draws: 0,
    }

    this.ownGoals = {
      favorable: 0,
      unfavorable: 0
    }
  }

  // ============
  // Private
  // ============

  private agentAction(): Action {

    const currentPlayer = this.game.getCurrentPlayer();
    const agent = this.agents[currentPlayer];

    switch (agent) {

      case Agent.RANDOM:
        return this.randomAction();
      
      case Agent.MCTS:
        return this.mctsAction();
      
      default:
        throw new Error("Invalid agent");
    }
  }
  
  private resetGame(): void {

    switch (this.gameName) {

      case GameName.TIC_TAC_TOE:
        this.game = new TicTacToe();
        break;
      
      case GameName.GOBLET_GOBBLERS:
        this.game = new GobbletGobblers();
        break;
      
      case GameName.BOOP:
        this.game = new Boop();
        break;

      default:
        throw new Error("Invalid game name");
    }
  }

  private mctsAction(): Action {

    let action = MCTS.nextGameAction(this.game, MCTS_TIME_CRITERIA, MCTS_GEN_GRAPH);
    return action;
  }

  private randomAction(): Action {

    let action = RandomAgent.nextGameAction(this.game);
    return action
  }

  private updateInfo() {

    const winner = this.game.getWinner();

    // Score

    if (winner == 0)
      this.score.victories++;

    else if (winner == 1)
      this.score.defeats++;
    
    else
      this.score.draws++;
    
    // Own Goal

    const lastPlayer = this.game.getLastPlayer();

    if (winner != null && winner != lastPlayer) {

      if (winner == 0)
        this.ownGoals.favorable++;
      
      else
        this.ownGoals.unfavorable++;
    }
  }
}

// =========================================================
