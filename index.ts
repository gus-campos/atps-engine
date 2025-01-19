

// ===================================
// Autoplay
// ===================================

import { MCTSConfig } from "src/agents/MCTS";
import { AutoPlay, AutoPlayConfig, Agent, GameName } from "src/shared/Autoplay";

const GAME_NAMES = Object.values(GameName);

for (let config of [

  {
    agents: [Agent.RANDOM, Agent.RANDOM],
    matches: 100_000,
    searchesTime: null
  },
  {
    agents: [Agent.MCTS, Agent.RANDOM],
    matches: 100,
    searchesTime: 1000
  },
  {
    agents: [Agent.MCTS, Agent.MCTS],
    matches: 10,
    searchesTime: 200
  },

]) {

  const autoPlayConfig: AutoPlayConfig = {
    
    agents: config.agents,
    matches: config.matches,
    printStates: false
  };
  
  const mctsConfig: MCTSConfig = {
    
    genGraph: false,
    searchesTime: config.searchesTime,
    searchesAmount: null,
    maxPlayoutDepth: null
  };
  
  AutoPlay.playGames([GameName.TIC_TAC_TOE], autoPlayConfig, mctsConfig);
}
