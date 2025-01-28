import { describe, it, beforeEach, expect } from "vitest";
import { GobbletGobblers } from "src/games/GobbletGobblers";

// =================== TicTacToe ===================

describe("GobbletGobblers", () => {
  let gg: GobbletGobblers;
  let model: GobbletGobblers;

  beforeEach(() => {
    gg = new GobbletGobblers();
    model = new GobbletGobblers();
  });

  describe("getValidActions", () => {
    it("should return all valid actions to the empty game", () => {

      let actions = gg.getValidActions();
      expect(actions).toHaveLength(9*3);
    });

    it("should return all valid actions to a game in course", () => {

      gg.setState(

        [
          [
            [".", ".", "."],
            [".", ".", "."],
            [".", ".", "."]
          ],
          [
            [".", ".", "."],
            [".", "A", "."],
            [".", ".", "."]
          ],
          [
            [".", ".", "."],
            [".", ".", "."],
            [".", ".", "."]
          ]
        ],
        [2,2,2, 2,2,2],
        [1, 0]
      );

      // O "A" vai poder colocar em qualquer lugar não sobreposto, 
      // ou mover pra qualquer posição do mesmo nível
      let actions = gg.getValidActions();
      expect(actions).toHaveLength(9 + 8 + 8 + 8);
    });

    it("should return all valid actions to a won game", () => {

      gg.setState(

        [
          [
            ["A", ".", "."],
            [".", ".", "."],
            [".", ".", "."]
          ],
          [
            [".", ".", "."],
            [".", "A", "."],
            [".", ".", "."]
          ],
          [
            [".", ".", "."],
            [".", ".", "."],
            [".", ".", "A"]
          ]
        ]
      );
      
      // Jogo finalizado não tem ações possíveis
      let actions = gg.getValidActions();
      expect(actions).toHaveLength(0);
    });
  });

  // Deve

  describe("playAction", () => {

    it("should place a piece", () => {

      gg.playAction({ piece: { author: 0, size: 0 }, slot: 4, movedFrom: null });
      gg.playAction({ piece: { author: 1, size: 1 }, slot: 4, movedFrom: null });
      gg.playAction({ piece: { author: 0, size: 2 }, slot: 8, movedFrom: null });
      gg.playAction({ piece: { author: 1, size: 1 }, slot: 5, movedFrom: 4    });

      model.setState(

        [
          [
            [".", ".", "."],
            [".", "A", "."],
            [".", ".", "."]
          ],
          [
            [".", ".", "."],
            [".", ".", "B"],
            [".", ".", "."]
          ],
          [
            [".", ".", "."],
            [".", ".", "."],
            [".", ".", "A"]
          ]
        ],
        [1,2,1, 2,1,2],
        [1, 0]
      );

      expect(gg).toEqual(model);
    });

    it("should not place a piece to slot occupied with a same size piece", () => {

      gg.playAction({ piece: { author: 0, size: 1 }, slot: 4, movedFrom: null });
      
      expect(
        
        () => gg.playAction({ piece: { author: 1, size: 1 }, slot: 4, movedFrom: null })

      ).toThrowError();

    });

    it("should not place a piece to slot occupied with a larger size piece", () => {

      gg.playAction({ piece: { author: 0, size: 2 }, slot: 4, movedFrom: null });
      
      expect(
        
        () => gg.playAction({ piece: { author: 1, size: 1 }, slot: 4, movedFrom: null })

      ).toThrowError();

    });

    it("should move a piece", () => {

      gg.playAction({ piece: { author: 0, size: 0 }, slot: 4, movedFrom: null });
      gg.playAction({ piece: { author: 1, size: 0 }, slot: 0, movedFrom: null });
      gg.playAction({ piece: null, slot: 5, movedFrom: 4 });

      model.setState(

        [
          [
            ["B", ".", "."],
            [".", " ", "A"],
            [".", ".", "."]
          ],
          [
            [".", ".", "."],
            [".", ".", "."],
            [".", ".", "."]
          ],
          [
            [".", ".", "."],
            [".", ".", "."],
            [".", ".", "."]
          ]
        ],
        [1,2,2, 1,2,2],
        [0, 1]
      );

      expect(gg).toEqual(model);

    });

    it("should not move a piece to slot occupied with a same size piece", () => {

      gg.playAction({ piece: { author: 0, size: 1 }, slot: 4, movedFrom: null });
      gg.playAction({ piece: { author: 1, size: 1 }, slot: 5, movedFrom: null });
      

      expect(

        () => gg.playAction({ piece: { author: 0, size: 1 }, slot: 5, movedFrom: 4 })

      ).toThrowError();
    });

    it("should not move a piece to slot occupied with a larger size piece", () => {

      gg.playAction({ piece: { author: 0, size: 1 }, slot: 4, movedFrom: null });
      gg.playAction({ piece: { author: 1, size: 2 }, slot: 5, movedFrom: null });
      

      expect(

        () => gg.playAction({ piece: { author: 0, size: 1 }, slot: 5, movedFrom: 4 })

      ).toThrowError();
    });

    it("X can win in it's own turn", () => {

      gg.setState(

        [
          [
            ["A", ".", "."],
            [".", ".", "."],
            [".", ".", "."]
          ],
          [
            [".", ".", "."],
            [".", "A", "."],
            [".", ".", "."]
          ],
          [
            [".", ".", "."],
            [".", ".", "."],
            [".", ".", "A"]
          ]
        ],
        [1,2,2, 1,2,2],
        [0, 1]
      );

      expect(gg.getWinner()).toBe(0);
    });

    it("O can win if X removes the right piece removing a piece", () => {

      gg.setState(

        [
          [
            ["B", ".", "."],
            [".", ".", "."],
            [".", ".", "."]
          ],
          [
            ["A", ".", "."],
            [".", "B", "."],
            [".", ".", "."]
          ],
          [
            [".", ".", "."],
            [".", ".", "."],
            [".", ".", "B"]
          ]
        ],
        [1,2,2, 1,2,2],
        [1, 0]
      );

      gg.playAction({ piece: null, slot: 7, movedFrom: 0 });
      expect(gg.getWinner()).toBe(1);
    });

    it("Game can draw by both winning at the same time", () => {

      gg.setState(

        [
          [
            [".", ".", "."],
            [".", ".", "."],
            [".", ".", "."]
          ],
          [
            [".", ".", "B"],
            [".", ".", "."],
            [".", ".", "."]
          ],
          [
            [".", ".", "A"],
            ["A", ".", "B"],
            ["A", ".", "B"]
          ]
        ],
        [1,2,2, 1,2,2],
        [1, 0]
      );

      gg.playAction({ piece: null, slot: 0 , movedFrom: 2 });

      expect(gg.isGameOver()).toBeTruthy();
      expect(gg.getWinner()).toBe(null);
    });
  });
});
