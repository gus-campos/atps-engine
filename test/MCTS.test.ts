import { describe, it, beforeEach, expect, assert } from "vitest";
import { TicTacToe, TicTacToeAction } from "../src/TicTacToe";
import { GameTree, Node } from "../src/MCTS";

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

    it("should define new child parent as the node expanded", () => {

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

    it("should return 1 for game won by current player", () => {
      
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

      // 0 vai jogar, e inevitavelmente ganhar
      // Espera-se valor favorável pro jogador atual: 1
      expect(node.simulate()).toBe(1);

    });

    it("should return 0 for game won by opponent", () => {
      
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

      // 1 vai jogar, pra depois 0 jogar e inevitavelmente ganhar
      // Espera-se valor desfavorável pro jogador atual: -1
      expect(node.simulate()).toBe(0);
    });

    it("should return 0.5 for drawn game", () => {
      
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

      // Expect to draw
      expect(node.simulate()).toBe(0.5);
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

      let value1 = random.float();
      let value2 = random.float();

      for (let child of linearChildren)
        expect(child.getValue()).toBe(0);

      linearChildren[linearChildren.length-1].backpropagate(value1);
      
      for (let child of linearChildren) {
        
        if (linearChildren[0].getGame().getLastPlayer() == child.getGame().getCurrentPlayer())
          expect(child.getValue()).toBe(value1);
        else 
          expect(child.getValue()).toBe(1-value1);
      }
      
      linearChildren[linearChildren.length-1].backpropagate(value2);
      
      for (let child of linearChildren) {

        if (linearChildren[0].getGame().getLastPlayer() == child.getGame().getCurrentPlayer())
          expect(child.getValue()).toBe(value1 + value2);
        else
          expect(child.getValue()).toBe((1-value1) + (1-value2));
      }

    });
  });

  /*
  describe("GameTree with ttt", () => {

    let ttt: TicTacToe;
    let root: Node;
    let gameTree: GameTree;

    beforeEach(() => {
      ttt = new TicTacToe();
      root = new Node(null, ttt, null);  
      gameTree = new GameTree(root);
    });

    describe("search", () => {
      
      it("when called multiple times on root, should expand all it's actions first", () => {
  
        // First expand all root actions

        for (let i=0; i<9; i++)
          gameTree.search();
   
        expect(gameTree.getRoot().getChildren()).toHaveLength(9);

        // The root should not have any granchild

        let total= 0;
        for (let child of gameTree.getRoot().getChildren())
          total += child.getChildren().length;

        expect(total).toBe(0);

        // Each additional search results in one grandchild

        for (let i=0; i<5; i++)
          gameTree.search();

        total= 0;
        for (let child of gameTree.getRoot().getChildren())
          total += child.getChildren().length;

        expect(total).toBe(5);
      });
    });

    describe("searches", () => {
      
      it("returns a valid action", () => {
  
        let action = gameTree.searches() as TicTacToeAction;
        ttt.playAction(action);

      });
    });
  });
  */
});
