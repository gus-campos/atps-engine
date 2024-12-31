import { describe, it, beforeEach, expect, assert } from "vitest";
import { TicTacToe } from "src/games/TicTacToe";
import { Node, Outcome } from "src/shared/GameTree";
import { RANDOM } from "src/utils/Random";
import { OUTCOME_VALUE } from "src/shared/GameTree";

// =================== TicTacToe ===================

describe("Node with ttt", () => {
  let ttt: TicTacToe;
  let root: Node;

  beforeEach(() => {
    ttt = new TicTacToe();
    root = new Node(null, ttt, null);
  });

  describe("expand", () => {
    it("should define new parent's child as the node expanded", () => {
      let parent = root.expand();
      let child = parent.expand();
      expect(child.getParent()).toBe(parent);

      parent = child;
      child = parent.expand();
      expect(child.getParent()).toBe(parent);

      parent = child;
      child = parent.expand();
      expect(child.getParent()).toBe(parent);
    });

    it("should remove the action taken from the expandable actions", () => {
      let parent = root;
      let child = parent.expand();
      expect(parent.getExpandableActions()).not.toContain(
        child.getActionTaken()
      );

      parent = child;
      child = parent.expand();
      expect(parent.getExpandableActions()).not.toContain(
        child.getActionTaken()
      );

      parent = child;
      child = parent.expand();
      expect(parent.getExpandableActions()).not.toContain(
        child.getActionTaken()
      );
    });

    it("should create a new game based on action taken and assign it", () => {
      let parent = root.expand();
      let child = parent.expand();
      parent.getGame().playAction(child.getActionTaken());
      expect(parent.getGame()).toEqual(child.getGame());

      parent = child;
      child = parent.expand();
      parent.getGame().playAction(child.getActionTaken());
      expect(parent.getGame()).toEqual(child.getGame());

      parent = child;
      child = parent.expand();
      parent.getGame().playAction(child.getActionTaken());
      expect(parent.getGame()).toEqual(child.getGame());
    });
  });

  describe("isFullyExpanded", () => {
    it("should return false for root node", () => {
      expect(root.isFullyExpanded()).toBeFalsy();
    });

    it("should return false only for fully expanded nodes", () => {
      let node = root;

      while (node.getExpandableActions().length > 0) {
        expect(node.isFullyExpanded()).toBeFalsy();
        node.expand();
      }

      expect(node.isFullyExpanded()).toBeTruthy();
    });
  });

  describe("bestChild", () => {
    it("should return the child that has the greatest ucb", () => {
      let parent = root;
      parent.setVisits(10);

      let children = [];

      children.push(parent.expand());
      children.push(parent.expand());
      children.push(parent.expand());
      children.push(parent.expand());
      children.push(parent.expand());

      for (let child of children) {
        child.setVisits(1 + (RANDOM.int() % 200));
        child.setValue(RANDOM.float());
      }

      let ucbs = children.map((child) => child.ucb());
      let maxIndex = ucbs.indexOf(Math.max(...ucbs));

      expect(children[maxIndex]).toEqual(parent.bestChild());
    });
  });

  describe("backpropagate", () => {
    let linearChildren: Node[];

    beforeEach(() => {
      linearChildren = [];
      let parent = root;
      linearChildren.push(parent);

      while (parent.getExpandableActions().length > 0) {
        let child = parent.expand();
        linearChildren.push(child);
        parent = child;
      }

      for (let i = 1; i < linearChildren.length; i++)
        assert(linearChildren[i].getParent() === linearChildren[i - 1]);
    });

    it("should increment parents visit count", () => {
      linearChildren[linearChildren.length - 1].backpropagate(0);

      for (let child of linearChildren) expect(child.getVisits()).toBe(1);

      linearChildren[linearChildren.length - 1].backpropagate(0);

      for (let child of linearChildren) expect(child.getVisits()).toBe(2);
    });

    it("should increment parents value", () => {
      
      for (let child of linearChildren) 
        expect(child.getValue()).toBe(0);
      
      // Propagar a partir da última
      let lastChild = linearChildren[linearChildren.length - 1];
      lastChild.backpropagate(Outcome.LOSE);

      let maximizingPlayer = lastChild.getGame().getLastPlayer();

      // Esperar que alternem a referência do valor, já que o ttt sempre alterna players
      for (let child of linearChildren) {

        const lastPlayer = child.getGame().getLastPlayer();

        if (lastPlayer == maximizingPlayer)
          expect(child.getValue()).toBe(OUTCOME_VALUE.get(Outcome.LOSE));
        else 
          expect(child.getValue()).toBe(OUTCOME_VALUE.get(Outcome.WIN)); 
        
      }
    });
  });
});
