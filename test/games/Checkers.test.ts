import { describe, it, beforeEach, expect } from "vitest";
import { Checkers } from "src/games/Checkers";
import { Coord } from "src/shared/Game";

// =================== TicTacToe ===================

describe("Checkers", () => {
  let checkers: Checkers;
  let model: Checkers;

  beforeEach(() => {
    checkers = new Checkers();
    model = new Checkers();
  });

  describe("constructor", () => {
    it("should gen the initial state", () => {
      
      model.setState(

        [
          [" ", "b", " ", "b", " ", "b", " ", "b"],
          ["b", " ", "b", " ", "b", " ", "b", " "],
          [" ", "b", " ", "b", " ", "b", " ", "b"],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          ["a", " ", "a", " ", "a", " ", "a", " "],
          [" ", "a", " ", "a", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [1,0]
      );

      expect(checkers).toEqual(model);
    });
  });

  describe("clone", () => {
    it("should return an exact copy of the game", () => {

      model.setState(

        [
          [" ", "b", " ", "b", " ", "b", " ", "b"],
          ["b", " ", "b", " ", "b", " ", "b", " "],
          [" ", "b", " ", "b", " ", "b", " ", "b"],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", "a", " ", " ", " ", " "],
          ["a", " ", " ", " ", "a", " ", "a", " "],
          [" ", "a", " ", "a", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [0,1]
      );

      checkers.playAction({ fromSlot: new Coord(2,2), toSlot: new Coord(3,3) });
      expect(checkers).toEqual(model);

    });
  });
  
  /* 
  describe("getValidActions", () => {
  
    it("should return all valid actions to a game in course", () => {
      
      //expect(checkers.getValidActions()).toHaveLength(7);
    });

    it("should return all valid actions to a won game", () => {

      model.setState(

        [
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          ["a", " ", "a", " ", "a", " ", "a", " "],
          [" ", "a", " ", "a", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [0,1]
      );

      //expect(model.getValidActions()).toHaveLength(0);

    });

    it("should return all valid actions to a won game", () => {

      model.setState(

        [
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", "b", " ", " ", " ", " "],
          ["b", " ", "a", " ", " ", " ", " ", " "],
          [" ", "a", " ", "a", " ", "a", " ", " "],
          [" ", " ", " ", " ", " ", " ", "a", " "],
          [" ", "a", " ", " ", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [1,0]
      );

      //expect(model.getValidActions()).toHaveLength(11);
    });
  });
  */

  describe("playAction", () => {

    it("should move a piece", () => {

      model.setState(

        [
          [" ", "b", " ", "b", " ", "b", " ", "b"],
          ["b", " ", "b", " ", "b", " ", "b", " "],
          [" ", "b", " ", "b", " ", "b", " ", "b"],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", "a", " ", " ", " ", " "],
          ["a", " ", " ", " ", "a", " ", "a", " "],
          [" ", "a", " ", "a", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [0,1]
      );

      checkers.playAction({ fromSlot: new Coord(2,2), toSlot: new Coord(3,3) });

      expect(checkers).toEqual(model);
    });
    
    it("should capture a piece", () => {

      model.setState(

        [
          [" ", "b", " ", "b", " ", "b", " ", "b"],
          ["b", " ", "b", " ", "b", " ", "b", " "],
          [" ", "b", " ", "b", " ", " ", " ", "b"],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", "a"],
          ["a", " ", "b", " ", "a", " ", " ", " "],
          [" ", "a", " ", "a", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [1,0]
      );

      checkers.playAction({ fromSlot: new Coord(2,2), toSlot: new Coord(3,3) });
      checkers.playAction({ fromSlot: new Coord(5,5), toSlot: new Coord(4,4) });
      checkers.playAction({ fromSlot: new Coord(6,2), toSlot: new Coord(7,3) });
      checkers.playAction({ fromSlot: new Coord(4,4), toSlot: new Coord(2,2) });

      expect(checkers).toEqual(model);
    });

    it("should allow king to move multiple units", () => {

      let game2 = new Checkers();
      game2.setState(

        [
          [" ", "b", " ", " ", " ", " ", " ", "A"],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          ["a", " ", " ", " ", "a", " ", "a", " "],
          [" ", "a", " ", "a", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [0,1]
      );

      let game1 = new Checkers();
      game1.setState(

        [
          [" ", "b", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          ["a", " ", "A", " ", "a", " ", "a", " "],
          [" ", "a", " ", "a", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [1,0]
      );

      game1.playAction({ fromSlot: new Coord(2,2), toSlot: new Coord(7,7) });
      expect(game1).toEqual(game2);
    });

    it("should allow king to capture jumping 2 units", () => {

      let game2 = new Checkers();
      game2.setState(

        [
          [" ", "b", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", "A", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          ["a", " ", " ", " ", "a", " ", "a", " "],
          [" ", "a", " ", "a", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [0,1]
      );

      let game1 = new Checkers();
      game1.setState(

        [
          [" ", "b", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", "b", " ", " ", " ", " "],
          ["a", " ", "A", " ", "a", " ", "a", " "],
          [" ", "a", " ", "a", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [1,0]
      );

      game1.playAction({ fromSlot: new Coord(2,2), toSlot: new Coord(4,4) });
      expect(game1).toEqual(game2);
    });

    it("should allow king to capture jumping multiple units", () => {

      let game2 = new Checkers();
      game2.setState(

        [
          [" ", "b", " ", " ", " ", " ", " ", "A"],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          ["a", " ", " ", " ", "a", " ", "a", " "],
          [" ", "a", " ", "a", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [0,1]
      );

      let game1 = new Checkers();
      game1.setState(

        [
          [" ", "b", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", "b", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          ["a", " ", "A", " ", "a", " ", "a", " "],
          [" ", "a", " ", "a", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [1,0]
      );

      game1.playAction({ fromSlot: new Coord(2,2), toSlot: new Coord(7,7) });
      expect(game1).toEqual(game2);
    });

    it("should not allow king to jump over more than 1 piece", () => {

      let checkers = new Checkers();
      checkers.setState(

        [
          [" ", "b", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", "b", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", "b", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          ["a", " ", "A", " ", "a", " ", "a", " "],
          [" ", "a", " ", "a", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [1,0]
      );

      const multiplePieceJump = () => checkers.playAction({ fromSlot: new Coord(2,2), toSlot: new Coord(7,7) });
      expect(multiplePieceJump).toThrowError();
    });

    it("should not allow man to move more than 1 unit", () => {

      const manMovingMoreThanOneUnit = () => checkers.playAction({ fromSlot: new Coord(2,2), toSlot: new Coord(4,4) });
      expect(manMovingMoreThanOneUnit).toThrowError();
    });

    it("should not allow to move not diagonally", () => {

      const notDiagonalMove = () => checkers.playAction({ fromSlot: new Coord(2,2), toSlot: new Coord(2,3) });
      expect(notDiagonalMove).toThrowError();
    });

    it("capturing last oponnent piece should end game", () => {

      model.setState(

        [
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", " ", " ", " ", " ", " ", " ", " "],
          [" ", "b", " ", " ", " ", " ", " ", " "],
          ["a", " ", "a", " ", "a", " ", "a", " "],
          [" ", "a", " ", "a", " ", "a", " ", "a"],
          ["a", " ", "a", " ", "a", " ", "a", " "],
        ],
  
        [1,0]
      );

      model.playAction({ fromSlot: new Coord(0,2), toSlot: new Coord(2,4) })
      expect(model.getTermination()).toBeTruthy();
      expect(model.getWinner()).toBe(0);

    });
  });
});
