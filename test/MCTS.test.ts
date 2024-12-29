import { describe, it, beforeEach, expect, assert } from "vitest";
import { TicTacToe } from "../src/TicTacToe";
import { Node, Outcome, outcomeValues } from "../src/MCTS";

import { XORShift } from "random-seedable";
let seed = 100;
const random = new XORShift(seed);

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
      expect(parent.getExpandableActions()).not.toContain(child.getActionTaken());

      parent = child;
      child = parent.expand();
      expect(parent.getExpandableActions()).not.toContain(child.getActionTaken());

      parent = child;
      child = parent.expand();
      expect(parent.getExpandableActions()).not.toContain(child.getActionTaken());  
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
        node.expand()
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
        child.setVisits(1 + random.int() % 200);
        child.setValue(random.float());
      }

      let ucbs = children.map(child => child.ucb());
      let maxIndex = ucbs.indexOf(Math.max(...ucbs));

      expect(children[maxIndex]).toEqual(parent.bestChild());

    });
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

      let node = new Node(null, ttt, null);
      let perspectivePlayer = ttt.getLastPlayer();

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

      let node = new Node(null, ttt, null);
      let perspectivePlayer = ttt.getLastPlayer();

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

      let node = new Node(null, ttt, null);
      let perspectivePlayer = ttt.getLastPlayer();

      // Expect to draw
      expect(node.simulate(perspectivePlayer)).toBe(Outcome.DRAW);
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

      for (let i=1; i<linearChildren.length; i++)
        assert(linearChildren[i].getParent() === linearChildren[i-1]);
    });

    it("should increment parents visit count", () => {

      linearChildren[linearChildren.length-1].backpropagate(0);

      for (let child of linearChildren)
        expect(child.getVisits()).toBe(1);

      linearChildren[linearChildren.length-1].backpropagate(0);
      
      for (let child of linearChildren)
        expect(child.getVisits()).toBe(2);
    });

    it("should increment parents value", () => {

      for (let child of linearChildren)
        expect(child.getValue()).toBe(0);
      
      // Propagar a partir da última
      let lastChild = linearChildren[linearChildren.length-1];
      lastChild.backpropagate(Outcome.LOSE);

      let referencePlayer = lastChild.getGame().getLastPlayer();
      
      // Esperar que alternem a referência do valor, já que o ttt sempre alterna players
      for (let child of linearChildren) {
        
        if (child.getGame().getLastPlayer() == referencePlayer)
          expect(child.getValue()).toBe(outcomeValues.get(Outcome.LOSE));
        else 
          expect(child.getValue()).toBe(outcomeValues.get(Outcome.WIN));
      }

    });
  });
});
