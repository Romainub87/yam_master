import { WebSocketServer } from 'ws';
import {
  handleDefinitiveQuitGame,
  handleForfeit,
  handleGameSubscribe,
  handleLockDice,
  handleRollDices,
  handleTurnChange,
  handleTimerUpdate,
  handleScoreCombination,
  handleChallenge
} from './handlers/game.js';
import {
  handleClientDisconnection,
  handleQueueJoin,
  handleQueueLeave,
  handleGameReconnect
} from './handlers/queue.js';
import { MessageTypes } from './types/message.js';
import { timers } from './handlers/queue.js';
import {handleBotAction, handleCreateBotGame} from "./handlers/bot.js";

let waitingClients = [];
let gameClients = [];
let suspendedClients = [];


const handlers = {
  [MessageTypes.QUEUE_JOIN]: (ws, payload) => handleQueueJoin(ws, payload),
  [MessageTypes.QUEUE_LEAVE]: (ws, payload) => handleQueueLeave(ws, payload),
  [MessageTypes.GAME_SUBSCRIBE]: (ws, payload) =>
    handleGameSubscribe(ws, payload),
  [MessageTypes.LOCK_DICE]: (ws, payload) => handleLockDice(ws, payload),
  [MessageTypes.DICE_ROLL]: (ws, payload) => handleRollDices(ws, payload),
  [MessageTypes.TURN_CHANGE]: (ws, payload) => handleTurnChange(ws, payload),
  [MessageTypes.DEFINITIVE_QUIT_GAME]: (ws, payload) => handleDefinitiveQuitGame(ws, payload),
  [MessageTypes.FORFEIT_GAME]: (ws, payload) => handleForfeit(ws, payload),
  [MessageTypes.TIMER_UPDATE]: (ws, payload) => handleTimerUpdate(ws, payload),
  [MessageTypes.SCORE_COMBINATION]: (ws, payload) => handleScoreCombination(ws, payload),
  [MessageTypes.CHALLENGE]: (ws, payload) => handleChallenge(ws, payload),
  [MessageTypes.GAME_RECONNECT]: (ws, payload) => handleGameReconnect(ws, payload),
  [MessageTypes.BOT_GAME]: (ws, payload) => handleCreateBotGame(ws, payload),
  [MessageTypes.BOT_ACTION]: (ws, payload) => handleBotAction(ws, payload),
};

export function setupWebSocket(wss) {
  wss.on('connection', (ws) => {
    if (gameClients.some(client => client.userId === ws.userId)) {
      console.warn('Utilisateur déjà connecté');
      ws.close();
      return;
    }
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
      console.log('Client déconnecté');
      handleClientDisconnection(ws);
      clearInterval(timers.get(ws.userId));
      timers.delete(ws.userId);
    });
  });

  // Ne ferme pas le serveur ici. La fermeture du serveur HTTP se gère ailleurs.
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

export function getSuspendedClients() {
  return suspendedClients;
}

export function addSuspendedClient(client) {
  suspendedClients.push(client);
}

export function removeSuspendedClient(client) {
  suspendedClients = suspendedClients.filter((c) => c.client !== client);
}
