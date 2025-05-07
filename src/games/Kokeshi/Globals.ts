
// COR: PRINCESA,   PRINCESA  - BATCHAN,    PRINCESA  - PESCADOR
// COR: BATCHAN,    BATCHAN   - PESCADOR,   BATCHAN   - PESCADOR
// COR: PESCADOR,   PESCADOR  - SAMURAI,    PESCADOR  - SUMOTORI
// COR: SAMURAI,    SAMURAI   - SUMOTORI,   SAMURAI   - PRINCESA
// COR: SUMOTORI,   SUMOTORI  - PRINCESA,   SUMOTORI  - BATCHAN

import { Kokeshi, Opcoes } from "./Types";
import { Peca } from "./Peca";
import { AcaoMultipla, MoverAnimal, MoverKokeshi } from "./Acao"
import { Random } from "src/utils/Random";

const RANDOM = new Random();
export const RANDOM_IN_RANGE = (n: number) => RANDOM.range(n);

export const NUMERO_JOGADORES = 2;

export const KOKESHIS = [
  Kokeshi.PRINCESA,
  Kokeshi.BATCHAN,
  Kokeshi.PESCADOR,
  Kokeshi.SAMURAI,
  Kokeshi.SUMOTORI
]

// ======================================================================

// TODO: Inicializar
export const PECAS_OFERTA: Peca[] = [];


for (const cor of KOKESHIS) {
  for (const kokeshi of KOKESHIS) {
    
    const acao1 = new MoverKokeshi(Opcoes.UNICA, kokeshi);
    const acao2 = new MoverAnimal(Opcoes.TODAS);
    const acaoMultipla = new AcaoMultipla(acao1, acao2);

    const peca = new Peca(cor, acaoMultipla);
    PECAS_OFERTA.push(peca);
  }
}

// Kokeshi - Animal

  // ou, e

  // uni - uni
  // mult - mult 

// ======================================================================

export const PECAS_INICIAIS: Peca[] = [];

for (let kokeshi1 of KOKESHIS) {

  for (const salto of [1, 2]) {

    const cor = kokeshi1;
    const kokeshi2 = kokeshi1 + salto;

    const acao = new AcaoMultipla(
      new MoverKokeshi(Opcoes.UNICA, kokeshi1), 
      new MoverKokeshi(Opcoes.UNICA, kokeshi2)
    );

    const peca = new Peca(cor, acao);
    
    PECAS_INICIAIS.push(peca);
  }
}

// ======================================================================

// TODO: Peça de reconhecimento faz pular mais um espaço, 
// logo é o mesmo que "mover própria kokeshi tipo único"
export const PEÇAS_RECONHECIMENTO: Peca[] = []
