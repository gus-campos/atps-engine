// =========================================================

import { Action, Game } from "src/shared/Game";
import { MCTSAgent, MCTSConfig, MCTSStats } from "src/agents/MCTSAgent";
import { RandomAgent } from "src/agents/RandomAgent";

import { writeObject } from "src/utils/Write";

import NoActionsAvailable from "./NoActionsAvailable";

// =========================================================

export interface AutoPlayConfig {
  /* Configurações do AutoPlay */

  // O agente que vai jogar por cada player.
  // Exemplo: MCTS jogando player 1, RANDOM jogando pro player 2: [AgentName.MCTS, AgentName.RANDOM]
  agents: AgentName[];

  // Número de partidas jogadas
  matches: number;

  // Se os estados do jogo devem ser impressos a cada turno
  printStates: boolean;
}

interface Score {
  /*
  Player 0 is always the maximizing player. So "victory" 
  means player 0 won, and a favorable own goal means a 
  own goal favorable to player 0.
  */

  victories: number;
  defeats: number;
  draws: number;
}

interface OwnGoals {
  /* 
  Times a player caused a victory for the other player,
  causing its own defeat.
  
  Player 0 is always the maximizing player, 
  so favorable means that a own goal favorable to player 0 has
  been made.
  */

  unfavorable: number;
  favorable: number;
}

interface Results {
  /* 
  Um wrapper dos diferentes objetos de resultados
  */

  score: Score;
  ownGoals: OwnGoals;
  meanTurns: number;
  meanMatchTime: number;
  meanTurnTime: number;
}

export enum AgentName {
  MCTS = "MCTS",
  RANDOM = "Random",
}

export class AutoPlay {
  /* Classe que dado um nome de jogo e dada algumas configurações
  executa um jogo do início ao fim, diversas vezes, usando os
  agentes especificados */

  private game: Game;

  private meanMctsStats: MCTSStats;

  private results: Results;
  private turnsSum: number;
  private mctsTurnsSum: number;
  private initialTime: number;

  constructor(
    private readonly gameFactory: () => Game,
    private readonly autoPlayConfig: AutoPlayConfig,
    private readonly mctsConfig: MCTSConfig,
  ) {
    this.game = gameFactory();

    this.mctsTurnsSum = 0;

    this.turnsSum = 0;
    this.initialTime = Date.now();

    this.resetResults();
    this.resetGame();
  }

