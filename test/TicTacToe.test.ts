import { expect, describe, it, beforeEach } from "vitest";
import { TicTacToe, TicTacToeState } from "../src/TicTacToe";

// =================== TicTacToe ===================

describe("TicTacToeGame", () => {
  let initialState: TicTacToeState;
  let state: TicTacToeState;
  let ttt: TicTacToe;
  beforeEach(() => {
    ttt = new TicTacToe();
    initialState = ttt.getInitialState();
  });

  it("should return a state that's of length 9", () => {
    expect(initialState.board.slots).toHaveLength(9);
  });

  it("should return a state that's empty", () => {
    expect(initialState.board.slots.every((slot) => slot == null)).toBeTruthy();
  });

  describe("changePerspective", () => {
    it("it should have an output that matches the given example", () => {
      // Filling state
      let state = initialState;
      for (let i = 0; i < 8; i++) {
        let action = { slot: i, piece: { author: i % 2 } };
        state = ttt.getNextState(state, action);
      }

      // Filling expected state
      let expectedState = ttt.getInitialState();
      for (let i = 0; i < 8; i++) {
        let action = { slot: i, piece: { author: (i + 1) % 2 } };
        expectedState = ttt.getNextState(expectedState, action);
      }

      // Testing change of perspective
      state = ttt.changePerspective(state);
      expect(state).toEqual(expectedState);
    });
  });

  describe("getTermination and getValue", () => {
    let value, terminated;

    it("should return false and 0 for initial state", () => {
      value = ttt.getValue(initialState);
      terminated = ttt.getTermination(initialState);
      expect(value).toEqual(0);
      expect(terminated).toBeFalsy();
    });

    it("should return true and 1 for won state", () => {
      // Jogo vazio
      state = initialState;
      state = ttt.getNextState(state, { slot: 0, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 4, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 8, piece: { author: 0 } });

      value = ttt.getValue(state);
      terminated = ttt.getTermination(state);
      expect(value).toEqual(1);
      expect(terminated).toBeTruthy();
    });

    it("should return true and 0 for drawn state", () => {
      state = initialState;

      state = ttt.getNextState(state, { slot: 0, piece: { author: 1 } });
      state = ttt.getNextState(state, { slot: 1, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 2, piece: { author: 1 } });

      state = ttt.getNextState(state, { slot: 3, piece: { author: 1 } });
      state = ttt.getNextState(state, { slot: 4, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 5, piece: { author: 1 } });

      state = ttt.getNextState(state, { slot: 6, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 7, piece: { author: 1 } });
      state = ttt.getNextState(state, { slot: 8, piece: { author: 0 } });

      value = ttt.getValue(state);
      terminated = ttt.getTermination(state);
      expect(value).toEqual(0);
      expect(terminated).toBeTruthy();
    });
  });

  describe("getValidActions", () => {
    it("should return all actions that are valid for example A", () => {
      // A
      state = initialState;
      state = ttt.getNextState(state, { slot: 0, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 4, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 8, piece: { author: 0 } });

      let actions = ttt.getValidActions(state);
      expect(actions).toHaveLength(6);

      for (const i of [1, 2, 3, 5, 6, 7])
        expect(ttt.getValidActions(state)).toContainEqual({
          slot: i,
          piece: { author: 1 },
        });
    });

    it("should return all actions that are valid for example B", () => {
      // B
      state = initialState;

      state = ttt.getNextState(state, { slot: 0, piece: { author: 1 } });
      state = ttt.getNextState(state, { slot: 1, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 2, piece: { author: 1 } });

      state = ttt.getNextState(state, { slot: 3, piece: { author: 1 } });
      state = ttt.getNextState(state, { slot: 4, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 5, piece: { author: 1 } });

      state = ttt.getNextState(state, { slot: 6, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 7, piece: { author: 1 } });
      state = ttt.getNextState(state, { slot: 8, piece: { author: 0 } });

      let actions = ttt.getValidActions(state);
      expect(actions).toHaveLength(0);
    });
  });
});

// ===============================================================================

/*
Cria root
	Buscas
		Seleciona leaf node v
		
			Verifica corretamente por espansão total v
			Calcula propriamente o UCB v
			Retorna o child com maior UCB v
			
		Pega valor e terminação v
		Expande v
		Simula
		
			Retorna todas as ações válidas v
			Escolhe jogada verdadeiramente aleatória -> Por inspeção visual, sim
			Retorna valor coerente de acordo com o resultado final e jogador que faz o movimento final v
			
		Retro propaga v
		
Recebe filhos do root v
Calcula probabilidade de cada filho v
Normalizar probabilidades v

Escolhe filho de maior probabilidade v
Retorna sua ação v
*/
