import http from 'http';
import app from './app.js';
import { setupWebSocket, getWaitingClients, getGameClients } from './websocket.js';
import { tryMatchPlayers } from './lib/matchmaking.js';

const server = http.createServer(app);

import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ noServer: true });

setupWebSocket(wss);

server.on('upgrade', (request, socket, head) => {
  if (request.url === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});
