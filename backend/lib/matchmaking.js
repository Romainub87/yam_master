import { createGame } from './game.js';
import { removeWaitingClient } from '../websocket.js';

export function tryMatchPlayers(waitingClients) {
  // Trie les joueurs par MMR
  waitingClients.sort((a, b) => a.mmr - b.mmr);

  for (let i = 0; i < waitingClients.length - 1; i++) {
    const [p1, p2] = [waitingClients[i], waitingClients[i + 1]];
    const mmrDiff = Math.abs(p1.mmr - p2.mmr);
    const timeWaited = Date.now() - Math.min(p1.joinedAt, p2.joinedAt);
    const tolerance = 20 + (timeWaited / 20000) * Math.exp(Math.pow(timeWaited / 1000, 0.154));

    console.log(mmrDiff, tolerance, timeWaited);

    if (p1.ranked === p2.ranked && mmrDiff <= tolerance && p1.user.id !== p2.user.id) {
      console.log(`Match trouvé entre ${p1.user.username} et ${p2.user.username} avec une différence de MMR de ${mmrDiff}`);
      waitingClients.splice(i, 2);
      [p1, p2].forEach(removeWaitingClient);
      createGame(p1, p2);
      i--;
      console.log('Partie démarrée entre deux clients');
    }
  }
  return waitingClients;
}
