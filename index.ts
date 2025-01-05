

// ===================================
// Autoplay
// ===================================

import { AutoPlay, Agent, GameName } from "src/shared/Autoplay";

const GAME_NAMES = Object.values(GameName);

const autoplay = new AutoPlay(
  {
    gameName: GameName.TIC_TAC_TOE,
    agents: [Agent.RANDOM, Agent.RANDOM],
    matches: 100
  },
  {
    searchesTime: 1000,
    maxPlayoutDepth: null
  }
);

autoplay.playMultiple();
autoplay.printResults();
