import {
    calculateValidCombinations,
    checkAlignmentsAndUpdateScores,
    createGridFor2Players,
    resetDices
} from "../lib/game.js";
import db from "../connection.js";
import {MessageTypes} from "../types/message.js";

export async function handleBotAction(client, payload) {
    const { gameId } = payload;

    let game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) {
        client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Partie introuvable' }));
        return;
    }

    const botScore = await db.player_score.findFirst({
        where: { game_id: gameId, user_id: -1 },
    });

    const grid = game.grid_state;

    let combinaisonResult = null;
    let maxRolls = 3;
    let rolls = 0;

    while (rolls < maxRolls) {
        botScore.challenge = true;
        const diceRolls = Array.from({ length: 5 }, () => ({
            value: Math.floor(Math.random() * 6) + 1,
            locked: Math.random() < 0.5,
        }));
        combinaisonResult = calculateValidCombinations(diceRolls, botScore, grid);
        if (combinaisonResult.length > 0) {
            const randomIndex = Math.floor(Math.random() * combinaisonResult.length);
            const chosenCombination = combinaisonResult[randomIndex];
            const matchingCells = [];
            grid.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell.combination === chosenCombination && !cell.user) {
                        matchingCells.push({ row: rowIndex, col: colIndex });
                    }
                });
            });
            if (matchingCells.length > 0) {
                const randomCell = matchingCells[Math.floor(Math.random() * matchingCells.length)];
                grid[randomCell.row][randomCell.col].user = -1;
            }
            break;
        }
        rolls++;
    }

    await db.game.update({
        where: { id: gameId },
        data: {
            grid_state: grid,
            timer: 20,
        },
    });

    game = await db.game.findUnique({ where: { id: gameId } });

    await db.player_score.updateMany({
        where: { game_id: gameId, user_id: { not: -1 } },
        data: {
            rolls_left: 3,
            turn: true,
        },
    });

    await checkAlignmentsAndUpdateScores(gameId, -1, client, null);

    const gameFinished = await db.game.findUnique({
        where: { id: gameId, status: 'FINISHED' },
    });
    const botIsWinner = await db.player_score.findFirst({
        where: { game_id: gameId, user_id: -1 },
    });

    if (gameFinished && botIsWinner.winner) {
        client.send(JSON.stringify({
            type: MessageTypes.GAME_LOSE,
            game: gameFinished,
            message: 'Le bot a gagné.',
        }));
    }
    client.send(JSON.stringify({
            type: MessageTypes.BOT_ACTION,
            opponentScore: await db.player_score.findUnique({where: {game_id_user_id: {game_id: gameId, user_id: -1}}}),
            playerScore: await db.player_score.findFirst({where: {game_id: gameId, user_id: {not: -1}}}),
            game: game,
            dice: await resetDices(game),
            message: 'Le bot a joué.',
        }));
}

export async function handleCreateBotGame(client, payload) {
    const { userId } = payload;

    const bot = await db.users.findUnique({
        where: { id: -1 },
    });
    if (!bot) {
        await db.users.create({
            data: {
                id: -1,
                username: 'Bot facile',
                password: '$2b$10$wH8Qw1Qw1Qw1Qw1Qw1Qw1uQw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Q',
                mmr: 0
            },
        });
    }

    const newGame = await db.game.create({
        data: {
            grid_state: createGridFor2Players(),
            dice_state: Array(5).fill({ value: null, locked: false }),
            status: 'IN_PROGRESS',
            isRanked: false,
            isBot: true,
            timer:20,
        },
    });

    await db.player_score.createMany({
        data: [
            {
                game_id: newGame.id,
                user_id: userId,
                score: 0,
                turn: true,
                rolls_left: 3,
            },
            {
                game_id: newGame.id,
                user_id: -1,
                score: 0,
                turn: false,
                rolls_left: 3,
            },
        ],
    });

    client.send(JSON.stringify({
        type: MessageTypes.GAME_START,
        game: newGame,
        message: 'Partie contre un bot créée avec succès.',
    }));
}