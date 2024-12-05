import { Game, State, Action } from "../src/Game";

export type Args = {
  C: number;
  searches: number;
};

export class Node {
  private readonly game: Game;
  private readonly args: Args;
  private readonly state: State;
  private readonly parent: Node | null;
  private readonly actionTaken: Action | null;

  private children: Node[];
  private expandableActions: Action[];

  private visitCount: number;
  private valueSum: number;

  constructor(
    game: Game,
    args: Args,
    state: State,
    parent: Node | null = null,
    actionTaken: Action | null = null
  ) {
    this.game = game;
    this.args = args;
    this.state = state;
    this.parent = parent;
    this.actionTaken = actionTaken;

    this.children = [];
    this.expandableActions = game.getValidActions(state);

    this.visitCount = 0;
    this.valueSum = 0;
  }

  public removeRandomAction(): Action {
    /*
    Remove ação aleatória do array de ações expandíveis e a retorna
    */

    // Asserting
    if (this.expandableActions.length == 0)
      throw new Error("No expandable action in the pool");

    let randomIndex = Math.floor(Math.random() * this.expandableActions.length);
    let action = this.expandableActions.splice(randomIndex, 1)[0];
    return action;
  }

  public isFullyExpanded(): boolean {
    /* Determina se todos os possíveis child deste node já foram criados */

    // TODO :Entender pq o segundo termo é necessário, e tão importante!
    return this.children.length > 0 && this.expandableActions.length == 0;
  }

  public getUcb(child: Node): any {
    /* Calcula o UCB de um child em relação ao seu parent */

    // A razão de vitória
    // Transformando para que o valor fique entre 0 e 1 (probabilidade)
    // Mudando ucb para a perspectiva do parent já que o filho é o adversário
    let exploit = child.valueSum / child.visitCount;
    exploit = (exploit + 1) / 2;
    exploit = 1 - exploit;

    let explore =
      this.args.C * Math.sqrt(Math.log(this.visitCount) / child.visitCount);

    return exploit + explore;
  }

  public getBestChild(): Node {
    /* A partir de um parent, retorna seu child node de maior UCB */

    // TODO: Melhorar essa inicialização?
    let bestChild: Node | null = null;
    let bestUcb = Number.NEGATIVE_INFINITY;

    for (const child of this.children) {
      let ucb = this.getUcb(child);

      if (ucb > bestUcb) {
        bestChild = child;
        bestUcb = ucb;
      }
    }

    // Asserting
    if (bestChild == null) throw new Error("bestChild is null");

    return bestChild!;
  }

  public expand(): Node {
    /* Cria um child a partir de uma ação aleatória */

    // nova ação
    let action = this.removeRandomAction();

    // novo estado
    let childState = this.game.getNextState(this.state, action);
    //childState = this.game.changePerspective(childState, this.game.getNumberOfPlayers(), 0);

    // novo child
    let child = new Node(this.game, this.args, childState, this, action);
    this.children.push(child);
    return child;
  }

  public simulate(): number {
    /* 
    Simula jogadas aleatórias até chegar em um resultado, 
    retornando valor resultante
    */

    let currentState = structuredClone(this.state);
    let action, value;

    while (true) {
      // Verificando terminação e definindo valor de acordo com o player
      value = this.game.getValue(currentState);
      if (this.game.getTermination(currentState)) {
        // Se é o mesmo jogador do início da simulação, considerar resultado como sendo favorável
        let factor = currentState.lastPlayer == this.state.lastPlayer ? 1 : -1;
        return value * factor;
      }

      // Ação aleatória
      let validActions = this.game.getValidActions(currentState);
      let randomIndex = Math.floor(Math.random() * validActions.length);
      action = validActions[randomIndex];

      // Atualizar estado
      currentState = this.game.getNextState(currentState, action);
    }
  }

  public backpropagate(value: number) {
    /* 
    Propaga o valor obtido em um nó, através de simulação, para seus 
    parents, recursivamente.

    Obs: O valor propagado invertido, pois o player do parent é sempre 
    adversário do player do child.
    */

    this.visitCount++;
    this.valueSum += value;

    if (this.parent != null) this.parent.backpropagate(-value);
  }

  // ========= Getters

  public getExpandableAmount() {
    /* Retorna quantos childs ainda podem ser expandidos */
    return this.expandableActions.filter((expandable) => expandable).length;
  }

  public getActionTaken() {
    if (this.actionTaken == null) throw new Error("Action taken is null");
    return this.actionTaken;
  }

  public getChildren() {
    return this.children;
  }
  public getParent() {
    return this.parent;
  }
  public getState() {
    return this.state;
  }
  public getValueSum() {
    return this.valueSum;
  }
  public getVisitCount() {
    return this.visitCount;
  }
  public getExpandableActions() {
    return this.expandableActions;
  }

  // Setters (for testing)
  public setVisitCount(count: number) {
    this.visitCount = count;
  }
  public setValueSum(sum: number) {
    this.valueSum = sum;
  }
}

export class MCTS {
  private readonly game: Game;
  private readonly args: Args;

  constructor(game: Game, args: Args) {
    this.game = game;
    this.args = args;
  }

  search(state: State): Action {
    /* Realiza uma busca de MCTS e retorna a melhor ação a ser jogada */

    let root = new Node(this.game, this.args, state);

    for (let i = 0; i < this.args.searches; i++) {
      // Selecionar leaf node
      let child = root;

      while (child.isFullyExpanded()) child = child.getBestChild();

      // Expansão e simulação
      let value = this.game.getValue(child.getState());
      if (!this.game.getTermination(child.getState())) {
        child = child.expand();
        value = child.simulate();
      }

      let factor =
        root.getState().lastPlayer == child.getState().lastPlayer ? 1 : -1;
      child.backpropagate(factor * value);
    }

    // Calculando e retornando probabilidades, baseado no número de visitas

    let rootChildren = root.getChildren();

    let probs = Array(rootChildren.length).fill(0);
    for (let i = 0; i < rootChildren.length; i++)
      probs[i] = rootChildren[i].getVisitCount();

    // Normalizando
    let sum = probs.reduce((a, b) => a + b, 0);
    probs = probs.map((visits) => visits / sum);

    // Retornado melhor
    let bestChild = probs.indexOf(Math.max(...probs));
    let bestAction = rootChildren[bestChild].getActionTaken();

    return bestAction;
  }
}
