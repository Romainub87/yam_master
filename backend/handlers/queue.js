import {
  getWaitingClients,
  addWaitingClient,
  removeWaitingClient,
} from '../websocket.js';
import { MessageTypes } from '../types/message.js';
import { tryMatchPlayers } from '../lib/matchmaking.js';

export function handleQueueJoin(client, payload) {
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

  addWaitingClient(clientData);
  client.send(JSON.stringify({ type: MessageTypes.QUEUE_ADDED }));
  console.log('Client ajouté à la file d’attente');

  tryMatchPlayers(getWaitingClients());
}

export function handleQueueLeave(client) {
  console.log('Client quitté la file d’attente');
  removeWaitingClient(client);
  client.send(JSON.stringify({ type: MessageTypes.QUEUE_LEAVE }));
  console.log('Client retiré de la file d’attente');
}
