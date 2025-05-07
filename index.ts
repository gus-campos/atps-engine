
const args = process.argv;

// ===================================
// Autoplay
// ===================================


import { Agent } from "src/shared/Agent";

import { MCTSConfig } from "src/agents/MCTSAgent";
import { AutoPlay, AutoPlayConfig, AgentName, GameName } from "src/shared/Autoplay";
const GAME_NAMES = Object.values(GameName);


for (let config of [
  
  {
    agents: [AgentName.MCTS, AgentName.RANDOM],
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
