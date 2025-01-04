import { describe, it, beforeEach, expect } from "vitest";
import { ConnectFour } from "src/games/ConnectFour";

// =================== TicTacToe ===================

describe("TicTacToe", () => {
  let cf: ConnectFour;
  let model: ConnectFour;

  beforeEach(() => {
    cf = new ConnectFour();
    model = new ConnectFour();
  });

  describe("clone", () => {
    it("should return an exact copy of game", () => {
      cf.playAction({ author: 0, column: 0 });
      cf.playAction({ author: 1, column: 1 });

      expect(cf.clone()).toEqual(cf);
    });
  });

  describe("getValidActions", () => {
    it("should return all valid actions to the empty game", () => {

      cf.setState(

        [
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", "."]
        ],
      
        [1, 0]
      );

      expect(cf.getValidActions()).toHaveLength(7);
    });

    it("should return all valid actions to a game in course", () => {
      
      cf.setState(

        [
          ["X", "O", ".", "X", ".", ".", "."],
          ["X", "O", ".", "X", ".", ".", "."],
          ["X", "O", ".", "X", ".", ".", "."],
          ["X", "X", ".", "X", ".", "O", "."],
          ["X", "O", "O", "X", ".", "O", "."],
          ["X", "X", "O", "X", "O", "O", "."]
        ],
      
        [1, 0]
      );

      expect(cf.getValidActions()).toHaveLength(4);
    });

    it("should return all valid actions to a drawn game", () => {

      cf.setState(

        [
          ["X", "O", "X", "O", "X", "O", "X"],
          ["X", "O", "X", "O", "X", "O", "X"],
          ["X", "O", "X", "O", "X", "O", "X"],
          ["X", "O", "X", "O", "X", "O", "X"],
          ["X", "O", "X", "O", "X", "O", "X"],
          ["X", "O", "X", "O", "X", "O", "X"]
        ],
      
        [1, 0]
      );

      expect(cf.getValidActions()).toHaveLength(0);

    });

    it("should return all valid actions to a won game", () => {

      cf.setState(

        [
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", "."],
          ["O", ".", ".", ".", ".", ".", "."],
          ["X", "O", ".", ".", ".", ".", "."],
          ["O", "O", "O", ".", ".", ".", "."],
          ["X", "X", "X", "O", ".", ".", "."]
        ],
      
        [1, 0]
      );

      expect(cf.getValidActions()).toHaveLength(0);
    });
  });

  // Deve

  describe("playAction", () => {
    it("should update the board with the pieces placed in the desired column", () => {
      
      cf.playAction({ author: 0, column: 4 });

      model.setState(

        [
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", "X", ".", "."]
        ],
      
        [0, 1]
      );

      expect(cf).toEqual(model);

    });

    it("should stack pieces", () => {

      cf.playAction({ author: 0, column: 4 });
      cf.playAction({ author: 1, column: 4 });
      cf.playAction({ author: 0, column: 4 });
      cf.playAction({ author: 1, column: 4 });
      cf.playAction({ author: 0, column: 4 });

      cf.playAction({ author: 1, column: 2 });
      cf.playAction({ author: 0, column: 2 });
      cf.playAction({ author: 1, column: 2 });

      model.setState(

        [
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", "X", ".", "."],
          [".", ".", ".", ".", "O", ".", "."],
          [".", ".", "O", ".", "X", ".", "."],
          [".", ".", "X", ".", "O", ".", "."],
          [".", ".", "O", ".", "X", ".", "."]
        ],
      
        [1, 0]
      );

      expect(cf).toEqual(model);
      
    });

    it("player to complete row should win", () => {

      cf.playAction({ author: 0, column: 4 });
      cf.playAction({ author: 1, column: 4 });
      cf.playAction({ author: 0, column: 4 });
      cf.playAction({ author: 1, column: 4 });

      cf.playAction({ author: 0, column: 6 });

      cf.playAction({ author: 1, column: 3 });
      cf.playAction({ author: 0, column: 3 });
      cf.playAction({ author: 1, column: 3 });

      
      cf.playAction({ author: 0, column: 2 });
      cf.playAction({ author: 1, column: 2 });
      
      cf.playAction({ author: 0, column: 6 });

      cf.playAction({ author: 1, column: 1 });

      model.setState(

        [
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", "O", ".", "."],
          [".", ".", ".", "O", "X", ".", "."],
          [".", ".", "O", "X", "O", ".", "X"],
          [".", "O", "X", "O", "X", ".", "X"]
        ],
      
        [1, 0]
      );

      expect(cf).toEqual(model);
      expect(cf.getTermination()).toBeTruthy();
      expect(cf.getWinner()).toBe(1);

    });

    it("should update the termination and winner to a drawn game", () => {

      cf.setState(

        [
          ["X", "O", "X", "O", "X", "O", "X"],
          ["X", "O", "X", "O", "X", "O", "X"],
          ["X", "O", "X", "O", "X", "O", "X"],
          ["X", "O", "X", "O", "X", "O", "X"],
          ["X", "O", "X", "O", "X", "O", "X"],
          ["X", "O", "X", "O", "X", "O", "X"]
        ],
      
        [1, 0]
      );

      expect(cf.getTermination()).toBeTruthy();
      expect(cf.getWinner()).toBe(null);
    });
  });
});
