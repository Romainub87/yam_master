import { createGame } from './game.js';
import { removeWaitingClient } from '../websocket.js';

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
      waitingClients.splice(i, 2);
      removeWaitingClient(p1);
      removeWaitingClient(p2);
      createGame(p1, p2);
      i--; // car on a retiré deux éléments
      console.log('Partie démarrée entre deux clients');
    }
  }
  return waitingClients;
}
