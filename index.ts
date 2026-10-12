const args = process.argv;

// ===================================
// Autoplay
// ===================================

import { MCTSConfig } from "src/agents/MCTSAgent";
import { Boop } from "src/games/Boop";
import { Checkers } from "src/games/Checkers";
import { ConnectFour } from "src/games/ConnectFour";
import { GobbletGobblers } from "src/games/GobbletGobblers";
import { TicTacToe } from "src/games/TicTacToe";
import { AutoPlay, AutoPlayConfig, AgentName } from "src/shared/Autoplay";

const gameFactories = [
  () => new TicTacToe(),
  () => new ConnectFour(),
  () => new GobbletGobblers(),
  () => new Boop(),
  () => new Checkers(),
];

for (let config of [
  {
    agents: [AgentName.RANDOM, AgentName.RANDOM],
    matches: 100,
    searchesTime: 1000 / 128,
  },
  {
    agents: [AgentName.MCTS, AgentName.RANDOM],
    matches: 100,
    searchesTime: 1000 / 128,
  },
  {
    agents: [AgentName.MCTS, AgentName.MCTS],
    matches: 100,
    searchesTime: 1000 / 128,
  },
]) {
  const autoPlayConfig: AutoPlayConfig = {
    agents: config.agents,
    matches: config.matches,
    printStates: false,
  };

  const mctsConfig: MCTSConfig = {
    genGraph: false,
    maxDepthPrinted: null,
    searchesTime: config.searchesTime,
    searchesAmount: null,
    maxPlayoutDepth: null,
  };

  AutoPlay.playGames(gameFactories, autoPlayConfig, mctsConfig, args[2]);
}

/*
const autoPlayConfig: AutoPlayConfig = {
    
  agents: [AgentName.RANDOM, AgentName.RANDOM],
  matches: 100000,
  printStates: true
};

const mctsConfig: MCTSConfig = {
    
  genGraph: true,
  maxDepthPrinted: 10,
  searchesTime: 100,
  searchesAmount: null,
  maxPlayoutDepth: null
};

AutoPlay.playGames([GameName.TIC_TAC_TOE], autoPlayConfig, mctsConfig, args[2]);
AutoPlay.playGames([GameName.CONNECT_FOUR], autoPlayConfig, mctsConfig, args[2]);
*/
