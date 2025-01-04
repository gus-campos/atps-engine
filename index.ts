

// ===================================
// Autoplay
// ===================================

import { AutoPlay, Agent, GameName } from "src/shared/Autoplay";

let autoplay = new AutoPlay(GameName.CHECKERS, [Agent.RANDOM, Agent.RANDOM], true);
autoplay.playMultiple(100);
autoplay.printResults();


// ===================================
// AlphaZero
// ===================================
