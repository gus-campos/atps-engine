import { Game, Action, Player } from "./Game";
import { XORShift } from "random-seedable";

import { Graph, NodeModel, Edge, toDot } from 'ts-graphviz'


let seed = Date.now();
//let seed = 100;
export const random = new XORShift(seed);

enum Outcome {
  WIN = 1,
  DRAW = 0,
  LOSE = -1
}

let outcomeValues = new Map();
outcomeValues.set(Outcome.WIN, 1);
outcomeValues.set(Outcome.DRAW, 0);
outcomeValues.set(Outcome.LOSE, -1);

let oppositeOutcome = new Map();
oppositeOutcome.set(Outcome.WIN, Outcome.LOSE);
oppositeOutcome.set(Outcome.DRAW, Outcome.DRAW);
oppositeOutcome.set(Outcome.LOSE, Outcome.WIN);

let graphId = 0;

// =================================================

export class Node {
  private game: Game;
  private actionTaken: Action | null;
  private parent: Node | null;

  private visits: number;
  private value: number;

  private expandableActions: Action[];
  private children: Node[];

  constructor(parent: Node, game: Game, actionTaken: Action) {
    this.parent = parent;
    this.game = game;
    this.actionTaken = actionTaken;

    this.visits = 0;
    this.value = 0;

    this.expandableActions = this.game.getValidActions();
    this.children = [];
  }

  public expand(): Node {
    let expandableActions = this.getExpandableActions();

    if (expandableActions.length == 0) throw new Error("No expandable actions");

    let actionTaken = random.choice(expandableActions);

    // Removing from expandable
    let index = expandableActions.indexOf(actionTaken);
    expandableActions.splice(index, 1);

    let newGame = this.game.clone();
    newGame.playAction(actionTaken);

    let child = new Node(this, newGame, actionTaken);
    this.children.push(child);

    return child;
  }

  public isFullyExpanded(): boolean {
    // Não tem ações expansíveis, e tem algum filho
    // O critério de ter filho faz com que nós terminais sejam considerados não expandíveis

    return this.expandableActions.length == 0 && this.children.length > 0;
  }

  public ucb(): number {
    let explore = Math.sqrt(Math.log(this.parent.getVisits()) / this.visits);
    let exploit = this.value / this.visits;
    return exploit + 1.41 * explore;
    //return this.value / this.visits;
  }

  public bestChild() {
    if (this.children.length == 0) throw new Error("It has no children");

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

  public getGameOutcome(game: Game, perspectivePlayer: Player) {
    if (game.getWinner() == null) return Outcome.DRAW;

    if (game.getWinner() == perspectivePlayer) return Outcome.WIN;

    return Outcome.LOSE;
  }

  public getGameValue(game: Game, perspectivePlayer: Player) {
    let outcome = this.getGameOutcome(game, perspectivePlayer);
    return outcomeValues.get(outcome);
  }

  public simulate(perspectivePlayer: Player): Outcome {
    let game = this.game.clone();

    while (!game.getTermination()) {
      let action = random.choice(game.getValidActions());
      game.playAction(action);
    }

    let outcome = this.getGameOutcome(game, perspectivePlayer);

    return outcome;
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

  public genNode(G: Graph): NodeModel {

    return G.node(String(graphId++), { label : `Visits: ${this.visits}\nValue: ${this.value}\n${this.getGame().stateToString()}` });
  } 

  public genGraph(G: Graph, parent: NodeModel) {

    // Adicionar seus children
    for (let child of this.children) {
      
      let childNode = child.genNode(G);
      G.addEdge(new Edge([parent, childNode]));

      child.genGraph(G, childNode);
    }
  }

  public getActionTaken() {
    return this.actionTaken;
  }

  // Getters

  getExpandableActions(): Action[] {
    return this.expandableActions;
  }

  getGame(): Game {
    return this.game;
  }

  getLastPlayer(): Player {

    return this.game.getLastPlayer();
  }

  getParent(): Node {
    return this.parent;
  }

  getVisits(): number {
    return this.visits;
  }

  getChildren(): Node[] {
    return this.children;
  }

  getValue(): number {
    return this.value;
  }

  // Setters (for testing)

  setVisits(visits: number): void {
    this.visits = visits;
  }

  setValue(value: number): void {
    this.value = value;
  }
}

export class GameTree {
  private root: Node;
  private perspectivePlayer: Player;

  constructor(root: Node) {
    this.root = root;
    this.perspectivePlayer = root.getGame().getLastPlayer();
  }

  private select(): Node {
    /* Selects first leaf node in a chain of best childs */

    let node = this.root;

    // Procura o primeiro leaf node seguindo o caminho dos melhores
    // Quando chega num jogo terminado, dá erro, pois é considerado não expandido

    while (node.isFullyExpanded()) node = node.bestChild();

    return node;
  }

  search() {
    let node = this.select();

    let outcome, terminal = node.getGame().getTermination();

    if (!terminal) {
      node = node.expand();
      outcome = node.simulate(this.perspectivePlayer);
    } else {
      outcome = node.getGameValue(node.getGame(), this.perspectivePlayer);
    }

    node.backpropagate(outcome);
  }

  searches(timeCriteria: number): Action {
    let startTime = Date.now();

    while (Date.now() - startTime < timeCriteria) this.search();

    let visits = this.root.getChildren().map((child) => child.getVisits());
    let childIndex = visits.indexOf(Math.max(...visits));
    return this.root.getChildren()[childIndex].getActionTaken();
  }

  genGraph() {

    let G = new Graph("G");

    // Adicionar este
    let rootNode = this.root.genNode(G); 
    G.addNode(rootNode);
    
    // Fazer primeira chamada
    this.root.genGraph(G, rootNode);

    var fs = require('fs');
    fs.writeFileSync('teste.dot', toDot(G));


  }

  // Getters
  getRoot(): Node {
    return this.root;
  }
}
