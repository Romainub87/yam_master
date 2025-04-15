import {PlayerScore} from "@/models/playerScore";
import {Game} from "@/models/Game";

export interface GameData {
    game: Game;
    playerScore: PlayerScore;
    opponentScore: PlayerScore;
}