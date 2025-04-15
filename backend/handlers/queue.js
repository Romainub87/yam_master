import {
  getWaitingClients,
  addWaitingClient,
  removeWaitingClient,
    getGameClients,
    addGameClient
} from '../websocket.js';
import db from '../connection.js';
import { MessageTypes } from '../types/message.js';
import jwt from "jsonwebtoken";
import { tryMatchPlayers } from '../lib/matchmaking.js';

export async function handleQueueJoin(client, payload) {
    const waitingClients = getWaitingClients();

    const { user } = payload;
    // TODO: Use real value ranked
    const ranked = false;
    const mmr = ranked ? user.mmr ?? 400 : user.hide_mmr ?? 400;

    const clientData = {
        client,
        user,
        mmr,
        ranked,
        joinedAt: Date.now(),
    };

    if (waitingClients.length === 0) {
        addWaitingClient(clientData);
        client.send(JSON.stringify({type: MessageTypes.QUEUE_ADDED}));
    } else {
        // TODO: intégrer tryMatchPlayers(getWaitingClients());
        const firstClient = waitingClients[0];

        await db.query(
            'INSERT INTO game (grid_state, dice_state, timer) VALUES ($1, $2, $3)',
            [{}, {}, 30]
        );

        // Récupérer l'ID de la partie créée
        const result = await db.query('SELECT id FROM game ORDER BY id DESC LIMIT 1');

        const gameId = result.rows[0].id;

        const opponentToken = firstClient.payload.token;
        const opponentDecodedToken = jwt.verify(opponentToken, process.env.JWT_SECRET);
        const opponentId = opponentDecodedToken.user.id;

        const clientToken = payload.token;
        const decodedToken = jwt.verify(clientToken, process.env.JWT_SECRET);
        const clientId = decodedToken.user.id;

        const turn = Math.random() < 0.5;
        const opponentTurn = turn;
        const playerTurn = !turn;

        const opponentRolls = opponentTurn ? 3 : 0;
        const playerRolls = playerTurn ? 3 : 0;

        // Associer les clients à la partie
        await db.query(
            'INSERT INTO player_score (user_id, game_id, score, rolls_left, turn) VALUES ($1, $3, $4, $7, $5), ($2, $3, $4, $8, $6)',
            [opponentId, clientId, gameId, 0, opponentTurn, playerTurn, opponentRolls, playerRolls],
        )

        const gameResult = await db.query(
            'SELECT * FROM game WHERE id = $1',
            [gameId]
        )

        const game = gameResult.rows[0];
        const playerScoreResult = await db.query(
            'SELECT * FROM player_score WHERE game_id = $1',
            [gameId]
        );

        const playerScores = playerScoreResult.rows;
        const playerScore = playerScores.find(player => player.user_id === clientId);
        const opponentScore = playerScores.find(player => player.user_id === opponentId);

        firstClient.client.send(JSON.stringify({type: MessageTypes.GAME_START, game: game, playerScore: opponentScore, opponentScore: playerScore}));
        client.send(JSON.stringify({type: MessageTypes.GAME_START, game: game, playerScore: playerScore, opponentScore: opponentScore}));

        removeWaitingClient({client: firstClient.client, payload: firstClient.payload});
        removeWaitingClient({client: client, payload: payload});

        addGameClient({client: firstClient.client, gameId: gameId, userId: opponentId});
        addGameClient({client: client, gameId: gameId, userId: clientId});
    }
}

export function handleQueueLeave(client) {
    removeWaitingClient(client);
    client.send(JSON.stringify({ type: MessageTypes.QUEUE_LEAVE }));
}

export async function handleGameSubscribe(client, payload) {

    try {
        const decodedToken = jwt.verify(payload.token, process.env.JWT_SECRET);
        const userId = decodedToken.user.id;

        // Récupérer les données de la partie en cours
        const gameResult = await db.query(
            'SELECT * FROM game WHERE id = $1',
            [payload.gameId]
        );

        if (gameResult.rows.length === 0) {
            client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Partie introuvable' }));
            return;
        }

        const game = gameResult.rows[0];

        const existingClient = getGameClients().find(
            (gameClient) => gameClient.gameId === game.id && gameClient.userId === userId
        );

        if (!existingClient) {
            addGameClient({ client, gameId: game.id, userId: userId });
        }

        const playerScoreResult = await db.query(
            'SELECT * FROM player_score WHERE game_id = $1',
            [payload.gameId]
        );

        const playerScores = playerScoreResult.rows;
        const playerScore = playerScores.find(player => player.user_id === userId);
        const opponentScore = playerScores.find(player => player.user_id !== userId);

        // Envoyer les données de la partie au client
        client.send(JSON.stringify({
            type: MessageTypes.GAME_UPDATE,
            game: game,
            playerScore: playerScore,
            opponentScore: opponentScore,
        }));
    } catch (error) {
        console.error('Erreur dans handleGameSubscribe :', error);
        client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Erreur lors de l\'abonnement à la partie' }));
    }
}

