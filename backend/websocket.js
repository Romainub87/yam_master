import { WebSocketServer } from 'ws';
import { handleQueueJoin } from './handlers/queue.js';
import { MessageTypes } from './types/message.js';

let waitingClient = null;

const handlers = {
  [MessageTypes.QUEUE_JOIN]: (ws, payload) => handleQueueJoin(ws, payload),
};

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connecté');

    ws.on('message', (messageBuffer) => {
      try {
        const data = JSON.parse(messageBuffer.toString());

        const { type, payload } = data;
        const handler = handlers[type];

        if (handler) {
          handler(ws, payload);
        } else {
          console.warn(`Aucun handler pour le type : ${type}`);
        }
      } catch (err) {
        console.error('Erreur de parsing ou traitement :', err.message);
        ws.send(
          JSON.stringify({
            type: 'error',
            payload: { message: 'Format invalide' },
          })
        );
      }
    });

    ws.on('close', () => {
      if (waitingClient === ws) {
        waitingClient = null;
      }
      console.log('Client déconnecté');
    });
  });
}

export function getWaitingClient() {
  return waitingClient;
}

export function setWaitingClient(client) {
  waitingClient = client;
}
