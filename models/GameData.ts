import {PlayerScore} from "@/models/playerScore";
import {Game} from "@/models/Game";
import { Dice } from "@/models/Dice";
import {Combination} from "@/models/Combinations";

export interface GameData {
    game: Game;
    dice: Dice[];
    playerScore: PlayerScore;
    opponentScore: PlayerScore;
    combinations: Combination[];
}