

// ===================================
// Autoplay
// ===================================

import { AutoPlay, Agent, GameName } from "src/shared/Autoplay";

const GAME_NAMES = Object.values(GameName);

function playGames(gameNames: GameName[]) {

  for (let gameName of GAME_NAMES) {

    
    let autoplay = new AutoPlay(
      {
        gameName: gameName,
        agents: [Agent.RANDOM, Agent.RANDOM],
        matches: 1000
      },
      {
        genGraph: false,
        searchesTime: 1000,
        searchesAmount: null,
        maxPlayoutDepth: null
      },
      false
    );
    
    autoplay.playMultiple();
    autoplay.printResults();
  }
}

playGames(GAME_NAMES);
