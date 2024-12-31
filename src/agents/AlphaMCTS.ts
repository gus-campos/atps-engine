import { Action, Game, Outcome } from "src/shared/Game";
import { GameTree, Node } from "../shared/GameTree";

class NodeAlphaZero extends Node {

  constructor(parent: Node, game: Game, actionTaken: Action) {
    super(parent, game, actionTaken);
  }

  public override expand(): NodeAlphaZero {
  
    let actionTaken = this.getRandomExpAction();

    let newGame = this.game.clone();
    newGame.playAction(actionTaken);

    let child = new NodeAlphaZero(this, newGame, actionTaken);
    this.children.push(child);

    return child;
  }
}

export class MCTS extends GameTree<NodeAlphaZero> {

  constructor(rootNode: NodeAlphaZero) {
    super(rootNode);
  }
  
  public static nextGameAction(game: Game, timeCriteria: number, genGraph: boolean=false) {//: Action {
    
    const mcts = MCTS.createFromGame(game);

    if (genGraph)
      mcts.genGraph('graph.dot');

    return mcts.nextAction(timeCriteria);
  }

  private static createFromGame(game: Game) {
    let node = new NodeAlphaZero(null, game, null);
    return new MCTS(node);
  }
  
  public nextAction(timeCriteria: number) {//: Action {
    
    return this.searches(timeCriteria);
  }

  private searches(timeCriteria: number) {//: Action {

    let startTime = Date.now();
    while (Date.now() - startTime < timeCriteria) 
      this.search();
  }

  private search() {

  }
} 

interface Prediction {
  policies: number[],
  value: Outcome
}

class AlphaZero {

  // Deve receber o jogo
  // Deve retornar

  private game: Game;
  
  constructor(game: Game) {
    this.game = game;
  }

  public predict() {//: Prediction {

    const channels = this.game.getChannels();
  }
}
