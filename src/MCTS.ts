import { Game, Action } from "./Game";
import { XORShift } from "random-seedable";

let seed = Date.now();//100;
const random = new XORShift(seed);

enum Outcome {
  WIN,
  LOSE,
  DRAW
}

let outcomeValues = new Map();
outcomeValues.set(Outcome.WIN, 1);
outcomeValues.set(Outcome.LOSE, 0);
outcomeValues.set(Outcome.DRAW, 0.5);

// =================================================

export class Node {

  private game: Game;
  private actionTaken: (Action|null);
  private parent: (Node|null);

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

    if (expandableActions.length == 0)
      throw new Error("No expandable actions");

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

  public simulate(): number {

    let game = this.game.clone();

    while (!game.getTermination()) {
        
      let action = random.choice(game.getValidActions());
      game.playAction(action);
    }

    if (game.getWinner() == null)
      return outcomeValues.get(Outcome.DRAW);

    if (game.getWinner() == this.game.getCurrentPlayer())
      return outcomeValues.get(Outcome.WIN);

    return outcomeValues.get(Outcome.LOSE);
  }

  public backpropagate(value: number) {
    
    this.visits++;
    this.value += value;
    
    if (this.parent != null) {
      this.parent.backpropagate(1-value);
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
  
  constructor(root: Node) {
    this.root = root;
  }

  private select(): Node {

    /* Selects first leaf node in a chain of best childs */
    
    let node = this.root;

    // Procura o primeiro leaf node seguindo o caminho dos melhores
    // Quando chega num jogo terminado, dá erro, pois é considerado não expandido

    while (node.isFullyExpanded())
        node = node.bestChild();

    return node;
  }

  search() {
    
    let node = this.select();

    // TODO: Fix value
    let terminal = node.getGame().getTermination();
    let value = node.getGame().getAbsValue();

    if (!terminal) { 
      node = node.expand();
      value = node.simulate();
    }

    node.backpropagate(value);   
  }

  searches(): Action {

    for (let i=0; i<1_000; i++)
      this.search();
    
    let visits = this.root.getChildren().map(child => child.getVisits());
    let childIndex = visits.indexOf(Math.max(...visits));
    return this.root.getChildren()[childIndex].getActionTaken();
  }

  // Getters
  getRoot(): Node {
    return this.root;
  }
}
