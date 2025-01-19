

// ===================================
// Autoplay
// ===================================

import { MCTSConfig } from "src/agents/MCTS";
import { AutoPlay, AutoPlayConfig, Agent, GameName } from "src/shared/Autoplay";

const GAME_NAMES = Object.values(GameName);

for (let config of [
  
  {
    agents: [Agent.RANDOM, Agent.RANDOM],
    matches: 1,
    searchesTime: null
  },
  {
    agents: [Agent.MCTS, Agent.RANDOM],
    matches: 0,
    searchesTime: 1000
  },
  {
    agents: [Agent.MCTS, Agent.MCTS],
    matches: 0,
    searchesTime: 2000
  },

]) {

  const autoPlayConfig: AutoPlayConfig = {
    
    agents: config.agents,
    matches: config.matches,
    printStates: true
  };
  
  const mctsConfig: MCTSConfig = {
    
    genGraph: false,
    maxDepthPrinted: 3,
    searchesTime: config.searchesTime,
    searchesAmount: null,
    maxPlayoutDepth: null
  };
  
  AutoPlay.playGames([GameName.CHECKERS], autoPlayConfig, mctsConfig);
}
