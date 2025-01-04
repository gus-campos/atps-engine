

// ===================================
// Autoplay
// ===================================

import { AutoPlay, Agent, GameName } from "src/shared/Autoplay";

let autoplay = new AutoPlay(GameName.CHECKERS, [Agent.RANDOM, Agent.RANDOM], true);
autoplay.playMultiple(1);
autoplay.printResults();


// ===================================
// AlphaZero
// ===================================
