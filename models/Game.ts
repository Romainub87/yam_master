import {Choice} from "@/models/Choice";
import {Dice} from "@/models/Dice";

export interface Game {
    id: number;
    grid_state: Choice[][];
    dice_state: Dice[];
    rolls_left: number;
}