import { createGame } from './game.js';
import { removeWaitingClient } from '../websocket.js';
import {timers} from "../handlers/queue.js";

export function tryMatchPlayers(waitingClients) {
  // Trie les joueurs par MMR
  waitingClients.sort((a, b) => a.mmr - b.mmr);

  for (let i = 0; i < waitingClients.length - 1; i++) {
    const [p1, p2] = [waitingClients[i], waitingClients[i + 1]];
    const mmrDiff = Math.abs(p1.mmr - p2.mmr);
    const timeWaited = Date.now() - Math.min(p1.joinedAt, p2.joinedAt);
    const tolerance = 20 + (timeWaited / 20000) * Math.exp(Math.pow(timeWaited / 1000, 0.154));

    if (p1.ranked === p2.ranked && mmrDiff <= tolerance && p1.user.id !== p2.user.id) {
      waitingClients.splice(i, 2);
      [p1, p2].forEach(player => {
        removeWaitingClient(player);
        const interval = timers.get(player.user.id);
        if (interval) {
          clearInterval(interval);
          timers.delete(player.user.id);
        }
      });
      createGame(p1, p2);
      i--;
    }
  }
  return waitingClients;
}
