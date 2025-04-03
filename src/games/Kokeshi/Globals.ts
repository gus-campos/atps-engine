
// COR: PRINCESA,   PRINCESA  - BATCHAN,    PRINCESA  - PESCADOR
// COR: BATCHAN,    BATCHAN   - PESCADOR,   BATCHAN   - PESCADOR
// COR: PESCADOR,   PESCADOR  - SAMURAI,    PESCADOR  - SUMOTORI
// COR: SAMURAI,    SAMURAI   - SUMOTORI,   SAMURAI   - PRINCESA
// COR: SUMOTORI,   SUMOTORI  - PRINCESA,   SUMOTORI  - BATCHAN

// TODO: Trocar pra seed XORShift
const RANDOM_IN_RANGE = (n: number) => Math.round(Math.random() * n);

const NUMERO_JOGADORES = 2;

const KOKESHIS = [
  
  Kokeshi.PRINCESA,
  Kokeshi.BATCHAN,
  Kokeshi.PESCADOR,
  Kokeshi.SAMURAI,
  Kokeshi.SUMOTORI
]

// TODO: Peça de reconhecimento faz pular mais um espaço, logo é o mesmo que "mover própria kokeshi tipo único"

// PEÇAS INICIAIS

const PECAS_INICIAIS: Peca[] = [];

for (let kokeshi1 of KOKESHIS) {

  for (const salto of [1, 2]) {

    const cor = kokeshi1;
    const kokeshi2 = kokeshi1 + salto;

    const peca = new Peca(
      
      TipoPeca.ESCOLHA, 
      cor,
      [
        new EfeitoMoverKokeshi(Opcoes.UNICA, kokeshi1), 
        new EfeitoMoverKokeshi(Opcoes.UNICA, kokeshi2)
      ]
    );
    
    PECAS_INICIAIS.push(peca);
  }
}


// ======================================================================

const PEÇAS_RECONHECIMENTO: Peca[] = []
