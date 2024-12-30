import { describe, it, beforeEach, expect } from "vitest";
import { TicTacToe } from "src/games/TicTacToe";
import { Outcome } from "src/shared/GameTree";
import { NodeMCTS } from "src/agents/MCTS";

// =================== TicTacToe ===================

describe("NodeMCTS with ttt", () => {
  
  let ttt: TicTacToe;
  let root: NodeMCTS;

  beforeEach(() => {
    ttt = new TicTacToe();
    root = new NodeMCTS(null, ttt, null);
  });

  describe("simulate", () => {
    it("should return WIN for game won by current player", () => {
      ttt.playAction({ slot: 0, piece: { author: 0 } });
      ttt.playAction({ slot: 1, piece: { author: 1 } });
      ttt.playAction({ slot: 2, piece: { author: 0 } });

      ttt.playAction({ slot: 3, piece: { author: 1 } });
      ttt.playAction({ slot: 4, piece: { author: 0 } });
      ttt.playAction({ slot: 5, piece: { author: 1 } });

      ttt.playAction({ slot: 6, piece: { author: 1 } });
      ttt.playAction({ slot: 7, piece: { author: 0 } });

      // X O X
      // O X O
      // O X _

      let node = new NodeMCTS(null, ttt, null);
      let perspectivePlayer = ttt.getCurrentPlayer();

      // 0 vai jogar, e inevitavelmente ganhar
      // Espera-se valor favorável pro jogador atual: 1
      expect(node.simulate(perspectivePlayer)).toBe(Outcome.WIN);
    });

    it("should return LOSE for game won by opponent", () => {
      ttt.playAction({ slot: 0, piece: { author: 0 } });
      ttt.playAction({ slot: 1, piece: { author: 1 } });
      ttt.playAction({ slot: 2, piece: { author: 0 } });

      ttt.playAction({ slot: 3, piece: { author: 1 } });
      ttt.playAction({ slot: 4, piece: { author: 0 } });
      ttt.playAction({ slot: 5, piece: { author: 1 } });

      //
      ttt.playAction({ slot: 7, piece: { author: 0 } });
      //

      // X O X
      // O X O
      // _ X _

      let node = new NodeMCTS(null, ttt, null);
      let perspectivePlayer = ttt.getCurrentPlayer();

      // 1 vai jogar, pra depois 0 jogar e inevitavelmente ganhar
      // Espera-se valor desfavorável pro jogador atual: -1
      expect(node.simulate(perspectivePlayer)).toBe(Outcome.LOSE);
    });

    it("should return DRAW for drawn game", () => {
      ttt.playAction({ slot: 0, piece: { author: 0 } });
      ttt.playAction({ slot: 1, piece: { author: 1 } });
      ttt.playAction({ slot: 2, piece: { author: 0 } });
      ttt.playAction({ slot: 4, piece: { author: 1 } });
      ttt.playAction({ slot: 3, piece: { author: 0 } });
      ttt.playAction({ slot: 6, piece: { author: 1 } });
      ttt.playAction({ slot: 5, piece: { author: 0 } });
      ttt.playAction({ slot: 8, piece: { author: 1 } });

      // X O X
      // X O X
      // O _ O

      let node = new NodeMCTS(null, ttt, null);
      let perspectivePlayer = ttt.getCurrentPlayer();

      // Expect to draw
      expect(node.simulate(perspectivePlayer)).toBe(Outcome.DRAW);
    });
  });
});
