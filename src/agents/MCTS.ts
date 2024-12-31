import { Node, GameTree, Outcome } from "../shared/GameTree";
import { Game, Action, Player } from "../shared/Game"
import { RANDOM } from "src/utils/Random";

const MAX_PLAYOUT_DEPTH = Number.POSITIVE_INFINITY;

export class NodeMCTS extends Node {

  constructor(parent: Node, game: Game, actionTaken: Action) {
    super(parent, game, actionTaken);
  }

  public override expand(): NodeMCTS {

    /*
    Expande o nó, com um NodeMCTS e não um Node comum
    */
  
    let actionTaken = this.getRandomExpAction();

    let newGame = this.game.clone();
    newGame.playAction(actionTaken);

    let child = new NodeMCTS(this, newGame, actionTaken);
    this.children.push(child);

    return child;
  }

  public simulate(maximizingPlayer: Player): Outcome {

    /*
    Joga o jogo com ações aleatórias, até o fim, e
    retorna seu resultado, em relação ao maximizing player
    */

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
    
    /*
    Baseado num jogo inicial, cria uma árvore do MCTS,
    faz buscas e retorna a próxima melhor ação
    */

    const mcts = MCTS.createFromGame(game);

    if (genGraph)
      mcts.genGraph('graph.dot');

    return mcts.nextAction(timeCriteria);
  }

  public static createFromGame(game: Game) {

    /*
    Creates a MCTS tree directly from a game
    */

    let node = new NodeMCTS(null, game, null);
    return new MCTS(node);
  }
  
  public nextAction(timeCriteria: number): Action {
    
    /*
    Faz buscas e retorna a próxima melhor ação
    */

    return this.searches(timeCriteria);
  }

  public searches(timeCriteria: number): Action {

    /*
    Faz diversas buscas baseada num critério de tempo total
    e retorna a próxima melhor ação
    */

    let startTime = Date.now();
    while (Date.now() - startTime < timeCriteria) 
      this.search();

    return this.mostVisitedChild().getActionTaken();
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

    // Debug
    //this.genGraph("graph.dot");

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