export async function handleRollDices(client, payload) {
    const gameId = payload.gameId;
    const decodedToken = jwt.verify(payload.token, process.env.JWT_SECRET);
    const userId = decodedToken.user.id;

    const playerScoresResult = await db.query(
        'SELECT * FROM player_score WHERE game_id = $1',
        [gameId]
    );

    const playerScores = playerScoresResult.rows;
    const playerScore = playerScores.find(player => player.user_id === userId);
    const opponentScore = playerScores.find(player => player.user_id !== userId);

    if (!playerScore) {
        client.send(JSON.stringify({type: MessageTypes.GAME_ERROR, message: 'Vous n\'êtes pas dans cette partie'}));
        return;
    }

    if (playerScore.rolls_left === 0) {
        client.send(JSON.stringify({type: MessageTypes.GAME_ERROR, message: 'Plus de lancers disponibles'}));
        return;
    }

    if (!gameId) {
        client.send(JSON.stringify({type: MessageTypes.GAME_ERROR, message: 'ID de la partie manquant'}));
        return;
    }

    const gameResult = await db.query(
        'SELECT * FROM game WHERE id = $1',
        [gameId]
    );

    if (gameResult.rows.length === 0) {
        client.send(JSON.stringify({type: MessageTypes.GAME_ERROR, message: 'Partie introuvable'}));
        return;
    }

    const diceRolls = Array.from({length: payload.count}, () => Math.floor(Math.random() * 6) + 1);

    await db.query(
        'UPDATE player_score SET rolls_left = rolls_left - 1 WHERE game_id = $1 AND user_id = $2',
        [gameId, userId]
    );

    const playerRollsResult = await db.query(
        'SELECT * FROM player_score WHERE game_id = $1 AND user_id = $2',
        [gameId, userId]
    );

    const playerScoreUpdated = playerRollsResult.rows[0];

    // Vérifier les combinaisons possibles
    const counts = diceRolls.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});

    // TODO: Vérifier les combinaisons possibles + implémentation des combinaisons/actions
    const combinations = {
        pair: Object.values(counts).some(count => count === 2),
        threeOfAKind: Object.values(counts).some(count => count === 3),
        fourOfAKind: Object.values(counts).some(count => count === 4),
        fullHouse: Object.values(counts).includes(3) && Object.values(counts).includes(2),
        yahtzee: Object.values(counts).some(count => count === 5),
        smallStraight: [1, 2, 3, 4].every(num => counts[num]) || [2, 3, 4, 5].every(num => counts[num]) || [3, 4, 5, 6].every(num => counts[num]),
        largeStraight: [1, 2, 3, 4, 5].every(num => counts[num]) || [2, 3, 4, 5, 6].every(num => counts[num]),
    };

    client.send(JSON.stringify({
        type: MessageTypes.DICE_ROLL,
        dice: diceRolls,
        game: gameResult.rows[0],
        combinations: combinations,
        playerScore: playerScoreUpdated,
    }));

    if (opponentScore) {
        const opponentClient = getGameClients().find(c => c.gameId === gameId && c.userId === opponentScore.user_id);
        if (opponentClient) {
            opponentClient.client.send(JSON.stringify({
                type: MessageTypes.OPPONENT_UPDATE,
                dice: diceRolls,
                game: gameResult.rows[0],
                opponentScore: playerScoreUpdated,
            }));
        }
    }
}

export async function handleTurnChange(client, payload) {
    const gameId = payload.gameId;

    const gameResult = await db.query(
        'SELECT * FROM game WHERE id = $1',
        [gameId]
    );

    try {
        // Récupérer les scores des joueurs pour la partie
        const playerScoresResult = await db.query(
            'SELECT * FROM player_score WHERE game_id = $1',
            [gameId]
        );

        const playerScores = playerScoresResult.rows;

        if (playerScores.length !== 2) {
            client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Nombre de joueurs incorrect' }));
            return;
        }

        // Inverser les tours
        const updates = playerScores.map(player => {
            return db.query(
                'UPDATE player_score SET turn = $1, rolls_left = $2 WHERE game_id = $3 AND user_id = $4',
                [!player.turn, !player.turn ? 3 : 0, gameId, player.user_id]
            );
        });

        await Promise.all(updates);

        // Notifier les clients
        const updatedScoresResult = await db.query(
            'SELECT * FROM player_score WHERE game_id = $1',
            [gameId]
        );

        const updatedScores = updatedScoresResult.rows;

        updatedScores.forEach(player => {
            const gameClient = getGameClients().find(c => c.gameId === gameId && c.userId === player.user_id);
            if (gameClient) {
                gameClient.client.send(JSON.stringify({
                    type: MessageTypes.GAME_UPDATE,
                    opponentScore: updatedScores.find(p => p.user_id !== player.user_id),
                    playerScore: player,
                    game: gameResult.rows[0],
                    dice: [],
                }));
            }
        });
    } catch (error) {
        console.error('Erreur dans handleTurnChange :', error);
        client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Erreur lors du changement de tour' }));
    }
}
