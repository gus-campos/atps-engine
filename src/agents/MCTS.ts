import { Node, GameTree, Outcome } from "../shared/GameTree";
import { Game, Action, Player } from "../shared/Game"
import { RandomAgent } from "src/agents/RandomAgent";

const STANDARD_TIME_CRITERIA: number = 1000;
let TURN: number = 0;

export interface MCTSConfig {

  searchesTime: number,
  maxPlayoutDepth: number
}

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

  public simulate(maximizingPlayer: Player, maxPlayoutDepth: number=null): Outcome {

    /*
    Joga o jogo com ações aleatórias, até o fim, e
    retorna seu resultado, em relação ao maximizing player
    */

    let playoutDepth = 0;
    let game = this.game.clone();

    while (!game.getTermination()) {
      let action = RandomAgent.nextGameAction(game);
      game.playAction(action);

      // Limitando profundidade das jogadas na simulação
      if (maxPlayoutDepth != null) {
        playoutDepth++;
        if (playoutDepth >= maxPlayoutDepth)
          return Outcome.DRAW;
      }
    }

    return this.getGameOutcome(game, maximizingPlayer);
  }
}

export class MCTS extends GameTree<NodeMCTS> {

  private mctsConfig: MCTSConfig;

  constructor(rootNode: NodeMCTS, mctsConfig: MCTSConfig) {
    super(rootNode);
    this.mctsConfig = mctsConfig;
  }
  
  public static nextGameAction(game: Game, mctsConfig: MCTSConfig, genGraph: boolean=false): Action {
    
    /*
    Baseado num jogo inicial, cria uma árvore do MCTS,
    faz buscas e retorna a próxima melhor ação
    */

    const mcts = MCTS.createFromGame(game, mctsConfig);

    return mcts.nextAction(genGraph);
  }

  public static createFromGame(game: Game, mctsConfig: MCTSConfig) {

    /*
    Creates a MCTS tree directly from a game
    */

    let node = new NodeMCTS(null, game, null);
    return new MCTS(node, mctsConfig);
  }
  
  public nextAction(genGraph: boolean=false): Action {
    
    /*
    Faz buscas e retorna a próxima melhor ação
    */

    const action = this.searches();

    if (genGraph)
      this.genGraph(`graphs/${TURN++}.dot`);

    return action;
  }

  public searches(): Action {

    /*
    Faz diversas buscas baseada num critério de tempo total
    e retorna a próxima melhor ação
    */

    if (this.mctsConfig.searchesTime == null)
      this.mctsConfig.searchesTime = STANDARD_TIME_CRITERIA;
    
    let startTime = Date.now();
    while (Date.now() - startTime < this.mctsConfig.searchesTime) 
      this.search(this.mctsConfig.maxPlayoutDepth);

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

  private search(maxPlayoutDepth: number=null): void {

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
      outcome = node.simulate(this.maximizingPlayer, maxPlayoutDepth);
    }

    node.backpropagate(outcome);
  }
} 
