import {
    getWaitingClients,
    addWaitingClient,
    removeWaitingClient,
    getGameClients,
    addGameClient,
    getSuspendedClients,
    removeSuspendedClient
} from '../websocket.js';
import { MessageTypes } from '../types/message.js';
import { tryMatchPlayers } from '../lib/matchmaking.js';

export async function handleQueueJoin(client, payload) {
  const { user, token } = payload;

    const suspendedClient = getSuspendedClients().find(
        (suspendedClient) => suspendedClient.client === client
    );
    if (suspendedClient) {
        removeSuspendedClient(suspendedClient.client);
        addGameClient(suspendedClient.client);
        const opponentClient = getGameClients().find(
            (gameClient) => suspendedClient.gameId && gameClient.userId !== user.id
        );
        if (opponentClient) {
            opponentClient.client.send(JSON.stringify({ type: MessageTypes.OPPONENT_RECONNECT, message: "L'adversaire s'est reconnecté." }));
        }
        suspendedClient.client.send(JSON.stringify({ type: MessageTypes.GAME_RECONNECT, gameId: suspendedClient.gameId, message: "Vous vous êtes reconnecté à la partie." }));
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
