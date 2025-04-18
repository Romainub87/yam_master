import {Choice} from "@/models/Choice";
import {Dice} from "@/models/Dice";

export interface Game {
    id: number;
    grid_state: Choice[][];
    dice_state: Dice[];
    status: string;
    timer: number;
    rolls_left: number;
}