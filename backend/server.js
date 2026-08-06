import http from 'http';
import jwt from 'jsonwebtoken';
import app from './app.js';
import { setupWebSocket } from './websocket.js';

const server = http.createServer(app);

import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ noServer: true });

setupWebSocket(wss);

server.on('upgrade', (request, socket, head) => {
  const { pathname, searchParams } = new URL(
    request.url,
    `http://${request.headers.host}`
  );

  if (pathname !== '/ws') {
    socket.destroy();
    return;
  }

  const token = searchParams.get('token');
  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.userId = decoded.user.id;
      wss.emit('connection', ws, request);
    });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});
