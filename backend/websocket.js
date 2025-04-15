import { WebSocketServer } from 'ws';
import {handleQueueJoin, handleQueueLeave} from './handlers/queue.js';
import { MessageTypes } from './types/message.js';

let waitingClients = [];

const handlers = {
  [MessageTypes.QUEUE_JOIN]: (ws, payload) => handleQueueJoin(ws),
  [MessageTypes.QUEUE_LEAVE]: (ws, payload) => handleQueueLeave(ws, payload),
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
      waitingClients = waitingClients.filter((client) => client !== ws);
      console.log('Client déconnecté');
    });
  });
}

export function getWaitingClients() {
  return waitingClients;
}

export function addWaitingClient(client) {
  waitingClients.push(client);
}

export function removeWaitingClient(client) {
  waitingClients = waitingClients.filter((c) => c !== client);
}
