import { removeWaitingClient } from '../websocket.js';
import { MessageTypes } from '../types/message.js';

export function tryMatchPlayers(waitingClients) {
  // Trie les joueurs par MMR
  waitingClients.sort((a, b) => a.mmr - b.mmr);

  for (let i = 0; i < waitingClients.length - 1; i++) {
    const p1 = waitingClients[i];
    const p2 = waitingClients[i + 1];

    const mmrDiff = Math.abs(p1.mmr - p2.mmr);
    const timeWaited = Math.max(
      Date.now() - p1.joinedAt,
      Date.now() - p2.joinedAt
    );

    const second = timeWaited / 1000;
    const tolerance = 20 + Math.exp((second + 30) / 40.4);

    if (p1.ranked === p2.ranked && mmrDiff <= tolerance) {
      // Match trouvé
      waitingClients.splice(i, 2); // enlever les 2 joueurs de la file
      p1.client.send(JSON.stringify({ type: MessageTypes.GAME_START }));
      p2.client.send(JSON.stringify({ type: MessageTypes.GAME_START }));
      console.log('Partie démarrée entre deux clients');
      // Enlever les deux clients de la file d'attente
      removeWaitingClient(p1);
      removeWaitingClient(p2);
      i--; // car on a retiré deux éléments
    }

    return waitingClients;
  }
}
