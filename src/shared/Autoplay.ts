// =========================================================

import { Action, Game } from "src/shared/Game";
import { MCTSAgent, MCTSConfig, MCTSStats } from "src/agents/MCTSAgent";
import { RandomAgent } from "src/agents/RandomAgent";

import { TicTacToe } from "src/games/TicTacToe";
import { GobbletGobblers } from "src/games/GobbletGobblers";
import { Boop } from "src/games/Boop";
import { ConnectFour } from "src/games/ConnectFour";
import { Checkers } from "src/games/Checkers";

import { writeObject } from "src/utils/Write";
import { CrabPuzzle } from "src/games/CrabPuzzle";


// =========================================================

export interface AutoPlayConfig {

  agents: AgentName[],
  matches: number,
  printStates: boolean
}

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
  meanMatchTime: number,
  meanTurnTime: number
}

export enum GameName {
  TIC_TAC_TOE = "Tic Tac Toe",
  GOBLET_GOBBLERS = "Gobblets Gobblers",
  CONNECT_FOUR = "Connect Four",
  BOOP = "Boop",
  CHECKERS = "Checkers",
  CRAB_PUZZLE = "Crab Puzzle"
}

export enum AgentName {
  MCTS = "MCTS",
  RANDOM = "Random"
}

export class NoValidActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoValidActionError";
  }
}

export class AutoPlay {

  private gameName: GameName
  private autoPlayConfig: AutoPlayConfig;
  private mctsConfig: MCTSConfig;
  private meanMctsStats: MCTSStats;

  private game: Game;
  private results: Results;
  private turnsSum: number;
  private mctsTurnsSum: number;
  private initialTime: number;

  constructor(gameName: GameName, autoPlayConfig: AutoPlayConfig, mctsConfig: MCTSConfig) {
    
    this.gameName = gameName;
    this.autoPlayConfig = autoPlayConfig;
    this.mctsConfig = mctsConfig;
    this.mctsTurnsSum = 0;
    
    this.turnsSum = 0;
    this.initialTime = Date.now();

    this.resetResults();
    this.resetGame();
  }

  public static playGames(gameNames: GameName[], autoPlayConfig: AutoPlayConfig, mctsConfig: MCTSConfig, id: string=null): void {

    for (let gameName of gameNames) {
      
      let autoplay = new AutoPlay(gameName, autoPlayConfig, mctsConfig);
      
      autoplay.printAutoPlayConfig();
      autoplay.printMCTSConfig();

      autoplay.playMultiple();
      const agents = autoplay.autoPlayConfig.agents;
      

      id = id == null ? "0" : id;
      const path = `data/${gameName}-${agents.join("-")}-${id}.json`

      autoplay.writeResults(path);
    }
  }


  // ============
  // Public
  // ============

  public playMultiple(): void {

    /*
    Plays multiple games, until termination, updating the results
    */

    if (this.autoPlayConfig.matches == 0)
      return;

    this.resetResults();

    for (let i=0; i<this.autoPlayConfig.matches; i++) {
  
      this.play();
      this.logProgress(i);
    }

    this.calcMeanTurns();
    this.calcMeanTimes();
    this.calcMeanMctsStats();
  }

  public writeResults(dir: string): void {

    const obj = [

      { gameName : this.gameName }, 
      this.autoPlayConfig, 
      this.mctsConfig, 
      this.results, 
      this.meanMctsStats
  
    ]

    writeObject(obj, dir);
  }

  public printResults(): void {

    if (this.autoPlayConfig.matches == 0) {

      console.log("No matches played");
      return;
    }

    console.log();
    console.log(this.results);
    console.log();

    if (this.autoPlayConfig.agents.includes(AgentName.MCTS)) {
      
      console.log("Mean: ", this.meanMctsStats);
      console.log();
    }
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
      meanMatchTime: 0,
      meanTurnTime: 0
    }

    this.meanMctsStats = {

      searchesAmount: 0,
      nodesAmount: 0,
      maxDepth: 0,
    }

    this.mctsTurnsSum = 0;
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
  
    while (!this.game.isGameOver()) {
      
      // Gerando ação e verificando externamente o empate por falta de ações
      

      const action = this.agentAction();

      if (action == null) {
        
        this.game.forceDraw();
        break;
      }

      this.game.playAction(action, true);
      
      if (this.autoPlayConfig.printStates)
        this.printState();

      this.turnsSum++;
    }

    this.updateResults();
  }

  private printState(): void {

     
    console.log("");
    this.game.printState();
    
  }

  private logProgress(i: number): void {

    // De 10 em 10%
    if (i % (this.autoPlayConfig.matches/10) == 0) { 
      
      //this.printResults();
      const message = `Progresso: ${(100 * i) / this.autoPlayConfig.matches}%`

      console.log(message);
    }
  }

  private printMCTSConfig(): void {

    console.log(this.mctsConfig);
    console.log();
  }

  private printAutoPlayConfig(): void {

    console.log(this.gameName);
    console.log();
    console.log(this.autoPlayConfig);
    console.log();
  }

  private agentAction(): Action {

    /*
    Chooses next action based on the players agent
    */

    const currentPlayer = this.game.getCurrentPlayer();
    const agent = this.autoPlayConfig.agents[currentPlayer];

    switch (agent) {

      case AgentName.RANDOM:
        return this.randomAction();
      
      case AgentName.MCTS:
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

      case GameName.CRAB_PUZZLE:
        this.game = new CrabPuzzle();
        break;

      default:
        throw new Error("Invalid game name");
    }
  }

  private mctsAction(): Action {

    let mcts = new MCTSAgent(this.game, this.mctsConfig);
    const action = mcts.nextAction();

    const mctsStats = mcts.getStats();
    this.updateMctsStats(mctsStats);
    
    return action;
  }

  private randomAction(): Action {

    const randomAgent = new RandomAgent(this.game);
    return randomAgent.nextAction();
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

  private updateMctsStats(mctsStats: MCTSStats): void {

    this.mctsTurnsSum++;
    this.meanMctsStats.searchesAmount += mctsStats.searchesAmount;
    this.meanMctsStats.maxDepth += mctsStats.maxDepth;
    this.meanMctsStats.nodesAmount += mctsStats.nodesAmount;
  }

  private calcMeanTurns() {

    this.results.meanTurns = this.turnsSum / this.autoPlayConfig.matches;
  }

  private calcMeanTimes(): void {

    const deltaTime = Date.now() - this.initialTime;
    const meanMatchTime = (deltaTime / this.autoPlayConfig.matches);
    const meanTurnTime = (deltaTime / this.turnsSum);

    this.results.meanTurnTime = Math.round(meanTurnTime * 1000) / 1000;
    this.results.meanMatchTime = Math.round(meanMatchTime * 1000) / 1000;
  }

  private calcMeanMctsStats() {

    const turnsSum = this.mctsTurnsSum;

    this.meanMctsStats.maxDepth /= turnsSum;
    this.meanMctsStats.nodesAmount /= turnsSum;
    this.meanMctsStats.searchesAmount /= turnsSum;   
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
