

// ===================================
// Autoplay
// ===================================

import { AutoPlay, Agent, GameName } from "src/shared/Autoplay";

const GAME_NAMES = Object.values(GameName);

let autoplay = new AutoPlay(
  {
    gameName: GameName.GOBLET_GOBBLERS,
    agents: [Agent.MCTS, Agent.MCTS],
    matches: 10
  },
  {
    searchesTime: 500,
    maxPlayoutDepth: null
  },
  false
);

autoplay.playMultiple();
autoplay.printResults();
