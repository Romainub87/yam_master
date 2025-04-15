export interface PlayerScore {
    id: number;
    user_id: number;
    game_id: number;
    rolls_left: number;
    score: number;
    turn: boolean;
    created_at: string;
    updated_at: string;
}