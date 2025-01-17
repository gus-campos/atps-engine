

// ===================================
// Autoplay
// ===================================

import { AutoPlay, Agent, GameName } from "src/shared/Autoplay";

const GAME_NAMES = Object.values(GameName);

const autoplay = new AutoPlay(
  {
    gameName: GameName.TIC_TAC_TOE,
    agents: [Agent.MCTS, Agent.MCTS],
    matches: 1
  },
  {
    searchesTime: 1000,
    maxPlayoutDepth: null
  },
  true
);

autoplay.playMultiple();
autoplay.printResults();
