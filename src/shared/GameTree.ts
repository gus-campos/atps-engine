import { Game, Action, Player } from "./Game";
import { Graph, NodeModel, Edge, toDot } from 'ts-graphviz'

// ============ RANDON ==========================

import { XORShift } from "random-seedable";
let seed = Date.now(); //= 100;
export const random = new XORShift(seed);

// ==============================================

export enum Outcome {
  WIN = 1,
  DRAW = 0,
  LOSE = -1
}

export const outcomeValues = new Map();
outcomeValues.set(Outcome.WIN,  1.0);
outcomeValues.set(Outcome.DRAW, 0.5);
outcomeValues.set(Outcome.LOSE, 0.0);

export const oppositeOutcome = new Map();
oppositeOutcome.set(Outcome.WIN, Outcome.LOSE);
oppositeOutcome.set(Outcome.DRAW, Outcome.DRAW);
oppositeOutcome.set(Outcome.LOSE, Outcome.WIN);

const EXPLORE_FACTOR = 1.41;

let GRAPH_ID = 0;

// =================================================

export class Node {

  protected game: Game;
  protected children: Node[];
  
  private actionTaken: Action | null;
  private parent: Node | null;

  private visits: number;
  private value: number;

  private expandableActions: Action[];

  constructor(parent: Node, game: Game, actionTaken: Action) {

    this.parent = parent;
    this.game = game.clone();
    this.actionTaken = actionTaken;

    this.visits = 0;
    this.value = 0;

    this.expandableActions = this.game.getValidActions();
    this.children = [];
  }

  public getRandomExpAction(): Action {

    let expandableActions = this.getExpandableActions();

    if (expandableActions.length == 0) 
      throw new Error("No expandable actions");

    let actionTaken = random.choice(expandableActions);

    // Removing from expandable
    let index = expandableActions.indexOf(actionTaken);
    expandableActions.splice(index, 1);

    return actionTaken;
  }

  public expand(): Node {
  
    let actionTaken = this.getRandomExpAction();

    let newGame = this.game.clone();
    newGame.playAction(actionTaken);

    let child = new Node(this, newGame, actionTaken);
    this.children.push(child);

    return child;
  }

  public isFullyExpanded(): boolean {
    /*
    Não tem ações expansíveis, e tem algum filho
    O critério de ter filho faz com que nós terminais sejam considerados
    não expandíveis
    */

    return this.expandableActions.length == 0 && this.children.length > 0;
  }

  public ucb(): number {
    const visits = this.visits + Number.EPSILON;
    let explore = Math.sqrt(Math.log(this.parent.getVisits()) / visits);
    let exploit = this.value / visits;
    return exploit + EXPLORE_FACTOR * explore;
  }

  public bestChild() {

    if (this.children.length == 0) 
      throw new Error("It has no children");

    let bestUcb = Number.NEGATIVE_INFINITY;
    let bestChild = this.children[0];

    for (let child of this.children) {
      let ucb = child.ucb();

      if (ucb > bestUcb) {
        bestChild = child;
        bestUcb = ucb;
      }
    }

    return bestChild;
  }

  public backpropagate(outcome: Outcome) {
    /*
    Propaga o valor aos parents, invertendo o valor quando o 
    parent é de outra perspectiva
    */

    this.visits++;
    this.value += outcomeValues.get(outcome);

    if (this.parent != null) {

      if (this.parent.getLastPlayer() != this.getLastPlayer())
        outcome = oppositeOutcome.get(outcome);

      this.parent.backpropagate(outcomeValues.get(outcome));
    }
  }

  public getGameOutcome(game: Game, maximizingPlayer: Player) {
    
    if (!game.getTermination())
      throw new Error("A not ended game has no valid outcome");
    
    let winner = game.getWinner();
    
    if (winner == null)
      return Outcome.DRAW;
    
    return winner == maximizingPlayer ? Outcome.WIN : Outcome.LOSE;
  }

  public genGraphNodes(G: Graph, parent: NodeModel) {

    // Adicionar seus children
    for (let child of this.children) {
      
      let childNode = this.genGraphNode(G);
      G.addEdge(new Edge([parent, childNode]));

      // Chamar recursivamente
      child.genGraphNodes(G, childNode);
    }
  }

  //===========
  // Private
  //===========

  public genGraphNode(G: Graph): NodeModel {

    /* Generates a node to be added in a graphviz graph */

    let label = this.nodeToString();

    return G.node(String(GRAPH_ID++), { label: label });
  }

  private nodeToString(): string {

    /* Generates a label that represents the node*/

    const state = this.getGame().stateToString();

    return `Visits: ${(this.visits)}\nValue: ${this.value}\n${state}`;
  }

  //===========
  // Getters
  //===========

  public getExpandableActions(): Action[] {
    return this.expandableActions;
  }

  public getGame(): Game {
    return this.game;
  }

  public getLastPlayer(): Player {

    return this.game.getLastPlayer();
  }

  public getParent(): Node {
    return this.parent;
  }

  public getVisits(): number {
    return this.visits;
  }

  public getChildren(): Node[] {
    return this.children;
  }

  public getValue(): number {
    return this.value;
  }

  public getActionTaken() {
    return this.actionTaken;
  }

  //===========
  // Setters 
  //===========

  public setVisits(visits: number): void {
    this.visits = visits;
  }

  public setValue(value: number): void {
    this.value = value;
  }
}

export class GameTree<TNode extends Node> {

  protected root: TNode;
  protected maximizingPlayer: Player;
  protected nodeAmount: number;

  constructor(rootNode: TNode) {
    this.root = rootNode;
    this.maximizingPlayer = rootNode.getGame().getCurrentPlayer();
  }

  public genGraph(dirOut: string) {

    let G = new Graph("G");
    G.node({'fontname': 'Courier'});

    // Adicionar este
    let rootNode = this.root.genGraphNode(G); 
    G.addNode(rootNode);
    
    // Fazer primeira chamada
    this.root.genGraphNodes(G, rootNode);

    // Escrever no arquivo
    var fs = require('fs');
    fs.writeFileSync(dirOut, toDot(G));
  }

  // =============
  // PRIVATE
  //==============

  protected select(): TNode {

    /* Selects first leaf node in a chain of best childs */

    let node = this.root;

    while (node.isFullyExpanded()) 
      node = node.bestChild() as TNode;

    return node;
  }

  //==========
  // Getters
  //==========
  
  getRoot(): TNode {
    return this.root;
  }
}
