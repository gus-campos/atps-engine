import { Node } from "./Node";
import { Game, Action } from "../shared/Game";
import { Graph, NodeModel, toDot } from "ts-graphviz";
import { Agent } from "../shared/Agent";

export enum Outcome {
  WIN = 1,
  DRAW = 0,
  LOSE = -1,
}

export const OUTCOME_VALUE = new Map<Outcome, number>([
  [Outcome.WIN, 1.0],
  [Outcome.DRAW, 0.5],
  [Outcome.LOSE, 0.0],
]);

export const OPPOSITE_OUTCOME = new Map<Outcome, Outcome>([
  [Outcome.WIN, Outcome.LOSE],
  [Outcome.DRAW, Outcome.DRAW],
  [Outcome.LOSE, Outcome.WIN],
]);

export interface MCTSConfig {
  searchesTime: number;
  searchesAmount: number;
  maxPlayoutDepth: number;
  genGraph: boolean;
  maxDepthPrinted: number;
}

export interface MCTSStats {
  nodesAmount: number;
  maxDepth: number;
  searchesAmount: number;
}

const DEFAULT_CONFIG: MCTSConfig = {
  genGraph: false,
  maxDepthPrinted: 10,
  searchesTime: 500,
  searchesAmount: null,
  maxPlayoutDepth: null,
};

let TURN = 0;

// =================================================

export class MCTSAgent implements Agent {
  private root: Node;
  private mctsConfig: MCTSConfig;
  private mctsStats: MCTSStats;

  constructor(game: Game, mctsConfig: MCTSConfig = null) {
    this.root = new Node(null, game, null);

    this.mctsStats = {
      searchesAmount: 0,
      nodesAmount: 0,
      maxDepth: 0,
    };

    this.mctsConfig = mctsConfig != null ? mctsConfig : DEFAULT_CONFIG;

    TURN = 0;
  }

  public genGraph(dirOut: string) {
    /*
    Gera o grafo que representa esta árvore
    */

    let G = new Graph("G");
    G.node({ fontname: "Courier" });

    // Adicionar este
    let rooNode = this.genRootGraphNode(G, 0);

    // Fazer primeira chamada da recursão
    this.root.genGraphNodes(G, rooNode, this.mctsConfig.maxDepthPrinted, 0);

    // Escrever no arquivo
    var fs = require("fs");
    fs.writeFileSync(dirOut, toDot(G));
  }

  public nextAction(): Action {
    /*
    Faz buscas e retorna a próxima melhor ação
    */

    const action = this.searches();

    if (this.mctsConfig.genGraph) this.genGraph(`graphs/Turn: ${TURN++}.dot`);

    return action;
  }

  // =============
  // PRIVATE
  //==============

  private searches(): Action {
    /*
    Faz diversas buscas baseada num critério de tempo total
    e retorna a próxima melhor ação
    */

    const searchesTime = this.mctsConfig.searchesTime;
    const searchesAmount = this.mctsConfig.searchesAmount;

    if (
      (searchesTime != null && searchesAmount != null) ||
      (searchesTime == null && searchesAmount == null)
    )
      throw new Error("One, and one only, searches criteria must be not null");

    // Em caso de tempo definido
    if (searchesTime != null) {
      const startTime = Date.now();
      while (Date.now() - startTime < searchesTime) this.search();
    }

    // Em caso de tempo não definido
    else {
      for (let i = 0; i < searchesAmount; i++) this.search();
    }

    const bestChild = this.mostVisitedChild();

    if (!bestChild) throw new Error("No child expanded.");

    return bestChild.getActionTaken();
  }

  private genRootGraphNode(G: Graph, id: number): NodeModel {
    /* Generates a node to be added in a graphviz graph */

    let label = this.root.nodeToString();
    let childNode = G.node(String(id), { label: label });
    G.addNode(childNode);

    return childNode;
  }

  private select(): Node {
    /* Selects first viable not fully expanded node */

    let node = this.root;

    while (!node.isExpandableOrTerminal()) node = node.bestChild() as Node;

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
    Faz uma busca, realizando as 4 etapas do MCTSAgent,
    com seleção, expanção, simulação e retro propagação
    */

    // Atualizando quantidade de buscas
    this.mctsStats.searchesAmount++;

    let node = this.select();
    let outcome: Outcome;
    const terminal = node.getGame().isGameOver();

    if (terminal) {
      outcome = node.getGameOutcome(node.getGame());
    } else {
      node = node.expand();

      // Atualizando quantidade de nós
      this.mctsStats.nodesAmount++;

      // Atualizando profundidade máxima
      const depth = node.getDepth();
      if (depth > this.mctsStats.maxDepth) this.mctsStats.maxDepth = depth;

      outcome = node.simulate(this.mctsConfig.maxPlayoutDepth);
    }

    node.backpropagate(outcome);
  }

  //==========
  // Getters
  //==========

  getRoot(): Node {
    return this.root;
  }

  getStats(): MCTSStats {
    return this.mctsStats;
  }
}
