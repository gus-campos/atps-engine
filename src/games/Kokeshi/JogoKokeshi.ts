import { Peca } from "./Peca";

import { Jogador, Kokeshi, Animal, Opcoes, Movimento } from "./Types";
import { TabuleiroAnimais } from "./TabuleiroAnimais";
import { TabuleiroHabilidades } from "./TabuleiroHabilidades";

import {
  Acao,
  MoverAnimal,
  MoverKokeshi,
  PosicionarPeca,
  EspecificarKokeshi,
  EspecificarAnimal,
  AcaoMultipla,
  EspecificarAcaoMultipla,
  ComprarPeca,
  EspecificarPosicao,
} from "./Acao";

import {
  RANDOM_IN_RANGE,
  NUMERO_JOGADORES,
  PECAS_INICIAIS,
  PECAS_OFERTA,
} from "./Globals";

export class JogoKokeshi {
  /* Representa um jogo de Kokeshi */

  private tabuleiroAnimais: TabuleiroAnimais;
  private tabuleirosHabilidades: TabuleiroHabilidades[];

  // Ações de cada jogador que estão em fila para serem executadas
  // Exemplo: acoesPendentes[1][4] - a quarta ação pendente do jogador 1
  private acoesPendentes: Acao[][];
  // Peças iniciais que são posicionadas no início do jogo
  private pecasIniciais: Peca[];
  // Peças que podem ser compradas durante o jogo
  private ofertaPecas: Peca[];
  private jogadorAtual: Jogador;
  // Pontuação registrada normalmente no tabuleiro de animais
  private pontuacao: number[];
  // Peças de cada jogador que foram compradas, e vão ser posicionadas
  // Exemplo: pecasReservadas[1][4] - a quarta peça reservada do jogador 1
  private pecasReservadas: Peca[][];

  constructor() {
    this.tabuleiroAnimais = new TabuleiroAnimais();
    this.tabuleirosHabilidades = Array.from(
      Array(NUMERO_JOGADORES),
      () => new TabuleiroHabilidades()
    );
    this.pecasIniciais = PECAS_INICIAIS.map((peca) => peca.clone());
    this.ofertaPecas = PECAS_OFERTA.map((peca) => peca.clone());

    this.pecasReservadas = Array(NUMERO_JOGADORES);
    this.acoesPendentes = Array(NUMERO_JOGADORES);
    this.pontuacao = Array(NUMERO_JOGADORES);

    for (let jogador = 0; jogador < NUMERO_JOGADORES; jogador++) {
      // No início comprar duas peças para cada jogador
      this.pecasReservadas[jogador] = [
        this.comprarDoInicial(),
        this.comprarDoInicial(),
      ];

      // Na primeira jogada, o jogador deve posicionar as peças iniciais
      this.acoesPendentes[jogador] = [
        new PosicionarPeca(),
        new PosicionarPeca(),
      ];

      this.pontuacao[jogador] = 0;
    }

    this.jogadorAtual = 0;
  }

  public playAction(acao: Acao): void {
    const acoesPendentes = this.acoesPendentes[this.jogadorAtual];
    const pecasReservadas = this.pecasReservadas[this.jogadorAtual];

    // Espera uma ação de especificação e a usa para especificar a ação pendente
    this.especificarAcao(acao);
    // Excuta quantas ações pendentes até esvaziar a fila
    // ou até chegar numa ação não especificada
    this.executarEspecificadas();

    // Se executou todas as ações pendentes, começa a fase de posicionamento
    // (se for o caso)
    if (acoesPendentes.length == 0) {
      if (pecasReservadas.length != 0) {
        // Encontra as peças que podem ser posicionadas automaticamente
        // (independentes de escolha)
        const reservadasIndepenentes = this.removerReservadasIndependentes();

        // Enfileira as ações de posicionamento, para serem executadas em
        // seguida
        for (const peca of reservadasIndepenentes) {
          acoesPendentes.push(new PosicionarPeca(peca.getPosicao()));
          pecasReservadas.push(peca);
        }

        // Executa as ações de posicionamento automáticas
        this.executarEspecificadas();
      }

      this.finalizarTurno();
    }
  }

