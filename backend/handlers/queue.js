import {
  getWaitingClients,
  addWaitingClient,
  removeWaitingClient,
  getGameClients,
  addGameClient,
} from '../websocket.js';
import db from '../connection.js';
import { MessageTypes } from '../types/message.js';
import jwt from 'jsonwebtoken';
import { tryMatchPlayers } from '../lib/matchmaking.js';

export async function handleQueueJoin(client, payload) {
  const waitingClients = getWaitingClients();

  const { user, token } = payload;
  // TODO: Use real value ranked
  const ranked = false;
  const mmr = ranked ? user.mmr ?? 400 : user.hide_mmr ?? 400;

  const clientData = {
    client,
    user,
    mmr,
    ranked,
    token,
    joinedAt: Date.now(),
  };

  if (waitingClients.length === 0) {
    addWaitingClient(clientData);
    client.send(JSON.stringify({ type: MessageTypes.QUEUE_ADDED }));
  } else {
    // TODO: intégrer tryMatchPlayers(getWaitingClients());
    const firstClient = waitingClients[0];

    const game = await db.$transaction(async (prisma) => {
      // Créer une nouvelle partie
      const newGame = await prisma.game.create({
        data: {
          grid_state: {},
          dice_state: {},
          timer: 30,
        },
      });

      // Récupérer l'ID de la partie créée
      const gameId = newGame.id;

      // Décoder les tokens des joueurs
      const opponentToken = firstClient.token;
      const opponentDecodedToken = jwt.verify(
        opponentToken,
        process.env.JWT_SECRET
      );
      const opponentId = opponentDecodedToken.user.id;

      const clientToken = payload.token;
      const decodedToken = jwt.verify(clientToken, process.env.JWT_SECRET);
      const clientId = decodedToken.user.id;

      // Déterminer les tours et les lancers restants
      const turn = Math.random() < 0.5;
      const opponentTurn = turn;
      const playerTurn = !turn;

      const opponentRolls = opponentTurn ? 3 : 0;
      const playerRolls = playerTurn ? 3 : 0;

      // Associer les joueurs à la partie
      await prisma.player_score.createMany({
        data: [
          {
            user_id: opponentId,
            game_id: gameId,
            score: 0,
            rolls_left: opponentRolls,
            turn: opponentTurn,
          },
          {
            user_id: clientId,
            game_id: gameId,
            score: 0,
            rolls_left: playerRolls,
            turn: playerTurn,
          },
        ],
      });

      return newGame;
    });

    const playerScores = await db.player_score.findMany({
      where: { game_id: game.id },
    });
    const playerScore = playerScores.find(
      (player) => player.user_id === user.id
    );
    const opponentScore = playerScores.find(
      (player) => player.user_id !== user.id
    );

    firstClient.client.send(
      JSON.stringify({
        type: MessageTypes.GAME_START,
        game: game,
        playerScore: opponentScore,
        opponentScore: playerScore,
      })
    );
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_START,
        game: game,
        playerScore: playerScore,
        opponentScore: opponentScore,
      })
    );

    removeWaitingClient({
      client: firstClient.client,
      payload: firstClient.payload,
    });
    removeWaitingClient({ client: client, payload: payload });

    addGameClient({
      client: firstClient.client,
      gameId: game.id,
      userId: opponentScore.user_id,
    });
    addGameClient({
      client: client,
      gameId: game.id,
      userId: playerScore.user_id,
    });
  }
}

export function handleQueueLeave(client) {
  removeWaitingClient(client);
  client.send(JSON.stringify({ type: MessageTypes.QUEUE_LEAVE }));
}

export async function handleGameSubscribe(client, payload) {
  try {
    const decodedToken = jwt.verify(payload.token, process.env.JWT_SECRET);
    const userId = decodedToken.user.id;

    // Récupérer les données de la partie en cours
    const game = await db.game.findUnique({
      where: { id: parseInt(payload.gameId, 10) },
    });

    if (!game) {
      client.send(
        JSON.stringify({
          type: MessageTypes.GAME_ERROR,
          message: 'Partie introuvable',
        })
      );
      return;
    }

    const existingClient = getGameClients().find(
      (gameClient) =>
        gameClient.gameId === game.id && gameClient.userId === userId
    );

    if (!existingClient) {
      addGameClient({ client, gameId: game.id, userId: userId });
    }

    const playerScores = await db.player_score.findMany({
      where: { game_id: game.id },
    });

    const playerScore = playerScores.find(
      (player) => player.user_id === userId
    );
    const opponentScore = playerScores.find(
      (player) => player.user_id !== userId
    );

    // Envoyer les données de la partie au client
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_UPDATE,
        game: game,
        playerScore: playerScore,
        opponentScore: opponentScore,
      })
    );
  } catch (error) {
    console.error('Erreur dans handleGameSubscribe :', error);
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_ERROR,
        message: "Erreur lors de l'abonnement à la partie",
      })
    );
  }
}

