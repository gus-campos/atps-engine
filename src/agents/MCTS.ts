import { Game, Action, Player } from "../shared/Game";
import { Graph, NodeModel, Edge, toDot } from 'ts-graphviz'
import { RANDOM } from "src/utils/Random";
import { RandomAgent } from "src/agents/RandomAgent";


export enum Outcome {
  WIN = 1,
  DRAW = 0,
  LOSE = -1
}

export interface MCTSConfig {

  searchesTime: number;
  maxPlayoutDepth: number;
  genGraph: boolean;
}

export const OUTCOME_VALUE = new Map<Outcome, number>([
  [Outcome.WIN, 1.0],
  [Outcome.DRAW, 0.5],
  [Outcome.LOSE, 0.0]
]);

export const OPPOSITE_OUTCOME = new Map<Outcome, Outcome>([
  [Outcome.WIN, Outcome.LOSE],
  [Outcome.DRAW, Outcome.DRAW],
  [Outcome.LOSE, Outcome.WIN]
]);

const EXPLORE_FACTOR = Math.sqrt(2);
let GRAPH_ID = 0;
let TURN = 0;

// =================================================

export class Node {

  private parent: Node | null;
  private game: Game;
  private actionTaken: Action | null;
  private perspectivePlayer: Player;
  
  private visits: number;
  private value: number;
  
  private expandableActions: Action[];
  private children: Node[];

  constructor(parent: Node, game: Game, actionTaken: Action) {

    this.parent = parent;
    this.game = game.clone();
    this.actionTaken = actionTaken;
    this.perspectivePlayer = game.getCurrentPlayer();

    this.visits = 0;
    this.value = 0;

    this.expandableActions = this.game.getValidActions();
    this.children = [];
  }
  

  public static getGameOutcome(game: Game) {

    /*
    // TODO: Para jogos que o player causa a própria derrota, 
    // considerar de acordo com referência (qual?)
    */
    
    if (!game.getTermination())
      throw new Error("A not ended game has no valid outcome");
    
    let winner = game.getWinner();
    
    if (winner == null)
      return Outcome.DRAW;
  
    return Outcome.WIN;
  }

  public expand(): Node {

    /*
    Cria um novo nó a partir de uma ação aleatória
    */
  
    let actionTaken = this.getRandomExpAction();

    let newGame = this.game.clone();
    newGame.playAction(actionTaken);

    let child = new Node(this, newGame, actionTaken);
    this.children.push(child);

    return child;
  }

  public isExpandableOrTerminal(): boolean {

    // Obs: Apenas nós terminais possuem 0 filhos ao mesmo tempo que
    // não possuem ações expansíveis

    return this.expandableActions.length != 0 || this.children.length == 0;
  }

  public ucb(): number {

    let explore = Math.sqrt(Math.log(this.parent.getVisits()) / this.visits);
    let exploit = this.value / this.visits;

    return exploit + EXPLORE_FACTOR * explore;
  }

