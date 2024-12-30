import { Node, GameTree, Outcome, random } from "../shared/GameTree";
import { Game, Action, Player } from "../shared/Game"
import { override } from "prompts";


export class NodeMCTS extends Node {

  constructor(parent: Node, game: Game, actionTaken: Action) {
    super(parent, game, actionTaken);
  }

  @override
  public expand(): NodeMCTS {
  
    let actionTaken = this.getRandomExpAction();

    let newGame = this.game.clone();
    newGame.playAction(actionTaken);

    let child = new NodeMCTS(this, newGame, actionTaken);
    this.children.push(child);

    return child;
  }

  public simulate(maximizingPlayer: Player): Outcome {

    let game = this.game.clone();

    while (!game.getTermination()) {
      let action = random.choice(game.getValidActions());
      game.playAction(action);
    }

    return this.getGameOutcome(game, maximizingPlayer);
  }
}

export class MCTS extends GameTree<NodeMCTS> {

  constructor(rootNode: NodeMCTS) {
    super(rootNode);
  }
  
  public static nextGameAction(game: Game, timeCriteria: number, genGraph: boolean=false): Action {
    
    const mcts = MCTS.createFromGame(game);

    if (genGraph)
      mcts.genGraph('graph.dot');

    return mcts.nextAction(timeCriteria);
  }

  public static createFromGame(game: Game) {
    let node = new NodeMCTS(null, game, null);
    return new MCTS(node);
  }
  
  public nextAction(timeCriteria: number): Action {
    
    return this.searches(timeCriteria);
  }

  public searches(timeCriteria: number): Action {

    let startTime = Date.now();
    while (Date.now() - startTime < timeCriteria) 
      this.search();

    let visits = this.root.getChildren().map((child) => child.getVisits());
    let childIndex = visits.indexOf(Math.max(...visits));
    return this.root.getChildren()[childIndex].getActionTaken();
  }

  private search() {

    let node = this.select();
    let outcome: Outcome;
    const terminal = node.getGame().getTermination();

    if (terminal) {
      outcome = node.getGameOutcome(node.getGame(), this.maximizingPlayer);
    } 
    
    else {
      node = node.expand();
      outcome = node.simulate(this.maximizingPlayer);
    }

    node.backpropagate(outcome);
  }
} 