  public static playGames(
    gameFactories: (() => Game)[],
    autoPlayConfig: AutoPlayConfig,
    mctsConfig: MCTSConfig,
    id: string = null,
  ): void {
    /*
    Joga automaticamente diversos jogos passados como parâmetro em array,
    todos com a mesma configuração, e escreve os resultados em arquivos.
    Um id pode ser passado, para ser acrescentado ao nome do arquivo, 
    permitindo diferenciar simulações feitas com diferentes configurações.
    */

    for (let gameFactory of gameFactories) {
      let autoplay = new AutoPlay(gameFactory, autoPlayConfig, mctsConfig);

      autoplay.printAutoPlayConfig();
      autoplay.printMCTSConfig();

      autoplay.playMultiple();
      const agents = autoplay.autoPlayConfig.agents;

      id = id == null ? "0" : id;
      const path = `data/${autoplay.gameName}-${agents.join("-")}-${id}.json`;

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

    if (this.autoPlayConfig.matches == 0) return;

    this.resetResults();

    for (let i = 0; i < this.autoPlayConfig.matches; i++) {
      this.play();
      this.logProgress(i);
    }

    this.calcMeanTurns();
    this.calcMeanTimes();
    this.calcMeanMctsStats();
  }

  public writeResults(dir: string): void {
    /* Escreve os resultados do autoplay em um 
    diretório passado */

    const obj = [
      { gameName: this.gameName },
      this.autoPlayConfig,
      this.mctsConfig,
      this.results,
      this.meanMctsStats,
    ];

    writeObject(obj, dir);
  }

  public printResults(): void {
    /* Imprime no console os resultados em um formato
    legível. */

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

  get gameName(): string {
    return this.game.name;
  }

  // ============
  // Private
  // ============

  private resetResults(): void {
    /*
    (Re) initializes the results properties, with all
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
        unfavorable: 0,
      },

      meanTurns: 0,
      meanMatchTime: 0,
      meanTurnTime: 0,
    };

    this.meanMctsStats = {
      searchesAmount: 0,
      nodesAmount: 0,
      maxDepth: 0,
    };

    this.mctsTurnsSum = 0;
  }

  private play(): void {
    /* 
    Plays the game until termination, choosing the action based
    on the corresponding players agent, and updates the results
    */

    this.resetGame();

    while (!this.game.isGameOver()) {
      // Gerando ação e verificando externamente o empate por falta de ações

      try {
        const action = this.agentAction();
        this.game.playAction(action, true);
      } catch (error) {
        if (error instanceof NoActionsAvailable) {
          this.game.forceDraw();
          break;
        } else {
          throw error;
        }
      }

      if (this.autoPlayConfig.printStates) this.printState();

      this.turnsSum++;
    }

    this.updateResults();
  }

  private printState(): void {
    /* Imprime o estado do jogo jogado. */

    console.log("");
    this.game.printState();
  }

  private logProgress(i: number): void {
    /* Chamado sempre, imprime quantos porcento das partidas
    solicitadas foram jogadas, de 10 em 10%. */

    // De 10 em 10%
    if (i % (this.autoPlayConfig.matches / 10) == 0) {
      const message = `Progresso: ${(100 * i) / this.autoPlayConfig.matches}%`;
      console.log(message);
    }
  }

  private printMCTSConfig(): void {
    /* Imprime as configutações do agente MCTS. */

    console.log(this.mctsConfig);
    console.log();
  }

  private printAutoPlayConfig(): void {
    /* Imprime as configutações do autoplay. */

    console.log(this.gameName);
    console.log();
    console.log(this.autoPlayConfig);
    console.log();
  }

  private agentAction(): Action {
    /*
    Chooses next action based on the current players agent.
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
    Calls the corresponding generator to generate a game
    with a initial state.
    */

    this.game = this.gameFactory();
  }

  private mctsAction(): Action {
    /* Usando o agente MCTS, retorna a próxima ação para o jogo
    nem seu estado atual */

    let mcts = new MCTSAgent(this.game, this.mctsConfig);
    const action = mcts.nextAction();

    const mctsStats = mcts.getStats();
    this.updateMctsStats(mctsStats);

    return action;
  }

  private randomAction(): Action {
    /* Usando o agente Random. retorna a próxima ação para o jogo
    nem seu estado atual */

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
    /* Atualiza as estatísticas do agente MCTS. */

    this.mctsTurnsSum++;
    this.meanMctsStats.searchesAmount += mctsStats.searchesAmount;
    this.meanMctsStats.maxDepth += mctsStats.maxDepth;
    this.meanMctsStats.nodesAmount += mctsStats.nodesAmount;
  }

  private calcMeanTurns() {
    /* 
    Chamado ao final das múltiplas jogadas, calcula
    a quantidade média de turnos por jogo. 
    */

    this.results.meanTurns = this.turnsSum / this.autoPlayConfig.matches;
  }

  private calcMeanTimes(): void {
    /*
    Chamado ao final das múltiplas jogadas, calcula
    a média de tempo por jogo. 
    */

    const deltaTime = Date.now() - this.initialTime;
    const meanMatchTime = deltaTime / this.autoPlayConfig.matches;
    const meanTurnTime = deltaTime / this.turnsSum;

    this.results.meanTurnTime = Math.round(meanTurnTime * 1000) / 1000;
    this.results.meanMatchTime = Math.round(meanMatchTime * 1000) / 1000;
  }

  private calcMeanMctsStats() {
    /*
    Chamado ao final das múltiplas jogadas, calcula
    a média das estatísticas do MCTS por jogo. 
    */

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

    if (winner == 0) this.results.score.victories++;
    else if (winner == 1) this.results.score.defeats++;
    else this.results.score.draws++;
  }

  private updateOwnGoals() {
    /*
    Updates score and own goals, player 0 is always the maximizing 
    player. So favorable own goal means a own goal favorable
    to player 0.
    */

    const winner = this.game.getWinner();
    const lastPlayer = this.game.getLastPlayer();

    if (winner != null && winner != lastPlayer) {
      if (winner == 0) this.results.ownGoals.favorable++;
      else this.results.ownGoals.unfavorable++;
    }
  }
}

// =========================================================
