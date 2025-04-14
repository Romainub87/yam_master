import { getWaitingClient, setWaitingClient } from '../websocket.js';
import { MessageTypes } from '../types/message.js';

export function handleQueueJoin(client, payload) {
  const waitingClient = getWaitingClient();

  if (!waitingClient) {
    setWaitingClient(client);
    client.send(JSON.stringify({ type: MessageTypes.QUEUE_ADDED }));
    console.log('Client ajouté à la file d’attente');
  } else {
    waitingClient.send(JSON.stringify({ type: MessageTypes.GAME_START }));
    client.send(JSON.stringify({ type: MessageTypes.GAME_START }));
    console.log('Partie démarrée entre deux clients');
    setWaitingClient(null);
  }
}
