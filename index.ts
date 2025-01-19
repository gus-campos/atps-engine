

// ===================================
// Autoplay
// ===================================

import { AutoPlay, Agent, GameName } from "src/shared/Autoplay";

const GAME_NAMES = Object.values(GameName);

function playGamesA(gameNames: GameName[]) {

  for (let gameName of gameNames) {

    
    let autoplay = new AutoPlay(

      gameName,

      {
        agents: [Agent.MCTS, Agent.RANDOM],
        matches: 1000,
        printStates: false
      },
      {
        genGraph: false,
        searchesTime: 1000,
        searchesAmount: null,
        maxPlayoutDepth: null
      },
    );
    
    autoplay.playMultiple();
    autoplay.printResults();
  }
}

function playGamesB(gameNames: GameName[]) {

  for (let gameName of gameNames) {

    
    let autoplay = new AutoPlay(

      gameName,

      {
        agents: [Agent.MCTS, Agent.MCTS],
        matches: 1000,
        printStates: false
      },
      {
        genGraph: false,
        searchesTime: 1000,
        searchesAmount: null,
        maxPlayoutDepth: null
      },
    );
    
    autoplay.playMultiple();
    autoplay.printResults();
  }
}

playGamesA([GameName.CONNECT_FOUR, GameName.BOOP, GameName.CHECKERS]);
playGamesB(GAME_NAMES);
