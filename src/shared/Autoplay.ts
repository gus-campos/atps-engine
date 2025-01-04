// =========================================================

import { Action, Game } from "src/shared/Game";
import { MCTS } from "src/agents/MCTS";
import { RandomAgent } from "src/agents/RandomAgent";

import { TicTacToe } from "src/games/TicTacToe";
import { GobbletGobblers } from "src/games/GobbletGobblers";
import { Boop } from "src/games/Boop";
import { ConnectFour } from "src/games/ConnectFour";
import { Checkers } from "src/games/Checkers";


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
  ownGoals: OwnGoals,
  meanTurns: number,
  meanTime: number
}

export enum GameName {
  TIC_TAC_TOE,
  GOBLET_GOBBLERS,
  BOOP,
  CONNECT_FOUR,
  CHECKERS
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
  private turnsSum: number;
  private initialTime: number;

  constructor(gameName: GameName, agents: Agent[], print: boolean) {
    
    this.gameName = gameName;
    this.agents = agents;
    this.print = print;
    this.turnsSum = 0;
    this.initialTime = Date.now();

    this.resetResults();
    this.resetGame();
  }

  // ============
  // Public
  // ============

  public playMultiple(rounds: number): Results {

    /*
    Plays multiple games, until termination, updating the results
    */

    this.resetResults();

    for (let i=0; i<rounds; i++) {
  
      const message = `Progresso: ${(100 * i) / rounds}%`
      process.stdout.write(`\r` + message);
      this.play();
    }

    this.calcMeanTurns(rounds);
    this.calcMeanTime(rounds);

    return this.results;
  }

  public printResults(): void {

    console.log("");
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
      },

      meanTurns: 0,
      meanTime: 0
    }
  }

  // ============
  // Private
  // ============

  private play(): void {

    /* 
    Plays the game until termination, choosing the action based
    on the corresponding players agent, and updates the results
    */

    this.resetGame();
  
    while (!this.game.getTermination()) {

      let action = this.agentAction();
      this.game.playAction(action);
  
      if (this.print) {
        console.log("");
        this.game.printState();
      }

      this.turnsSum++;
    }

    this.updateResults();
  }

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

      case GameName.CONNECT_FOUR:
        this.game = new ConnectFour();
        break;

      case GameName.CHECKERS:
        this.game = new Checkers();
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

  private calcMeanTurns(rounds: number) {

    this.results.meanTurns = this.turnsSum / rounds;
  }

  private calcMeanTime(rounds: number) {

    const deltaTime = Date.now() - this.initialTime;
    const meanTime = (deltaTime / rounds) / 1000;

    this.results.meanTime = Math.round(meanTime * 100) / 100;
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
