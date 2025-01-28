
const args = process.argv;

// ===================================
// Autoplay
// ===================================

import { MCTSConfig } from "src/agents/MCTS";
import { AutoPlay, AutoPlayConfig, Agent, GameName } from "src/shared/Autoplay";
/*
const GAME_NAMES = Object.values(GameName);


for (let config of [
  
  {
    agents: [Agent.MCTS, Agent.RANDOM],
    matches: 500,
    searchesTime: 1000 / 2048
  },
]) {

  const autoPlayConfig: AutoPlayConfig = {
    
    agents: config.agents,
    matches: config.matches,
    printStates: false
  };
  
  const mctsConfig: MCTSConfig = {
    
    genGraph: false,
    maxDepthPrinted: null,
    searchesTime: config.searchesTime,
    searchesAmount: null,
    maxPlayoutDepth: null
  };

  AutoPlay.playGames(GAME_NAMES, autoPlayConfig, mctsConfig, args[2]);
}
*/

const autoPlayConfig: AutoPlayConfig = {
    
  agents: [Agent.MCTS, Agent.MCTS],
  matches: 10,
  printStates: false
};

const mctsConfig: MCTSConfig = {
    
  genGraph: true,
  maxDepthPrinted: 10,
  searchesTime: 1000,
  searchesAmount: null,
  maxPlayoutDepth: null
};


AutoPlay.playGames([GameName.CRAB_PUZZLE], autoPlayConfig, mctsConfig, "1");
