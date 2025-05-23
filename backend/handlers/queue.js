import {
  getWaitingClients,
  addWaitingClient,
  removeWaitingClient,
  getGameClients,
  addGameClient,
  removeGameClient,
} from '../websocket.js';
import { MessageTypes } from '../types/message.js';
import { tryMatchPlayers } from '../lib/matchmaking.js';
import db from '../connection.js';

export const timers = new Map();

export async function handleQueueJoin(client, payload) {
  const { userId, ranked } = payload;

  const existingPlayerScore = await db.player_score.findFirst({
    where: {
      user_id: userId,
      game: {
        status: 'PAUSED' || 'IN_PROGRESS',
        isBot: false,
      },
    },
  });

  if (existingPlayerScore) {
    const gameId = existingPlayerScore.game_id;
    addGameClient({ client, gameId: gameId, userId: userId });

    const opponentClient = getGameClients().find(
      (gameClient) =>
        gameId === gameClient.gameId && gameClient.userId !== userId
    );

    if (opponentClient) {
      opponentClient.client.send(
        JSON.stringify({
          type: MessageTypes.OPPONENT_RECONNECT,
          message: "L'adversaire s'est reconnecté.",
        })
      );
    }
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_RECONNECT,
        gameId,
        message: 'Vous vous êtes reconnecté à la partie.',
      })
    );
    return;
  }

  let timeElapsed = 0;

  const interval = setInterval(() => {
    timeElapsed += 1;
    client.send(JSON.stringify({ type: 'queue.timer', time: timeElapsed }));
  }, 1000);

  timers.set(userId, interval);

  const user = await db.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      mmr: true,
      hide_mmr: true,
    },
  });

  const mmr = ranked ? user.mmr : user.hide_mmr;

  const clientData = {
    client,
    user,
    mmr,
    ranked,
    joinedAt: Date.now(),
  };

  addWaitingClient(clientData);
  client.send(JSON.stringify({ type: MessageTypes.QUEUE_ADDED }));
  tryMatchPlayers(getWaitingClients());
}

export function handleQueueLeave(client, payload) {
  const { userId } = payload;
  removeWaitingClient(client);

  const interval = timers.get(userId);
  if (interval) {
    clearInterval(interval);
    timers.delete(userId);
  }

  client.send(JSON.stringify({ type: MessageTypes.QUEUE_LEAVE }));
}

export async function handleClientDisconnection(client) {
  const disconnectedClient = getGameClients().find((c) => c.client === client);

  if (disconnectedClient) {
    const { gameId, userId } = disconnectedClient;

    removeGameClient(disconnectedClient);

    const opponentClient = getGameClients().find(
        (c) => c.gameId === gameId && c.userId !== userId
    );

    if (opponentClient) {
      opponentClient.client.send(
          JSON.stringify({
            type: MessageTypes.PLAYER_QUIT_GAME,
            message: `Votre adversaire a quitté la partie.`,
          })
      );
    }

    const gameTimer = timers.get(gameId);
    if (gameTimer) {
      clearInterval(gameTimer);
      timers.delete(gameId);
    }

    await db.game.update({
      where: { id: gameId },
      data: { status: 'PAUSED' },
    });
  }
}

export async function handleGameReconnect(client, payload) {
  const { userId, gameId } = payload;

  const gameClient = getGameClients().find((c) => c.client === client);

  if (gameClient) {
    removeGameClient(gameClient);
  }

  addGameClient({ client, gameId, userId });

  const opponentClient = getGameClients().find(
      (c) => c.gameId === gameId && c.userId !== userId
  );

  db.game.findUnique({ where: { id: gameId } }).then(async (game) => {
    if (game.status === 'PAUSED') {
      await db.game.update({
        where: {id: gameId},
        data: {status: 'IN_PROGRESS'},
      });

      const timer = setInterval(() => {
        db.game.findUnique({where: {id: gameId}}).then(async (updatedGame) => {
          if (updatedGame.timer > 0) {
            await db.game.update({
              where: {id: gameId},
              data: {timer: updatedGame.timer - 1},
            });
          } else {
            clearInterval(timer);
            timers.delete(gameId);
          }
        });
      }, 1000);

      timers.set(gameId, timer);
    }

    if (opponentClient) {
      opponentClient.client.send(
          JSON.stringify({
            type: MessageTypes.OPPONENT_RECONNECT,
            message: "L'adversaire s'est reconnecté.",
          })
      );
    }

    client.send(
        JSON.stringify({
          type: MessageTypes.GAME_RECONNECT,
          gameId,
          message: 'Vous vous êtes reconnecté à la partie.',
        })
    );
  });
}
