import http from 'http';
import app from './app.js';
import { setupWebSocket } from './websocket.js';

const PORT = 3000;

const server = http.createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});
