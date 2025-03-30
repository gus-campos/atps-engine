
// COR: PRINCESA,   PRINCESA  - BATCHAN,    PRINCESA  - PESCADOR
// COR: BATCHAN,    BATCHAN   - PESCADOR,   BATCHAN   - PESCADOR
// COR: PESCADOR,   PESCADOR  - SAMURAI,    PESCADOR  - SUMOTORI
// COR: SAMURAI,    SAMURAI   - SUMOTORI,   SAMURAI   - PRINCESA
// COR: SUMOTORI,   SUMOTORI  - PRINCESA,   SUMOTORI  - BATCHAN

const PECAS_INICIAIS: Peca[] = [];

const KOKESHIS = [

  Kokeshi.PRINCESA,
  Kokeshi.BATCHAN,
  Kokeshi.PESCADOR,
  Kokeshi.SAMURAI,
  Kokeshi.SUMOTORI
]

for (let kokeshi1 of KOKESHIS) {

  for (const salto of [1, 2]) {

    const cor = kokeshi1;
    const kokeshi2 = kokeshi1 + salto;
    const peca = new Peca(TipoPeca.INICIAL, cor, [new AvancarKokeshi(kokeshi1), new AvancarKokeshi(kokeshi2)]);
    
    PECAS_INICIAIS.push(peca);
  }
}


// ======================================================================

const PEÇAS_RECONHECIMENTO: Peca[] = []

// TODO: Decidir como os efeitos serão executados