export async function handleRollDices(client, payload) {
  const gameId = payload.gameId;
  const decodedToken = jwt.verify(payload.token, process.env.JWT_SECRET);
  const userId = decodedToken.user.id;

  const playerScores = await db.player_score.findMany({
    where: { game_id: gameId },
  });

  const playerScore = playerScores.find((player) => player.user_id === userId);
  const opponentScore = playerScores.find(
    (player) => player.user_id !== userId
  );

  if (!playerScore) {
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_ERROR,
        message: "Vous n'êtes pas dans cette partie",
      })
    );
    return;
  }

  if (playerScore.rolls_left === 0) {
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_ERROR,
        message: 'Plus de lancers disponibles',
      })
    );
    return;
  }

  if (!gameId) {
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_ERROR,
        message: 'ID de la partie manquant',
      })
    );
    return;
  }

  const game = await db.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_ERROR,
        message: 'Partie introuvable',
      })
    );
    return;
  }

  const diceRolls = Array.from(
    { length: payload.count },
    () => Math.floor(Math.random() * 6) + 1
  );

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

  // Vérifier les combinaisons possibles
  const counts = diceRolls.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  // TODO: Vérifier les combinaisons possibles et les implémenter
  const combinations = {
    pair: Object.values(counts).some((count) => count === 2),
    threeOfAKind: Object.values(counts).some((count) => count === 3),
    fourOfAKind: Object.values(counts).some((count) => count === 4),
    fullHouse:
      Object.values(counts).includes(3) && Object.values(counts).includes(2),
    yahtzee: Object.values(counts).some((count) => count === 5),
    smallStraight:
      [1, 2, 3, 4].every((num) => counts[num]) ||
      [2, 3, 4, 5].every((num) => counts[num]) ||
      [3, 4, 5, 6].every((num) => counts[num]),
    largeStraight:
      [1, 2, 3, 4, 5].every((num) => counts[num]) ||
      [2, 3, 4, 5, 6].every((num) => counts[num]),
  };

  client.send(
    JSON.stringify({
      type: MessageTypes.DICE_ROLL,
      dice: diceRolls,
      game: game,
      combinations: combinations,
      playerScore: playerScoreUpdated,
    })
  );

  if (opponentScore) {
    const opponentClient = getGameClients().find(
      (c) => c.gameId === gameId && c.userId === opponentScore.user_id
    );
    if (opponentClient) {
      opponentClient.client.send(
        JSON.stringify({
          type: MessageTypes.OPPONENT_UPDATE,
          dice: diceRolls,
          game: game,
          opponentScore: playerScoreUpdated,
        })
      );
    }
  }
}

export async function handleTurnChange(client, payload) {
  const gameId = payload.gameId;

  try {
    // Récupérer les scores des joueurs pour la partie
    const playerScores = await db.player_score.findMany({
      where: { game_id: gameId },
    });

    if (playerScores.length !== 2) {
      client.send(
        JSON.stringify({
          type: MessageTypes.GAME_ERROR,
          message: 'Nombre de joueurs incorrect',
        })
      );
      return;
    }

    // Inverser les tours
    const updates = playerScores.map((player) => {
      return db.player_score.update({
        where: {
          game_id_user_id: {
            game_id: gameId,
            user_id: player.user_id,
          },
        },
        data: {
          turn: !player.turn,
          rolls_left: !player.turn ? 3 : 0,
        },
      });
    });

    await Promise.all(updates);

    // Récupérer les scores mis à jour
    const updatedScores = await db.player_score.findMany({
      where: { game_id: gameId },
    });

    // Notifier les clients
    updatedScores.forEach((player) => {
      const gameClient = getGameClients().find(
        (c) => c.gameId === gameId && c.userId === player.user_id
      );
      if (gameClient) {
        gameClient.client.send(
          JSON.stringify({
            type: MessageTypes.GAME_UPDATE,
            opponentScore: updatedScores.find(
              (p) => p.user_id !== player.user_id
            ),
            playerScore: player,
            game: { id: gameId }, // Inclure les données nécessaires de la partie
            dice: [],
          })
        );
      }
    });
  } catch (error) {
    console.error('Erreur dans handleTurnChange :', error);
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_ERROR,
        message: 'Erreur lors du changement de tour',
      })
    );
  }
}
