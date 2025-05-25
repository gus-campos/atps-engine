import { Kokeshi, Opcoes } from "./Types";
import { Peca } from "./Peca";
import { AcaoMultipla, MoverAnimal, MoverKokeshi } from "./Acao";
import { Random } from "src/utils/Random";

// Gerador aleatório (e auxiliar) compartilhado por todo o jogo (útil pra fixar seed)
const RANDOM = new Random();
export const RANDOM_IN_RANGE = (n: number) => RANDOM.range(n);

// Constante compartilhada entre o jogo - futuramente pode variar
export const NUMERO_JOGADORES = 2;

export const KOKESHIS = [
  Kokeshi.PRINCESA,
  Kokeshi.BATCHAN,
  Kokeshi.PESCADOR,
  Kokeshi.SAMURAI,
  Kokeshi.SUMOTORI,
];

// ======================================================================

/* Peças da oferta disponíveis para serem compradas ao longo do jogo 
TODO: Adicionar peças */

export const PECAS_OFERTA: Peca[] = [];

for (let cor of KOKESHIS) {
  for (let Kokeshi of KOKESHIS) {
    const acao1 = new MoverKokeshi(Opcoes.UNICA, Kokeshi);
    const acao2 = new MoverAnimal(Opcoes.TODAS);
    const acaoMultipla = new AcaoMultipla(acao1, acao2);

    const peca = new Peca(cor, acaoMultipla);
    PECAS_OFERTA.push(peca);
  }
}

// ======================================================================

/* Peças iniciais que os jogadores posicionam no início da partida
seja no próprio tabuleiro de habilidades, ou no de animais, como
recompensa no avanço nas trilhas de animais 

Peças iniciais:

  COR: PRINCESA
    PRINCESA  - BATCHAN
    PRINCESA  - PESCADOR

  COR: BATCHAN
    BATCHAN   - PESCADOR
    BATCHAN   - PESCADOR

  COR: PESCADOR
    PESCADOR  - SAMURA
    PESCADOR  - SUMOTORI

  COR: SAMURAI
    SAMURAI   - SUMOTOR
    SAMURAI   - PRINCESA

  COR: SUMOTORI
    SUMOTORI  - PRINCES
    SUMOTORI  - BATCHAN
*/

export const PECAS_INICIAIS: Peca[] = [];

for (let Kokeshi1 of KOKESHIS) {
  for (let salto of [1, 2]) {
    const cor = Kokeshi1;
    const Kokeshi2 = Kokeshi1 + salto;

    const acao = new AcaoMultipla(
      new MoverKokeshi(Opcoes.UNICA, Kokeshi1),
      new MoverKokeshi(Opcoes.UNICA, Kokeshi2)
    );

    const peca = new Peca(cor, acao);

    PECAS_INICIAIS.push(peca);
  }
}

// ======================================================================

// TODO: adicioanar peças de reconhecimento
export const PEÇAS_RECONHECIMENTO: Peca[] = [];
