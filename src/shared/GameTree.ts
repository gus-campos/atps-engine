import { Game, Action, Player } from "./Game";
import { Graph, NodeModel, Edge, toDot } from 'ts-graphviz'
import { RANDOM } from "src/utils/Random";


export enum Outcome {
  WIN = 1,
  DRAW = 0,
  LOSE = -1
}

export const OUTCOME_VALUE = new Map<Outcome, number>([
  [Outcome.WIN, 1.0],
  [Outcome.DRAW, 0.0],
  [Outcome.LOSE, -10.0]
]);

export const OPPOSITE_OUTCOME = new Map<Outcome, Outcome>([
  [Outcome.WIN, Outcome.LOSE],
  [Outcome.DRAW, Outcome.DRAW],
  [Outcome.LOSE, Outcome.WIN]
]);

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

    let actionTaken = RANDOM.choice<Action>(expandableActions);

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

    let explore = Math.sqrt(Math.log(this.parent.getVisits()) / this.visits);

    let exploit = this.value / this.visits;
    exploit = Node.normalizeExploit(exploit);

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
    this.value += OUTCOME_VALUE.get(outcome);

    if (this.parent != null) {

      const parentPlayer = this.parent.getGame().getCurrentPlayer();
      const currentPlayer = this.getGame().getCurrentPlayer();

      outcome = currentPlayer == parentPlayer ? outcome : OPPOSITE_OUTCOME.get(outcome);
      this.parent.backpropagate(outcome);
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
      
      let childNode = child.genConnectedNode(G, parent);
      child.genGraphNodes(G, childNode);
    }
  }

  public nodeToString(): string {

    /* Generates a label that represents the node*/

    const state = this.getGame().stateToString();
    return `Visits: ${(this.visits)}\nValue: ${this.value}\n${state}`;
  }

  //===========
  // Private
  //===========
  
  private genConnectedNode(G: Graph, parent: NodeModel=null): NodeModel {

    /* Generates a node to be added in a graphviz graph */

    let label = this.nodeToString();
    let childNode = G.node(String(GRAPH_ID++), { label: label });


    G.addEdge(new Edge([parent, childNode]));

    return childNode;
  }

  private static normalizeExploit(exploit: number): number {

    /*
    Normaliza o valor do exploit, para que independente dos
    valores atribuídos à vitória e à derrota, ele varia entre 0 e 1
    */

    const delta = 0 - OUTCOME_VALUE.get(Outcome.LOSE);
    const range = OUTCOME_VALUE.get(Outcome.WIN) - OUTCOME_VALUE.get(Outcome.LOSE);

    return (exploit + delta) / range; 
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

  constructor(rootNode: TNode) {
    this.root = rootNode;
    this.maximizingPlayer = rootNode.getGame().getCurrentPlayer();
  }

  public genGraph(dirOut: string) {

    let G = new Graph("G");
    G.node({'fontname': 'Courier'});

    // Adicionar este
    let rootNode = this.genRootGraphNode(G); 

    // Fazer primeira chamada da recursão
    this.root.genGraphNodes(G, rootNode);

    // Escrever no arquivo
    var fs = require('fs');
    fs.writeFileSync(dirOut, toDot(G));
  }

  // =============
  // PRIVATE
  //==============

  private genRootGraphNode(G: Graph): NodeModel {

    /* Generates a node to be added in a graphviz graph */

    let label = this.root.nodeToString();
    let childNode = G.node(String(GRAPH_ID++), { label: label });
    G.addNode(childNode);

    return childNode;
  }

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
