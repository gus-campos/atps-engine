import { expect, test, describe, it, beforeEach } from "vitest";

import { TicTacToe, TicTacToeState } from "../src/TicTacToe";
import { Args, Node } from "../.archive/MCTS.ts";
import { Action } from "../src/Game";

// TODO: Usar "it"

// =================== TicTacToe ===================

const args: Args = { C: 1.41, searches: 1000 };

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

describe("Node", () => {
  let ttt: TicTacToe;
  let initialState: TicTacToeState;
  let state: TicTacToeState;
  let root: Node;

  beforeEach(() => {
    ttt = new TicTacToe();
    initialState = ttt.getInitialState();
    root = new Node(ttt, args, initialState);
  });

  describe("expand", () => {
    it("should return childs that are constained by nodes children", () => {
      let children = [];

      // Expansão quase total
      for (let i = 0; i < 9; i++) children.push(root.expand());

      // Mesmo tamanho (não sobra itens em nenhum dos dois)
      expect(root.getChildren().length).toBe(children.length);

      // Todos contidos em um, estão contidos no outro, e pelo item anterior, o contrário também é verdade
      for (const child of children)
        expect(root.getChildren()).toContainEqual(child);

      for (const child of children) expect(child.getVisitCount()).toBe(0);

      for (const child of children) expect(child.getValueSum()).toBe(0);
    });

    it("should return children with 0 visit counts and 0 value", () => {
      let children = [];

      // Expansão quase total
      for (let i = 0; i < 9; i++) children.push(root.expand());

      for (const child of children) expect(child.getVisitCount()).toBe(0);

      for (const child of children) expect(child.getValueSum()).toBe(0);
    });
  });

  describe("ExpandableActions", () => {
    it("should return empty for initial state", () => {
      state = initialState;
      for (let i = 0; i < 9; i++)
        state = ttt.getNextState(state, { slot: i, piece: { author: i % 2 } });

      root = new Node(ttt, args, state);
      expect(root.getExpandableActions()).toEqual([]);
    });

    it("should return the only action possible for almost fully filled game", () => {
      // Jogo quase cheio
      state = initialState;
      for (let i = 0; i < 8; i++)
        state = ttt.getNextState(state, { slot: i, piece: { author: i % 2 } });

      root = new Node(ttt, args, state);
      expect(root.getExpandableActions()).toEqual([
        { slot: 8, piece: { author: 0 } },
      ]);
    });
  });

  describe("isFullyExpanded", () => {
    it("should return false for initial state", () => {
      expect(root.isFullyExpanded()).toBeFalsy();
    });

    it("should return false for almost fully expanded node", () => {
      // Expansão quase total
      for (let i = 0; i < 8; i++) root.expand();
      expect(root.isFullyExpanded()).toBeFalsy();
    });

    it("should return true fully expanded node", () => {
      // Expansão total
      for (let i = 0; i < 9; i++) root.expand();
      expect(root.isFullyExpanded()).toBeTruthy();
    });
  });

  describe("getUcb", () => {
    it("should make proper UCB calculation for (47,16,31)", () => {
      // Considerando C = 1.41

      state = ttt.getInitialState();
      root = new Node(ttt, args, state);

      let child = root.expand();

      root.setVisitCount(16);
      child.setValueSum(31);
      child.setVisitCount(47);

      expect(root.getUcb(child)).toBeCloseTo(0.5126);

      root.setVisitCount(255);
      child.setValueSum(105);
      child.setVisitCount(586);

      expect(root.getUcb(child)).toBeCloseTo(0.5475);
    });

    it("should make proper UCB calculation for (255,105,586)", () => {
      // Considerando C = 1.41

      state = ttt.getInitialState();
      root = new Node(ttt, args, state);

      let child = root.expand();

      root.setVisitCount(255);
      child.setValueSum(105);
      child.setVisitCount(586);

      expect(root.getUcb(child)).toBeCloseTo(0.5475);
    });
  });

  describe("removeRandomAction", () => {
    it("should remove decrement the length of expandable actions", () => {
      expect(root.getExpandableActions()).toHaveLength(9);

      let action1: Action = root.removeRandomAction();
      let action2: Action = root.removeRandomAction();
      let action3: Action = root.removeRandomAction();

      expect(root.getExpandableActions()).toHaveLength(6);

      expect(root.getExpandableActions()).not.toContainEqual(action1);
      expect(root.getExpandableActions()).not.toContainEqual(action2);
      expect(root.getExpandableActions()).not.toContainEqual(action3);
    });

    it("should return a actions that are no longer in expandable actions", () => {
      let action1: Action = root.removeRandomAction();
      let action2: Action = root.removeRandomAction();
      let action3: Action = root.removeRandomAction();

      expect(root.getExpandableActions()).not.toContainEqual(action1);
      expect(root.getExpandableActions()).not.toContainEqual(action2);
      expect(root.getExpandableActions()).not.toContainEqual(action3);
    });
  });

  describe("simulation", () => {
    it("should return -0 when oponent draws game", () => {
      // Jogo que vai ser empatado pelo jogador atual

      state = ttt.getInitialState();

      state = ttt.getNextState(state, { slot: 0, piece: { author: 1 } });
      state = ttt.getNextState(state, { slot: 1, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 2, piece: { author: 1 } });

      state = ttt.getNextState(state, { slot: 3, piece: { author: 1 } });
      state = ttt.getNextState(state, { slot: 4, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 5, piece: { author: 1 } });

      state = ttt.getNextState(state, { slot: 6, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 7, piece: { author: 1 } });

      // 1 0 1
      // 1 0 1
      // 0 1 _

      // Definindo que quem vai jogar é o 0, e que quem jogou foi o 1
      state = ttt.setCurrentAndLastPlayer(state, 0, 1);

      // COmo quem jogou foi o 1, e na simulação espera-se que o 0 empate o jogo
      // o saldo deve ser -0, pois o adversário empatou o jogo
      root = new Node(ttt, args, state);
      expect(root.simulate()).toBe(-0);
    });

    it("should return -1 when oponent wins game", () => {
      // Jogo que vai ser ganho pelo jogador atual

      state = ttt.getInitialState();

      state = ttt.getNextState(state, { slot: 0, piece: { author: 1 } });
      state = ttt.getNextState(state, { slot: 1, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 2, piece: { author: 0 } });

      state = ttt.getNextState(state, { slot: 3, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 4, piece: { author: 1 } });
      state = ttt.getNextState(state, { slot: 5, piece: { author: 0 } });

      state = ttt.getNextState(state, { slot: 6, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 7, piece: { author: 0 } });

      // 1 0 0
      // 0 1 0
      // 0 0 _

      // Definindo que quem vai jogar é o 1, e que quem jogou foi o 0
      state = ttt.setCurrentAndLastPlayer(state, 0, 1);

      // Como o 0 jogou, e espera-se que o 1 vença o jogo, espera-se saldo -1
      // já que é vitória do adversário
      root = new Node(ttt, args, state);
      expect(root.simulate()).toBe(-1);
    });

    it("should return +1 when initial player wins game", () => {
      // Jogo que vai ser ganho pelo adversário

      state = ttt.getInitialState();

      state = ttt.getNextState(state, { slot: 0, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 2, piece: { author: 0 } });

      state = ttt.getNextState(state, { slot: 4, piece: { author: 1 } });
      state = ttt.getNextState(state, { slot: 5, piece: { author: 0 } });

      state = ttt.getNextState(state, { slot: 6, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 7, piece: { author: 0 } });
      state = ttt.getNextState(state, { slot: 8, piece: { author: 1 } });

      // 0 _ 0
      // _ 1 0
      // 0 0 1

      // Definindo que quem vai jogar é o 1, e que quem jogou foi o 0
      state = ttt.setCurrentAndLastPlayer(state, 1, 0);
      root = new Node(ttt, args, state);

      // Como o 0 jogou, e espera-se que o 0 vença o jogo depois de 2 rodadas
      // o saldo deve ser 1, já que é uma vitória de quem começou a simulação
      root.simulate();
      expect(root.simulate()).toBe(1);
    });
  });

  describe("backpropagate", () => {
    let linearChilds: Node[] = [];
    let n = 10;

    beforeEach(() => {
      linearChilds = Array(n);
      linearChilds[0] = root;
      for (let i = 1; i < n; i++)
        linearChilds[i] = linearChilds[i - 1].expand();
    });

    test("linear children should be created", () => {
      for (let i = 1; i < n; i++)
        expect(linearChilds[i].getParent()).toEqual(linearChilds[i - 1]);
    });

    it("should propagte alternating sign value", () => {
      let value = Math.random();
      linearChilds[n - 1].backpropagate(value);

      // Todos tem 1 visita
      for (let i = 1; i < n; i++)
        expect(linearChilds[i].getVisitCount()).toBe(1);
    });

    it("should propate alternating sign value", () => {
      let value = Math.random();
      linearChilds[n - 1].backpropagate(value);

      for (let i = 0; i < n; i++) {
        if (i % 2 == 0) {
          expect(linearChilds[i].getValueSum()).toBe(-value);
        } else {
          expect(linearChilds[i].getValueSum()).toBe(value);
        }
      }
    });

    it("last child should have it's own value (same sign)", () => {
      let value = Math.random();
      linearChilds[n - 1].backpropagate(value);
      expect(linearChilds[n - 1].getValueSum()).toBe(value);
    });
  });

  describe("getBestChild", () => {
    test("should return child with greatest ucb", () => {
      let children = Array(9);

      for (let i = 0; i < 9; i++) {
        children[i] = root.expand();
        children[i].backpropagate(Math.random());
      }

      let ucbs = root.getChildren().map((child) => root.getUcb(child));
      expect(root.getUcb(root.getBestChild())).toEqual(Math.max(...ucbs));
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
