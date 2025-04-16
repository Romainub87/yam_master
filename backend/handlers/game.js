import {
  getGameClients,
  addGameClient,
  removeGameClient,
  addSuspendedClient,
  getSuspendedClients, removeSuspendedClient
} from '../websocket.js';
import db from '../connection.js';
import { MessageTypes } from '../types/message.js';
import jwt from 'jsonwebtoken';

export async function handleGameSubscribe(client, payload) {
  const { userId, gameId } = payload;
  try {
    const game = await db.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Partie introuvable' }));
      return;
    }

    const playerScores = await db.player_score.findMany({
      where: { game_id: gameId },
    });

    const playerScore = playerScores.find(player => player.user_id === userId);
    const opponentScore = playerScores.find(player => player.user_id !== userId);

    // Envoyer les données de la partie au client
    client.send(JSON.stringify({
      type: MessageTypes.GAME_UPDATE,
      game: game,
      playerScore: playerScore,
      opponentScore: opponentScore,
    }));
  } catch (error) {
    console.error('Erreur dans handleGameSubscribe :', error);
    client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Erreur lors de l\'abonnement à la partie' }));
  }
}

export async function handleRollDices(client, payload) {
  const { gameId, userId, count } = payload;

  const playerScores = await db.player_score.findMany({
    where: { game_id: gameId },
  });

  const playerScore = playerScores.find(player => player.user_id === userId);
  const opponentScore = playerScores.find(player => player.user_id !== userId);

  if (!playerScore) {
    client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Vous n\'êtes pas dans cette partie' }));
    return;
  }

  if (playerScore.rolls_left === 0) {
    client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Plus de lancers disponibles' }));
    return;
  }

  if (!gameId) {
    client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'ID de la partie manquant' }));
    return;
  }

  const game = await db.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Partie introuvable' }));
    return;
  }

  const diceRolls = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);

  await db.player_score.update({
    where: {
      game_id_user_id: {
        game_id: gameId,
        user_id: userId,
      },
    },
    data: {
      rolls_left: {
        decrement: 1,
      },
    },
  });

  const playerScoreUpdated = await db.player_score.findUnique({
    where: {
      game_id_user_id: {
        game_id: gameId,
        user_id: userId,
      },
    },
  });

  const counts = diceRolls.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  // TODO: Vérifier les combinaisons possibles et les implémenter
  const combinations = {
    threeOfAKind: Object.values(counts).some(count => count === 3),
    fourOfAKind: Object.values(counts).some(count => count === 4),
    fullHouse: Object.values(counts).includes(3) && Object.values(counts).includes(2),
    yahtzee: Object.values(counts).some(count => count === 5),
    smallStraight: [1, 2, 3, 4].every(num => counts[num]) || [2, 3, 4, 5].every(num => counts[num]) || [3, 4, 5, 6].every(num => counts[num]),
    largeStraight: [1, 2, 3, 4, 5].every(num => counts[num]) || [2, 3, 4, 5, 6].every(num => counts[num]),
  };

  client.send(JSON.stringify({
    type: MessageTypes.DICE_ROLL,
    dice: diceRolls,
    game: game,
    combinations: combinations,
    playerScore: playerScoreUpdated,
  }));

  if (opponentScore) {
    const opponentClient = getGameClients().find(c => c.gameId === gameId && c.userId === opponentScore.user_id);
    if (opponentClient) {
      opponentClient.client.send(JSON.stringify({
        type: MessageTypes.OPPONENT_UPDATE,
        dice: diceRolls,
        game: game,
        opponentScore: playerScoreUpdated,
      }));
    }
  }
}

export async function handleTurnChange(client, payload) {
  const { gameId, userId } = payload;

  try {
    const playerScores = await db.player_score.findMany({
      where: { game_id: gameId },
    });

    if (playerScores.length !== 2) {
      client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Nombre de joueurs incorrect' }));
      return;
    }

    for (const player of playerScores) {
      await db.player_score.update({
        where: {
          game_id_user_id: {
            game_id: gameId,
            user_id: player.user_id,
          },
        },
        data: {
          turn: player.user_id !== userId,
          rolls_left: player.user_id !== userId ? 3 : 0,
        },
      });
    }

    const updatedScores = await db.player_score.findMany({
      where: { game_id: gameId },
    });

    const game = await db.game.findUnique({
        where: { id: gameId },
    });

    updatedScores.forEach(player => {
      const gameClient = getGameClients().find(c => c.gameId === gameId && c.userId === player.user_id);
      console.log(gameClient);
      if (gameClient) {
        gameClient.client.send(JSON.stringify({
          type: MessageTypes.GAME_UPDATE,
          opponentScore: updatedScores.find(p => p.user_id !== player.user_id),
          playerScore: player,
          game: game,
          dice: [],
        }));
      }
    });
  } catch (error) {
    console.error('Erreur dans handleTurnChange :', error);
    client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Erreur lors du changement de tour' }));
  }
}

export async function handleQuitGame(client, payload) {

  const { gameId, userId } = payload;

  try {
    const gameClients = getGameClients().filter(c => c.gameId === gameId && c.userId !== userId);
    gameClients.forEach(gameClient => {
      gameClient.client.send(JSON.stringify({
        type: MessageTypes.PLAYER_QUIT_GAME,
        message: `L'adversaire a quitté la partie.`,
      }));
    });

    client.send(JSON.stringify({
      type: MessageTypes.QUIT_GAME,
      message: 'Vous avez quitté la partie.',
    }));

    removeGameClient(client);
    addSuspendedClient({ client: client, gameId: gameId, userId: userId});
  } catch (error) {
    console.error('Erreur dans handleQuitGame :', error);
    client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Erreur lors de la déconnexion de la partie' }));
  }
}

export async function handleDefinitiveQuitGame(client, payload) {
  const gameClients = getGameClients().filter(c => c.gameId === payload.gameId);
  const suspendedClients = getSuspendedClients().filter(c => c.gameId === payload.gameId);
  const allPlayers = [...gameClients, ...suspendedClients];
  await db.player_score.deleteMany({
    where: {
      game_id: payload.gameId,
    },
  });
  for (const player of allPlayers) {
    removeSuspendedClient(player.client);
    removeGameClient(player.client);

    player.client.send(JSON.stringify({
      type: MessageTypes.DEFINITIVE_QUIT_GAME,
      message: 'La partie est terminée.',
    }));
  }
}

export async function handleForfeit(client, payload) {
    const gameClients = getGameClients().filter(c => c.gameId === payload.gameId && c.userId !== payload.userId);
    gameClients.forEach(gameClient => {
        gameClient.client.send(JSON.stringify({
          type: MessageTypes.OPPONENT_FORFEIT,
          message: `L'adversaire a abandonné.`,
        }));
    });

    client.send(JSON.stringify({
        type: MessageTypes.PLAYER_FORFEIT,
        message: 'Vous avez abandonné la partie.',
    }));

    removeGameClient(client);
}
