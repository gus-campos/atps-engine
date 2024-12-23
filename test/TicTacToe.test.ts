import { describe, it, beforeEach, expect } from "vitest";
import { TicTacToe, TicTacToeAction, TicTacToeBoard } from "../src/TicTacToe";

// =================== TicTacToe ===================

describe("TicTacToe", () => {
  let ttt: TicTacToe;

  beforeEach(() => {
    ttt = new TicTacToe();
  });

  describe("clone", () => {
    it("should return an exact copy of game", () => {
      ttt.playAction({ slot: 0, piece: { author: 1 } });
      ttt.playAction({ slot: 1, piece: { author: 0 } });

      expect(ttt.clone()).toEqual(ttt);
    });
  });

  describe("getValidActions", () => {
    it("should return all valid actions to the empty game", () => {
      // _ _ _
      // _ _ _
      // _ _ _

      let validActionsModel: TicTacToeAction[] = [
        { slot: 0, piece: { author: 0 } },
        { slot: 1, piece: { author: 0 } },
        { slot: 2, piece: { author: 0 } },
        { slot: 3, piece: { author: 0 } },
        { slot: 4, piece: { author: 0 } },
        { slot: 5, piece: { author: 0 } },
        { slot: 6, piece: { author: 0 } },
        { slot: 7, piece: { author: 0 } },
        { slot: 8, piece: { author: 0 } },
      ];

      expect(validActionsModel).toEqual(ttt.getValidActions());
    });

    it("should return all valid actions to a game in course", () => {
      ttt.playAction({ slot: 0, piece: { author: 0 } });
      ttt.playAction({ slot: 1, piece: { author: 1 } });
      ttt.playAction({ slot: 2, piece: { author: 0 } });
      ttt.playAction({ slot: 3, piece: { author: 1 } });
      ttt.playAction({ slot: 4, piece: { author: 0 } });

      // X O X
      // O X _
      // _ _ _

      let validActionsModel: TicTacToeAction[] = [
        { slot: 5, piece: { author: 1 } },
        { slot: 6, piece: { author: 1 } },
        { slot: 7, piece: { author: 1 } },
        { slot: 8, piece: { author: 1 } },
      ];

      expect(validActionsModel).toEqual(ttt.getValidActions());
    });

    it("should return all valid actions to a drawn game", () => {
      ttt.playAction({ slot: 0, piece: { author: 0 } });
      ttt.playAction({ slot: 1, piece: { author: 1 } });
      ttt.playAction({ slot: 2, piece: { author: 0 } });

      ttt.playAction({ slot: 3, piece: { author: 1 } });
      ttt.playAction({ slot: 4, piece: { author: 0 } });
      ttt.playAction({ slot: 5, piece: { author: 1 } });

      ttt.playAction({ slot: 6, piece: { author: 1 } });
      ttt.playAction({ slot: 7, piece: { author: 0 } });
      ttt.playAction({ slot: 8, piece: { author: 1 } });

      // X O X
      // O X O
      // O X O

      let validActionsModel: TicTacToeAction[] = [];

      expect(validActionsModel).toEqual(ttt.getValidActions());
    });

    it("should return all valid actions to a won game", () => {
      ttt.playAction({ slot: 0, piece: { author: 0 } });
      ttt.playAction({ slot: 1, piece: { author: 1 } });

      ttt.playAction({ slot: 4, piece: { author: 0 } });
      ttt.playAction({ slot: 5, piece: { author: 1 } });

      ttt.playAction({ slot: 8, piece: { author: 0 } });

      // X O _
      // _ X O
      // _ _ X

      let validActionsModel: TicTacToeAction[] = [];

      expect(validActionsModel).toEqual(ttt.getValidActions());
    });
  });

  // Deve

  describe("playAction", () => {
    it("should update the board with the pieces placed in the desired slots", () => {
      ttt.playAction({ slot: 0, piece: { author: 0 } });
      ttt.playAction({ slot: 1, piece: { author: 1 } });
      ttt.playAction({ slot: 2, piece: { author: 0 } });
      ttt.playAction({ slot: 3, piece: { author: 1 } });
      ttt.playAction({ slot: 4, piece: { author: 0 } });

      // X O X
      // O X _
      // _ _ _

      let boardModel: TicTacToeBoard = {
        slots: [
          { author: 0 },
          { author: 1 },
          { author: 0 },
          { author: 1 },
          { author: 0 },
          null,
          null,
          null,
          null,
        ],
      };

      expect(ttt.getState().board).toEqual(boardModel);
    });

    it("should update the current and last players accordingly", () => {
      expect(ttt.getState().currentPlayer).toEqual(0);
      expect(ttt.getState().lastPlayer).toBe(1);

      ttt.playAction({ slot: 0, piece: { author: 0 } });
      expect(ttt.getState().currentPlayer).toBe(1);
      expect(ttt.getState().lastPlayer).toBe(0);

      ttt.playAction({ slot: 1, piece: { author: 1 } });
      expect(ttt.getState().currentPlayer).toBe(0);
      expect(ttt.getState().lastPlayer).toBe(1);

      ttt.playAction({ slot: 2, piece: { author: 0 } });
      expect(ttt.getState().currentPlayer).toBe(1);
      expect(ttt.getState().lastPlayer).toBe(0);

      ttt.playAction({ slot: 3, piece: { author: 1 } });
      expect(ttt.getState().currentPlayer).toBe(0);
      expect(ttt.getState().lastPlayer).toBe(1);

      ttt.playAction({ slot: 4, piece: { author: 0 } });
      expect(ttt.getState().currentPlayer).toBe(1);
      expect(ttt.getState().lastPlayer).toBe(0);
    });

    it("should update the termination and winner to a game in progress", () => {
      ttt.playAction({ slot: 0, piece: { author: 0 } });
      ttt.playAction({ slot: 1, piece: { author: 1 } });
      ttt.playAction({ slot: 2, piece: { author: 0 } });
      ttt.playAction({ slot: 3, piece: { author: 1 } });
      ttt.playAction({ slot: 4, piece: { author: 0 } });

      // X O X
      // O X _
      // _ _ _

      expect(ttt.getState().terminated).toBeFalsy();
      expect(ttt.getWinner()).toBe(null);
    });

    it("should update the termination and winner to a drawn game", () => {
      ttt.playAction({ slot: 0, piece: { author: 0 } });
      ttt.playAction({ slot: 1, piece: { author: 1 } });
      ttt.playAction({ slot: 2, piece: { author: 0 } });

      ttt.playAction({ slot: 3, piece: { author: 1 } });
      ttt.playAction({ slot: 4, piece: { author: 0 } });
      ttt.playAction({ slot: 5, piece: { author: 1 } });

      ttt.playAction({ slot: 6, piece: { author: 1 } });
      ttt.playAction({ slot: 7, piece: { author: 0 } });
      ttt.playAction({ slot: 8, piece: { author: 1 } });

      // X O X
      // O X O
      // O X O

      expect(ttt.getState().terminated).toBeTruthy();
      expect(ttt.getWinner()).toBe(null);
    });

    it("should update the termination and winner to a won game", () => {
      ttt.playAction({ slot: 0, piece: { author: 0 } });
      ttt.playAction({ slot: 1, piece: { author: 1 } });

      ttt.playAction({ slot: 4, piece: { author: 0 } });
      ttt.playAction({ slot: 5, piece: { author: 1 } });

      ttt.playAction({ slot: 8, piece: { author: 0 } });

      // X O _
      // _ X O
      // _ _ X

      expect(ttt.getState().terminated).toBeTruthy();
      expect(ttt.getWinner()).toBe(0);
    });
  });
});
