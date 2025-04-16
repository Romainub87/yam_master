import {
  getWaitingClients,
  addWaitingClient,
  removeWaitingClient,
} from '../websocket.js';
import { MessageTypes } from '../types/message.js';
import { tryMatchPlayers } from '../lib/matchmaking.js';

export async function handleQueueJoin(client, payload) {
  const { user, token } = payload;
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
