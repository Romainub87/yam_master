export interface Game {
    id: number;
    grid_state: number[][];
    dice_state: number[];
    rolls_left: number;
}