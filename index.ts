
import { AutoPlay, Agent, GameName } from "src/shared/Autoplay";

let autoplay = new AutoPlay(GameName.TIC_TAC_TOE, [Agent.RANDOM, Agent.RANDOM], true);
autoplay.playMultiple(1);
autoplay.printInfo();