  public bestChild() {

    /*
    Returns their child that has the greater ucb
    */

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
     
      if (this.perspectivePlayer != this.parent.perspectivePlayer)
        outcome = OPPOSITE_OUTCOME.get(outcome);
      
      this.parent.backpropagate(outcome);
    }
  }

  public simulate(): Outcome {

    /*
    Joga o jogo com ações aleatórias, até o fim, e
    retorna seu resultado, em relação ao maximizing player
    */

    let game = this.game.clone();

    while (!game.getTermination()) {
      let action = RandomAgent.nextGameAction(game);
      game.playAction(action);
    }

    return Node.getGameOutcome(game);
  }

  public genGraphNodes(G: Graph, parent: NodeModel) {

    /*
    Gera recursivamente nós de grafo do graphviz, a partir
    de cada nó da árvore
    */

    // Adicionar seus children
    for (let child of this.children) {
      
      let childNode = child.genConnectedNode(G, parent);
      child.genGraphNodes(G, childNode);
    }
  }

  public nodeToString(): string {

    /* Generates a label that represents the node */

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

  private getRandomExpAction(): Action {

    /*
    Get a random expandable actions, removes it from the
    array, and returns it
    */

    let expandableActions = this.getExpandableActions();

    if (expandableActions.length == 0) 
      throw new Error("No expandable actions");

    let actionTaken = RANDOM.choice<Action>(expandableActions);

    let index = expandableActions.indexOf(actionTaken);
    expandableActions.splice(index, 1);

    return actionTaken;
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

export class MCTS {

  private root: Node;
  private mctsConfig: MCTSConfig;

  constructor(rooNode: Node, mctsConfig: MCTSConfig) {
    this.root = rooNode;
    this.mctsConfig = mctsConfig;
  }

  public genGraph(dirOut: string) {

    /*
    Gera o grafo que representa esta árvore
    */

    let G = new Graph("G");
    G.node({'fontname': 'Courier'});

    // Adicionar este
    let rooNode = this.genRootGraphNode(G); 

    // Fazer primeira chamada da recursão
    this.root.genGraphNodes(G, rooNode);

    // Escrever no arquivo
    var fs = require('fs');
    fs.writeFileSync(dirOut, toDot(G));
  }

  public static nextGameAction(game: Game, mctsConfig: MCTSConfig): Action {
    
    /*
    Baseado num jogo inicial, cria uma árvore do MCTS,
    faz buscas e retorna a próxima melhor ação
    */

    const mcts = MCTS.createFromGame(game, mctsConfig);

    return mcts.nextAction();
  }

  public static createFromGame(game: Game, mctsConfig: MCTSConfig) {

    /*
    Creates a MCTS tree directly from a game
    */

    let node = new Node(null, game, null);
    return new MCTS(node, mctsConfig);
  }
  
  public nextAction(): Action {
    
    /*
    Faz buscas e retorna a próxima melhor ação
    */

    const action = this.searches();

    if (this.mctsConfig.genGraph)
      this.genGraph(`graphs/Turn: ${TURN++}.dot`);

    return action;
  }

  public searches(): Action {

    /*
    Faz diversas buscas baseada num critério de tempo total
    e retorna a próxima melhor ação
    */

    const searchesTime = this.mctsConfig.searchesTime;

    // Em caso de tempo definido
    if (searchesTime != null) {

      const startTime = Date.now();
      while ((Date.now() - startTime) < searchesTime)
        this.search();
    }

    // Em caso de tempo não definido
    else {

      for (let i=0; i<1_000; i++)
        this.search(); 
    }

    return this.mostVisitedChild().getActionTaken();
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

  private select(): Node {

    /* Selects first viable not fully expanded node */

    let node = this.root;

    while (!node.isExpandableOrTerminal()) 
      node = node.bestChild() as Node;

    return node;
  }
  
  private mostVisitedChild() {

    /*
    Retorna o child mais visitado do root
    */
    
    // Obs: É denecessário dividir pela quantidade total, já que o 
    // objetivo é escolher o mais visitado
    let visits = this.root.getChildren().map((child) => child.getVisits());
    let childIndex = visits.indexOf(Math.max(...visits));
    return this.root.getChildren()[childIndex];
  }

  private search(): void {

    /*
    Faz uma busca, realizando as 4 etapas do MCTS,
    com seleção, expanção, simulação e retro propagação
    */

    let node = this.select();
    let outcome: Outcome;
    const terminal = node.getGame().getTermination();

    //
    //  A REFERÊNCIA É SEMPRE O JOGADOR DO NÓ
    //

    if (terminal) {
      outcome = Node.getGameOutcome(node.getGame());
    } 
    
    else {
      node = node.expand();
      outcome = node.simulate();
    }

    node.backpropagate(outcome);
  }

  //==========
  // Getters
  //==========
  
  getRoot(): Node {
    return this.root;
  }
}
