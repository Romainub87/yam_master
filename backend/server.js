import http from 'http';
import app from './app.js';
import {setupWebSocket, getWaitingClients, getGameClients} from './websocket.js';
import { tryMatchPlayers } from './lib/matchmaking.js';
import db from "./connection.js";

const PORT = 3000;

const server = http.createServer(app);
setupWebSocket(server);

let matchingInProgress = false;

setInterval(async () => {
  // Gestion du matchmaking
  if (!matchingInProgress) {
    matchingInProgress = true;
    const waiting = getWaitingClients();
    tryMatchPlayers(waiting);
    matchingInProgress = false;
  }
});

server.listen(PORT, () => {
  console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});