  private removerReservadasIndependentes(): Peca[] {
    /* Retorna as peças que não são afetadas pela ordem de posicionamento, e que
    portanto não dependem da escolha do jogador. 
    
    Peça livre é uma peça que pode ser posicionada em qualquer trilha, e no jogo
    real, fica reservada ao lado do tabuleiro, invés de reservada em frente de 
    uma trilha.

    Uma peça é de posicionamento automático, ou livre, ou sem necessidade de 
    intervenção, quando é a única de sua trilha. */

    // Todas as peças reservadas do jogador atual
    let pecasReservadas = this.pecasReservadas[this.jogadorAtual];

    // Peças reservadas "em frente" de cada trilha só podendo serem posicionadas
    // em tal trilha
    const pecasDasTrilhas: Peca[][] = Array.from(
      Array(TabuleiroHabilidades.tamanho),
      (): Peca[] => []
    );

    // Separar peças reservadas por trilhas
    for (const peca of pecasReservadas) {
      const posicao = peca.getPosicao();

      // Se alguma peça reservada for livre, não existe nenhuma
      // peça que possa ser posicionada automaticamente
      if (posicao == null) return [];

      pecasDasTrilhas[posicao].push(peca);
    }

    const qtdPorTrilha = pecasDasTrilhas.map((trilhas) => trilhas.length);

    // Função auxiliar que remove uma peca específica do array de reserva
    const removeReserva = (peca: Peca) => {
      const index = pecasReservadas.indexOf(peca);
      if (index == -1) throw new Error("Item não encontrado.");
      this.pecasReservadas[this.jogadorAtual].splice(index);
    };

    // Move peças de posicionamento independente para um array específico
    // removendo-a do array geral do estado do jogo
    const pecasLivres = [];

    for (let i = 0; i < pecasDasTrilhas.length; i++) {
      // Um peça é de posicionamento independente, quando é a única de sua
      // trilha
      if (qtdPorTrilha[i] == 1) {
        const peca = pecasDasTrilhas[i][0];

        pecasLivres.push(peca);
        removeReserva(peca);
      }
    }

    return pecasLivres;
  }

  private executarEspecificadas(): void {
    /* Executa ações da fila enquanto elas já estiverem especificadas. */

    while (
      this.acoesPendentes[this.jogadorAtual].length != 0 &&
      this.acoesPendentes[this.jogadorAtual].at(-1).especificada()
    ) {
      this.executarUltimaAcao();
    }
  }

  private finalizarTurno() {
    /* Passa a vez para o próximo jogador e faz a inicialização do próximo turno
    (sempre começando com uma ação de mover uma kokeshi). */

    this.jogadorAtual = this.proximoJogador();

    if (this.acoesPendentes[this.jogadorAtual].length == 0)
      this.acoesPendentes[this.jogadorAtual] = [new MoverKokeshi(Opcoes.TODAS)];
  }

  private proximoJogador(): Jogador {
    /* Calcula próximo jogador a jogar. */

    return (this.jogadorAtual + 1) % NUMERO_JOGADORES;
  }

  // ===========================================================================

  private executarUltimaAcao(): Peca | null {
    /* Executa a última ação pendente (assume que ela já está especificada. */

    let acoes = this.acoesPendentes[this.jogadorAtual];

    if (acoes.at(-1) == null)
      throw new Error("Ação deve estar especificada antes de ser executada.");

    // Última ação
    const acao = acoes.pop();

    // (isso é basicamente um case switch considerando tipos das classes que
    // herdam de ação)
    if (acao instanceof MoverKokeshi) this.executarMoverKokeshi(acao);
    else if (acao instanceof AcaoMultipla) this.executarAcaoMultipla(acao);
    else if (acao instanceof MoverAnimal) this.moverAnimal(acao.getAnimal());
    else if (acao instanceof PosicionarPeca) this.executarPosicionarPeca(acao);
    else if (acao instanceof ComprarPeca) this.executarComprarPeca(acao);
    else throw new Error("Nenhuma ação executada.");

    return null;
  }

  private executarMoverKokeshi(acao: MoverKokeshi): void {
    /* Processa o necessário para executar a ação de mover kokeshi. Move a 
    kokeshi e retorna a peça que estiver na posição onde a kokeshi parou. 
    
    OBS: Ação MoverKokeshi com movimento "Movimento.RETORNO" não retorna peça, 
    retorna "null". */

    const peca = this.moverKokeshi(acao.getKokeshi(), acao.getMovimento());

    // Se retornar peça (não for de retorna, enfileirar ação como pendente)
    if (peca != null)
      this.acoesPendentes[this.jogadorAtual].push(peca.getAcao());
  }

  private executarAcaoMultipla(acao: AcaoMultipla): void {
    /* Processa o necessário para executar a ação AcaoMultipla. Para executar 
    uma ação múltipla é necessário que ela esteja especificada, que significa 
    que não é necessário escolher entre suas duas ações 
    (acaoMultipla.dupla == true).
    
    Executar uma ação dupla significa colocar suas duas ações na fila de ações
    pendente. 
    
    Ações múltiplas que não são "duplas", precisam ser especificadas através de 
    ação de especificação. */

    if (!acao.especificada())
      throw new Error(
        "Para ser executada a ação múltipla precisa estar especificada (deve ser dupla)."
      );

    this.acoesPendentes[this.jogadorAtual].push(...acao.getAcoes());
  }

