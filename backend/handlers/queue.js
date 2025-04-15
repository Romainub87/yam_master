import {
  getWaitingClients,
  addWaitingClient,
  removeWaitingClient,
} from '../websocket.js';
import { MessageTypes } from '../types/message.js';

export function handleQueueJoin(client) {
  const waitingClients = getWaitingClients();

  if (waitingClients.length === 0) {
    // Ajouter le client à la file d'attente
    addWaitingClient(client);
    client.send(JSON.stringify({ type: MessageTypes.QUEUE_ADDED }));
    console.log('Client ajouté à la file d’attente');
  } else {
    const firstClient = waitingClients[0];

    firstClient.send(JSON.stringify({ type: MessageTypes.GAME_START }));
    client.send(JSON.stringify({ type: MessageTypes.GAME_START }));
    console.log('Partie démarrée entre deux clients');

    // Enlever les deux clients de la file d'attente
    removeWaitingClient(firstClient);
    removeWaitingClient(client);
  }
}

export function handleQueueLeave(client) {
    console.log('Client quitté la file d’attente');
    removeWaitingClient(client);
    client.send(JSON.stringify({ type: MessageTypes.QUEUE_LEAVE }));
    console.log('Client retiré de la file d’attente');
}
