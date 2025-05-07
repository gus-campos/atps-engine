
import { Peca } from "./Peca";

import { Jogador, Kokeshi, Animal, Opcoes, Movimento } from "./Types";
import { TabuleiroAnimais } from "./TabuleiroAnimais";
import { TabuleiroHabilidades } from "./TabuleiroHabilidades";

import { 
  Acao, MoverAnimal, MoverKokeshi, PosicionarPeca, 
  EspecificarKokeshi, EspecificarAnimal, AcaoMultipla,
  EspecificarAcaoMultipla, ComprarPeca,
  EspecificarPosicao
} from "./Acao"

import { 
  RANDOM_IN_RANGE, 
  NUMERO_JOGADORES, 
  PECAS_INICIAIS, 
  PECAS_OFERTA
} from "./Globals"

export class JogoKokeshi {

  private tabuleiroAnimais: TabuleiroAnimais;
  private tabuleirosHabilidades: TabuleiroHabilidades[];
  
  private acoesPendentes: Acao[][];
  private pecasIniciais: Peca[];
  private ofertaPecas: Peca[];

  private jogadorAtual: Jogador;
  private pontuacao: number[];
  
  private pecasReservadas: Peca[][];

  constructor() { 

    this.tabuleiroAnimais = new TabuleiroAnimais();
    this.tabuleirosHabilidades = Array.from(Array(NUMERO_JOGADORES), () => new TabuleiroHabilidades());
    this.pecasIniciais = PECAS_INICIAIS.map(peca => peca.clone());
    this.ofertaPecas = PECAS_OFERTA.map(peca => peca.clone());

    this.pecasReservadas = Array(NUMERO_JOGADORES);
    this.acoesPendentes = Array(NUMERO_JOGADORES);
    this.pontuacao = Array(NUMERO_JOGADORES);

    for (let jogador = 0; jogador < NUMERO_JOGADORES; jogador++) {

      this.pecasReservadas[jogador] = [ this.comprarDoInicial(), this.comprarDoInicial() ];
      this.acoesPendentes[jogador] = [ new PosicionarPeca(), new PosicionarPeca() ];
      this.pontuacao[jogador] = 0;

    }

    this.jogadorAtual = 0;
  }

  public jogarAcao(acao: Acao): void {

    /* Modifica o estado do jogo de acordo com uma
    ação passada. */

    const acoesPendentes = this.acoesPendentes[this.jogadorAtual];
    const pecasReservadas = this.pecasReservadas[this.jogadorAtual];

    this.especificarAcao(acao);
    this.executarEspecificadas();

    if (acoesPendentes.length == 0) {

      if (pecasReservadas.length != 0) {

        const reservadasIndepenentes = this.removerReservadasIndependentes();

        for (const peca of reservadasIndepenentes) {
      
          acoesPendentes.push(new PosicionarPeca(peca.getPosicao()));
          pecasReservadas.push(peca);
        }

        this.executarEspecificadas();
      }

      this.finalizarTurno();
    }
  }

