import { WebSocketServer } from 'ws';
import {
  handleGameSubscribe,
  handleQueueJoin,
  handleQueueLeave,
  handleRollDices,
  handleTurnChange,
} from './handlers/queue.js';
import { MessageTypes } from './types/message.js';

let waitingClients = [];
let gameClients = [];

const handlers = {
  [MessageTypes.QUEUE_JOIN]: (ws, payload) => handleQueueJoin(ws, payload),
  [MessageTypes.QUEUE_LEAVE]: (ws, payload) => handleQueueLeave(ws, payload),
  [MessageTypes.GAME_SUBSCRIBE]: (ws, payload) =>
    handleGameSubscribe(ws, payload),
  [MessageTypes.DICE_ROLL]: (ws, payload) => handleRollDices(ws, payload),
  [MessageTypes.TURN_CHANGE]: (ws, payload) => handleTurnChange(ws, payload),
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
      gameClients = gameClients.filter((client) => client.client !== ws);
      waitingClients = waitingClients.filter((client) => client.client !== ws);
      console.log('Client déconnecté');
    });
  });
}

export function getWaitingClients() {
  return waitingClients;
}

export function addWaitingClient(clientData) {
  waitingClients.push(clientData);
}

export function removeWaitingClient(clientToRemove) {
  waitingClients = waitingClients.filter(
    (c) => c.client !== clientToRemove && c !== clientToRemove
  );
}

export function getGameClients() {
  return gameClients;
}

export function addGameClient(client) {
  gameClients.push(client);
}

export function removeGameClient(client) {
  gameClients = gameClients.filter((c) => c.client !== client);
}
