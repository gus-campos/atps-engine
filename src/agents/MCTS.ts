import { Node, GameTree, Outcome } from "../shared/GameTree";
import { Game, Action, Player } from "../shared/Game"
import { RANDOM } from "src/utils/Random";

const MAX_PLAYOUT_DEPTH = Number.POSITIVE_INFINITY;

export class NodeMCTS extends Node {

  constructor(parent: Node, game: Game, actionTaken: Action) {
    super(parent, game, actionTaken);
  }

  public override expand(): NodeMCTS {
  
    let actionTaken = this.getRandomExpAction();

    let newGame = this.game.clone();
    newGame.playAction(actionTaken);

    let child = new NodeMCTS(this, newGame, actionTaken);
    this.children.push(child);

    return child;
  }

  public simulate(maximizingPlayer: Player): Outcome {

    let playoutDepth = 0;
    let game = this.game.clone();

    while (!game.getTermination()) {
      let action = RANDOM.choice<Action>(game.getValidActions());
      game.playAction(action);

      // Limiting playout depth
      playoutDepth++;
      if (playoutDepth >= MAX_PLAYOUT_DEPTH)
        return Outcome.DRAW;
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

    //let startTime = Date.now();
    //while (Date.now() - startTime < timeCriteria) 
    for (let i=0; i<200; i++)
      this.search();

    // Obs: É denecessário dividir pela quantidade total, já que o 
    // objetivo é escolher o mais visitado
    let visits = this.root.getChildren().map((child) => child.getVisits());
    let childIndex = visits.indexOf(Math.max(...visits));
    return this.root.getChildren()[childIndex].getActionTaken();
  }

  private search(): void {

    this.genGraph("graph.dot");

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