  private removerReservadasIndependentes(): Peca[] {

    /* Retorna as peças que não são afetadas pela ordem
    de posicionamento. 
    
    Casos:

      // FIXME: Peça geral sempre exige intervenção

      1. Alguma peça geral com alguma peça nas trilhas: 
      a peça geral pode ser colocada na mesma trilha
      da peça específica, em ordens diferentes.

      2. Mais de uma peça geral: Podem ser colocadas numa 
      mesma trilha em ordens diferentes.

      3. Nenhuma peça geral, uma peça na trilha: tem
      posicionamento único.
      
      4. Nenhuma peça geral, mais de uma peça na trilha:
      podem ser colocadas em ordens diferentes.

    */ 

    let pecasReservadas = this.pecasReservadas[this.jogadorAtual];
    
    const pecasDasTrilhas: Peca[][] = Array.from(
      Array(TabuleiroHabilidades.tamanho), 
      (): Peca[] => []
    );
    
    for (const peca of pecasReservadas) {

      const posicao = peca.getPosicao();

      // Se alguma geral, encerrar busca
      if (posicao == null)
        return [];
        
      pecasDasTrilhas[posicao].push(peca);
    }

    const qtdPorTrilha = pecasDasTrilhas.map(trilhas => trilhas.length);

    const removeReserva = (peca: Peca) => {

      /* Remove uma peca específica do array de reserva */

      const index = pecasReservadas.indexOf(peca);

      if (index == -1)
        throw new Error("Item não encontrado.");

      this.pecasReservadas[this.jogadorAtual].splice(index);
    }

    const pecasLivres = [];

    for (let i = 0; i < pecasDasTrilhas.length; i++) {
      
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

    /* Muda o jogador atual como sendo o próximo jogador e
    faz a inicialização do turno. */

    this.jogadorAtual = this.proximoJogador();

    if (this.acoesPendentes[this.jogadorAtual].length == 0)
      this.acoesPendentes[this.jogadorAtual] = [ new MoverKokeshi(Opcoes.TODAS) ];
  }

  private proximoJogador(): Jogador {

    /* Calcula próximo jogador. */

    return (this.jogadorAtual + 1) % NUMERO_JOGADORES;
  }

  // =============================================================================
  
  private executarUltimaAcao(): Peca|null {

    /* Executa a última ação pendente, que já deve estar especificada. */

    let acoes = this.acoesPendentes[this.jogadorAtual];

    if (acoes.at(-1) == null)
      throw new Error("Ação deve estar especificada antes de ser executada.");

    const acao = acoes.pop();

    if (acao instanceof MoverKokeshi)
      this.executarMoverKokeshi(acao);

    else if (acao instanceof AcaoMultipla)
      this.executarAcaoMultipla(acao);

    else if (acao instanceof MoverAnimal)
      this.moverAnimal(acao.getAnimal());

    else if (acao instanceof PosicionarPeca)
      this.executarPosicionarPeca(acao);

    else if (acao instanceof ComprarPeca)
      this.executarComprarPeca(acao);

    else
      throw new Error("Nenhuma ação executada.");
  
    return null;
  }
  
  private executarMoverKokeshi(acao: MoverKokeshi): void {

    /* OBS: Movimento RETORNO não retorna peça, retorna nulo. */

    const peca = this.moverKokeshi(acao.getKokeshi(), acao.getMovimento());

    if (peca != null)
      this.acoesPendentes[this.jogadorAtual].push(peca.getAcao());
  }

  private executarAcaoMultipla(acao: AcaoMultipla): void {

    if (!acao.especificada())
      throw new Error("Para ser executada a ação múltipla precisa estar especificada (deve ser dupla).");

    this.acoesPendentes[this.jogadorAtual].push(...acao.getAcoes());
  }

  private executarPosicionarPeca(acao: PosicionarPeca): void {
    
    const pecasReservadas = this.pecasReservadas[this.jogadorAtual];
    
    if (pecasReservadas.at(-1) == null)
      throw new Error("Não pode adicionar peça nula.");

    const peca = pecasReservadas.pop();
    this.posicionarPeca(peca, acao.getPosicao());
  }

  private executarComprarPeca(acao: ComprarPeca): void {

    const peca = this.comprarDaOferta();

    const posicionamento = acao.getPosicao();
    if (posicionamento != null)
      peca.associarPosicao(posicionamento);

    this.pecasReservadas[this.jogadorAtual].push(peca);
  }

  // =============================================================================

  private especificarAcao(especificacao: Acao): void {

    /* Especifica a última ação pendente baseada em uma ação 
    de especificação. */ 

    const acoes = this.acoesPendentes[this.jogadorAtual];
    const acaoPendente = acoes.at(-1);
    const acaoEspecificada = this.acaoEspecificada(acaoPendente, especificacao);

    if (acaoPendente == null)
      throw new Error("Nenhuma ação pendente.");
    
    if (acaoPendente.especificada())
      throw new Error("Ação não deve estar especificada para ser especificada.");
    
    if (acaoEspecificada == null)
      throw new Error("Especificação inválida.");
    
    acoes[acoes.length - 1] = acaoEspecificada;
  }

  private acaoEspecificada(acao: Acao, especificacao: Acao): Acao|null {

    /* Retorna uma ação especificada, baseada em uma ação de especifição
    passada. */

    if (acao instanceof MoverKokeshi && especificacao instanceof EspecificarKokeshi)
      return acao.especificar(especificacao.getKokeshi());
  
    if (acao instanceof PosicionarPeca && especificacao instanceof EspecificarPosicao)
      return acao.especificar(especificacao.getPosicao());
  
    if (acao instanceof MoverAnimal && especificacao instanceof EspecificarAnimal)
      return acao.especificar(especificacao.getAnimal());
  
    if (acao instanceof AcaoMultipla && especificacao instanceof EspecificarAcaoMultipla)
      return acao.escolherAcao(especificacao.getEscolha());

    if (acao instanceof AcaoMultipla && especificacao instanceof EspecificarAcaoMultipla)
      return acao.escolherAcao(especificacao.getEscolha()); 
  
    return null;
  }

  // =============================================================================

  private posicionarPeca(peca: Peca, posicao: Kokeshi): void {

    /* Posiciona uma peça, que já tenha uma posição associada,
    no tabuleiro de habilidade do jogador atual. */

    const tabuleiro = this.tabuleirosHabilidades[this.jogadorAtual];
    tabuleiro.adicionar(peca, posicao);
  }

  private moverAnimal(animal: Animal): void {

    /* Avança a ficha do jogador atual no tabuleiro de animais,
    na trilha passada por parâmetro. */

    this.tabuleiroAnimais.avancar(animal, this.jogadorAtual);
  }

  private moverKokeshi(kokeshi: Kokeshi, movimento: Movimento = Movimento.SIMPLES): Peca {

    /* Executa um movimento sobre uma kokeshi do jogador atual. */

    const tabuleiroJogador = this.tabuleirosHabilidades[this.jogadorAtual];
    return tabuleiroJogador.moverKokeshi(kokeshi, movimento);
  }

  private comprarDaOferta(): Peca {

    /* Remove e retorna uma peça alatória do estoque de oferta. */

    return this.removerPeca(this.ofertaPecas);
  }

  private comprarDoInicial(): Peca {

    /* Remove e retorna uma peça aleatória do estoque inicial. */
  
    return this.removerPeca(this.pecasIniciais);
  }

  private removerPeca(estoque: Peca[]): Peca {

    /* Tira uma peça aleatória de um array e a retorna. */

    if (estoque.length == 0)
      throw new Error("Não é possível pegar peça de estoque vazio.");

    const index = RANDOM_IN_RANGE(estoque.length);

    return estoque[index];
  }

  public toString(): String {

    /* Retorna a string que representa o objeto. */

    // TODO: Mostrar peças colocáveis não independentes no toString

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