  private executarPosicionarPeca(acao: PosicionarPeca): void {
    /* Executa ação de posicionar uma peça (posiciona a última peça que estava 
    reservada da fila) de acordo com a posição especificada na ação. */

    const pecasReservadas = this.pecasReservadas[this.jogadorAtual];

    if (pecasReservadas.at(-1) == null)
      throw new Error("Não pode adicionar peça nula.");

    const peca = pecasReservadas.pop();
    this.posicionarPeca(peca, acao.getPosicao());
  }

  private executarComprarPeca(acao: ComprarPeca): void {
    /* Executa ação de posicionar peça (compra uma peça da oferta e posiciona na
    posição especificada pela  ação). */

    const peca = this.comprarDaOferta();

    const posicionamento = acao.getPosicao();
    if (posicionamento != null) peca.associarPosicao(posicionamento);

    this.pecasReservadas[this.jogadorAtual].push(peca);
  }

  // =============================================================================

  private especificarAcao(especificacao: Acao): void {
    /* Especifica a última ação que estava pendente, a partir de uma ação de 
    especificação. No jogo, a ação de especificação passada deve ser sempre
    compatível com a última ação a ser especificada. */

    const acoes = this.acoesPendentes[this.jogadorAtual];
    const acaoPendente = acoes.at(-1);
    const acaoEspecificada = this.acaoEspecificada(acaoPendente, especificacao);

    if (acaoPendente == null) throw new Error("Nenhuma ação pendente.");

    if (acaoPendente.especificada())
      throw new Error(
        "Ação a ser especificada não pode estar previamente especificada."
      );

    if (acaoEspecificada == null) throw new Error("Especificação inválida.");

    acoes[acoes.length - 1] = acaoEspecificada;
  }

  private acaoEspecificada(acao: Acao, especificacao: Acao): Acao | null {
    /* A partir de uma ação não especificada, e uma ação de especificação, 
    retorna uma ação especificada. */

    if (
      acao instanceof MoverKokeshi &&
      especificacao instanceof EspecificarKokeshi
    )
      return acao.especificar(especificacao.getKokeshi());

    if (
      acao instanceof PosicionarPeca &&
      especificacao instanceof EspecificarPosicao
    )
      return acao.especificar(especificacao.getPosicao());

    if (
      acao instanceof MoverAnimal &&
      especificacao instanceof EspecificarAnimal
    )
      return acao.especificar(especificacao.getAnimal());

    if (
      acao instanceof AcaoMultipla &&
      especificacao instanceof EspecificarAcaoMultipla
    )
      return acao.escolherAcao(especificacao.getEscolha());

    if (
      acao instanceof AcaoMultipla &&
      especificacao instanceof EspecificarAcaoMultipla
    )
      return acao.escolherAcao(especificacao.getEscolha());

    return null;
  }

  // ===========================================================================

  private posicionarPeca(peca: Peca, posicao: Kokeshi): void {
    /* Posiciona uma peça, no tabuleiro de habilidade do jogador atual. */

    const tabuleiro = this.tabuleirosHabilidades[this.jogadorAtual];
    tabuleiro.adicionar(peca, posicao);
  }

  private moverAnimal(animal: Animal): void {
    /* Avança a ficha do jogador atual, na devida trilha do tabuleiro de 
    animais */

    this.tabuleiroAnimais.avancar(animal, this.jogadorAtual);
  }

  private moverKokeshi(
    kokeshi: Kokeshi,
    movimento: Movimento = Movimento.SIMPLES
  ): Peca {
    /* Move uma kokeshi especificada do jogador atual. */

    const tabuleiroJogador = this.tabuleirosHabilidades[this.jogadorAtual];
    return tabuleiroJogador.moverKokeshi(kokeshi, movimento);
  }

  private comprarDaOferta(): Peca {
    /* Remove uma peça do estoque de oferta e a retorna. */

    return this.removerPeca(this.ofertaPecas);
  }

  private comprarDoInicial(): Peca {
    /* Remove uma peça do estoque inicial e a retorna. */

    return this.removerPeca(this.pecasIniciais);
  }

  private removerPeca(estoque: Peca[]): Peca {
    /* Dado um array de peças, remove uma peça aleatória dele,
    e retorna a peça. */

    if (estoque.length == 0)
      throw new Error("Não é possível pegar peça de estoque vazio.");

    const index = RANDOM_IN_RANGE(estoque.length);

    return estoque[index];
  }

  public toString(): string {
    /* Retorna uma string que representa o jogo. */

    // TODO: Mostrar peças a serem posicionadas?

    let string = "";
    const tracos = 73;

    string += "=".repeat(tracos);

    string += "\n\n" + this.tabuleiroAnimais.toString() + "\n\n";

    for (let tabuleiro of this.tabuleirosHabilidades)
      string += tabuleiro.toString() + "\n";

    string += "=".repeat(tracos);

    return string;
  }
}
