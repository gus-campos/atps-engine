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

interface Results {
  score: Score,
  ownGoals: OwnGoals
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
  private results: Results;

  constructor(gameName: GameName, agents: Agent[], print: boolean) {
    
    this.gameName = gameName;
    this.agents = agents;
    this.print = print;

    this.resetResults();
    this.resetGame();
  }

  // ============
  // Public
  // ============

  public play(): void {

    /* 
    Plays the game until termination, choosing the action based
    on the corresponding players agent, and updates the results
    */
  
    while (!this.game.getTermination()) {

      let action = this.agentAction();
      this.game.playAction(action);
  
      if (this.print) 
        this.game.printState();
    }

    this.updateResults();
  }

  public playMultiple(rounds: number): void {

    /*
    Plays multiple games, until termination, updating the results
    */

    for (let i=0; i<rounds; i++) {
  
      console.log(`Progresso: ${(100 * i) / rounds}%`);
      this.play();
      this.resetGame();
    }
  }

  public printResults(): void {

    console.log(this.results);
  }

  public resetResults(): void {

    /*
    (Re) initializes the results property, with all
    values set to 0.
    */

    this.results = {
      
      score: {
        victories: 0,
        defeats: 0,
        draws: 0,
      },

      ownGoals: {
        favorable: 0,
        unfavorable: 0
      }
    }
  }

  // ============
  // Private
  // ============

  private agentAction(): Action {

    /*
    Chooses next action based on the players agent
    */

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

    /*
    Calls the corresponding generator to generate a new
    game, with initial state.
    */

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

  private updateResults() {

    /*
    Updates score and own goals, player 0 is always maximizing 
    player. So "victory" means player 0 won, and a favorable
    own goal means a own goal favorable to player 0.
    */

    this.updateScore();
    this.updateOwnGoals();    
  }

  private updateScore(): void {

    /*
    Updates score, player 0 is always maximizing 
    player. So "victory" means player 0 won.
    */

    const winner = this.game.getWinner();

    if (winner == 0)
      this.results.score.victories++;

    else if (winner == 1)
      this.results.score.defeats++;
    
    else
      this.results.score.draws++;
  }

  private updateOwnGoals() {

    /*
    Updates score and own goals, player 0 is always maximizing 
    player. So favorable own goal means a own goal favorable
    to player 0.
    */
   
    const winner = this.game.getWinner();
    const lastPlayer = this.game.getLastPlayer();

    if (winner != null && winner != lastPlayer) {

      if (winner == 0)
        this.results.ownGoals.favorable++;
      
      else
        this.results.ownGoals.unfavorable++;
    }
  }
}

// =========================================================
