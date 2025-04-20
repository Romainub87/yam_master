import {
    getWaitingClients,
    addWaitingClient,
    removeWaitingClient,
    getGameClients,
    addGameClient,
    removeGameClient
} from '../websocket.js';
import { MessageTypes } from '../types/message.js';
import { tryMatchPlayers } from '../lib/matchmaking.js';
import db from '../connection.js';

export async function handleQueueJoin(client, payload) {
  const { user, token } = payload;


    const existingPlayerScore = await db.player_score.findFirst({
        where: {
            user_id: user.id,
            game: {
                status: 'IN_PROGRESS',
            },
        },
    });

    if (existingPlayerScore) {
        const gameId = existingPlayerScore.game_id;
        addGameClient({ client, gameId: gameId, userId: user.id });

        const opponentClient = getGameClients().find(
            (gameClient) => gameId === gameClient.gameId && gameClient.userId !== user.id
        );

        if (opponentClient) {
            opponentClient.client.send(JSON.stringify({ type: MessageTypes.OPPONENT_RECONNECT, message: "L'adversaire s'est reconnecté." }));
        }
        client.send(JSON.stringify({ type: MessageTypes.GAME_RECONNECT, gameId, message: "Vous vous êtes reconnecté à la partie." }));
        return;
    }

  // TODO: Use real value ranked
  const ranked = false;
  const mmr = ranked ? user.mmr ?? 400 : user.hide_mmr ?? 400;

  const clientData = {
    client,
    user,
    mmr,
    ranked,
    token,
    joinedAt: Date.now(),
  };

  // Ajoute le client à la queue
  addWaitingClient(clientData);
  client.send(JSON.stringify({ type: MessageTypes.QUEUE_ADDED }));
  tryMatchPlayers(getWaitingClients());
}

export function handleQueueLeave(client) {
  removeWaitingClient(client);
  client.send(JSON.stringify({ type: MessageTypes.QUEUE_LEAVE }));
}

export function handleClientDisconnection(client) {
    const disconnectedClient = getGameClients().find(c => c.client === client);

    if (disconnectedClient) {
        const { gameId, userId } = disconnectedClient;

        removeGameClient(disconnectedClient);

        const opponentClient = getGameClients().find(c => c.gameId === gameId && c.userId !== userId);

        if (opponentClient) {
            opponentClient.client.send(JSON.stringify({
                type: MessageTypes.PLAYER_QUIT_GAME,
                message: `Votre adversaire a quitté la partie.`,
            }));
        }
    }
}

export function handleGameReconnect(client, payload) {
    const { userId, gameId } = payload;

    const gameClient = getGameClients().find(c => c.client === client);

    if (gameClient) {
        removeGameClient(gameClient);
    }

    addGameClient({ client, gameId, userId });

    const opponentClient = getGameClients().find(c => c.gameId === gameId && c.userId !== userId);

    if (opponentClient) {
        opponentClient.client.send(JSON.stringify({
            type: MessageTypes.OPPONENT_RECONNECT,
            message: "L'adversaire s'est reconnecté.",
        }));
    }

    client.send(JSON.stringify({
        type: MessageTypes.GAME_RECONNECT,
        gameId,
        message: "Vous vous êtes reconnecté à la partie.",
    }));
}
