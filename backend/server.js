import http from 'http';
import app from './app.js';
import { setupWebSocket, getWaitingClients } from './websocket.js';
import { tryMatchPlayers } from './lib/matchmaking.js';

const PORT = 3000;

const server = http.createServer(app);
setupWebSocket(server);

let matchingInProgress = false;
setInterval(() => {
  if (!matchingInProgress) {
    matchingInProgress = true;
    const waiting = getWaitingClients();
    tryMatchPlayers(waiting);
    matchingInProgress = false;
  }
}, 1000);

server.listen(PORT, () => {
  console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});
