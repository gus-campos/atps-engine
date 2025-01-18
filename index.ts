

// ===================================
// Autoplay
// ===================================

import { AutoPlay, Agent, GameName } from "src/shared/Autoplay";

const GAME_NAMES = Object.values(GameName);

let autoplay = new AutoPlay(
  {
    gameName: GameName.BOOP,
    agents: [Agent.MCTS, Agent.RANDOM],
    matches: 100
  },
  {
    genGraph: false,
    searchesTime: 500,
    maxPlayoutDepth: null
  },
  false
);

autoplay.playMultiple();
autoplay.printResults();
