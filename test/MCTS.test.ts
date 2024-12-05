import { describe, it, beforeEach, expect } from "vitest";

import { Action } from "src/Game";
import { TicTacToe, TicTacToeState, TicTacToeAction } from "../src/TicTacToe";
import { MCTS, Node, Args } from "../.archive/MCTS.ts";

// =================== TicTacToe ===================


describe("Node", () => {
  let ttt: TicTacToe;
  let initialState: TicTacToeState;
  let state: TicTacToeState;
  let root: Node;
  let args: Args;

  beforeEach(() => {
    ttt = new TicTacToe();
    initialState = ttt.getInitialState();
    root = new Node(ttt, args, initialState);
    args = { C: 1.41, searches: 10_000 };
  });

  describe("expand", () => {
    it("should return childs that are contained by nodes children", () => {
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

      // Como se espera empate, o saldo deve ser 0
      root = new Node(ttt, args, state);
      expect(root.simulate()).toBe(0);
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
      state = ttt.setCurrentAndLastPlayer(state, 1, 0);

      // Como o 1 é o jogador atual e ele vai vencer, espera-se saldo 1
      // Vitória do player
      root = new Node(ttt, args, state);
      expect(root.simulate()).toBe(1);
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

      // Como é vez do 1, e espera-se que quando voltar no 0 ele vá vencer, o saldo deve ser -1
      // Vitória do adversário
      root.simulate();
      expect(root.simulate()).toBe(-1);
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

    it("linear children should be created", () => {
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
    it("should return child with greatest ucb", () => {
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

describe("MCTS search", () => {
  let args = { C: 1.41, searches: 1_000_000 };
  let initialState: TicTacToeState;
  let state: TicTacToeState;
  let ttt: TicTacToe;
  let mcts: MCTS;

  beforeEach(() => {
    ttt = new TicTacToe();
    mcts = new MCTS(ttt, args);
    initialState = ttt.getInitialState();
  });

  it("should win an almost done row", () => {
    state = ttt.getInitialState();

    state = ttt.getNextState(state, { slot: 0, piece: { author: 0 } });
    state = ttt.getNextState(state, { slot: 1, piece: { author: 1 } });
    state = ttt.getNextState(state, { slot: 4, piece: { author: 0 } });
    state = ttt.getNextState(state, { slot: 5, piece: { author: 1 } });

    let bestAction = mcts.search(state) as TicTacToeAction;
    state = ttt.getNextState(state, bestAction);
    ttt.printState(state);

    expect(ttt.getTermination(state)).toBeTruthy();
  });

  it("should always avoid imediate opponent victory", () => {
    for (let i = 0; i < 10; i++) {
      let testState = ttt.getInitialState();
      let modelState = structuredClone(testState);

      testState = ttt.getNextState(testState, {
        slot: 1,
        piece: { author: 0 },
      });
      testState = ttt.getNextState(testState, {
        slot: 0,
        piece: { author: 1 },
      });
      testState = ttt.getNextState(testState, {
        slot: 5,
        piece: { author: 0 },
      });
      testState = ttt.getNextState(testState, {
        slot: 4,
        piece: { author: 1 },
      });

      let bestAction = mcts.search(testState) as TicTacToeAction;
      testState = ttt.getNextState(testState, bestAction);

      // ======================================================================

      modelState = ttt.getNextState(modelState, {
        slot: 1,
        piece: { author: 0 },
      });
      modelState = ttt.getNextState(modelState, {
        slot: 0,
        piece: { author: 1 },
      });
      modelState = ttt.getNextState(modelState, {
        slot: 5,
        piece: { author: 0 },
      });
      modelState = ttt.getNextState(modelState, {
        slot: 4,
        piece: { author: 1 },
      });
      modelState = ttt.getNextState(modelState, {
        slot: 8,
        piece: { author: 0 },
      });

      expect(modelState === testState).toBeTruthy();
    }
  });
});
