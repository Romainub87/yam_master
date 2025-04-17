import {
  getGameClients,
  removeGameClient,
  getSuspendedClients, removeSuspendedClient
} from '../websocket.js';
import db from '../connection.js';
import { MessageTypes } from '../types/message.js';
import {resetDices} from "../lib/game.js";

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

    client.send(JSON.stringify({
      type: MessageTypes.GAME_UPDATE,
      game: game,
      dice: game.dice_state,
      playerScore: playerScore,
      opponentScore: opponentScore,
    }));
  } catch (error) {
    console.error('Erreur dans handleGameSubscribe :', error);
    client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Erreur lors de l\'abonnement à la partie' }));
  }
}

export async function handleRollDices(client, payload) {
  const { gameId, userId, dices } = payload;

  const playerScores = await db.player_score.findMany({
    where: { game_id: gameId },
  });

  const opponentUserId = playerScores.find(player => player.user_id !== userId)?.user_id;

  const game = await db.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Partie introuvable' }));
    return;
  }

  const diceRolls = dices.map(dice => ({ value: dice.locked ? dice.value : Math.floor(Math.random() * 6) + 1, locked: dice.locked }));

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

  await db.game.update(
    {
      where: { id: gameId },
      data: {
        dice_state: diceRolls
      },
    }
  )

  client.send(JSON.stringify({
    type: MessageTypes.DICE_ROLL,
    dice: diceRolls ?? {},
    game: game,
    combinations: combinations,
    playerScore: playerScoreUpdated,
  }));

  const opponentClient = getGameClients().find(c => c.gameId === gameId && c.userId === opponentUserId && c.client !== client);
  if (opponentClient) {
    opponentClient.client.send(JSON.stringify({
      type: MessageTypes.OPPONENT_UPDATE,
      dice: diceRolls ?? {},
      game: game,
      opponentScore: playerScoreUpdated,
    }));
  }
}

export async function handleLockDice(client, payload) {
    const { gameId, userId, dices, dicePos } = payload;

    const playerScores = await db.player_score.findMany({
        where: { game_id: gameId },
    });
0
    const opponentUserId = playerScores.find(player => player.user_id !== userId)?.user_id;

    const game = await db.game.findUnique({
        where: { id: gameId },
    });

    if (!game) {
        client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Partie introuvable' }));
        return;
    }

    const diceRolls = dices.map((dice, index) => ({ value: dice.value, locked: index === dicePos ? !dice.locked : dice.locked }));

    await db.game.update(
        {
        where: { id: gameId },
        data: {
            dice_state: diceRolls
        },
        }
    )

    client.send(JSON.stringify({
        type: MessageTypes.LOCK_DICE,
        dice: diceRolls ?? {},
        game: game,
    }));

    const opponentClient = getGameClients().find(c => c.gameId === gameId && c.userId === opponentUserId && c.client !== client);
    if (opponentClient) {
        opponentClient.client.send(JSON.stringify({
        type: MessageTypes.LOCK_DICE_OPPONENT,
        dice: diceRolls ?? {},
        game: game,
        }));
    }
}

export async function handleTurnChange(client, payload) {
  const { gameId, userId } = payload;

  try {
    const playerScores = await db.player_score.findMany({ where: { game_id: gameId } });

    if (playerScores.length !== 2) {
      return client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Nombre de joueurs incorrect' }));
    }

    await Promise.all(playerScores.map(player =>
        db.player_score.update({
          where: { game_id_user_id: { game_id: gameId, user_id: player.user_id } },
          data: {
            turn: player.user_id !== userId,
            rolls_left: player.user_id !== userId ? 3 : 0,
          },
        })
    ));

    const updatedScores = await db.player_score.findMany({ where: { game_id: gameId } });
    const game = await db.game.findUnique({ where: { id: gameId } });

      for (const player of updatedScores) {
          const gameClient = getGameClients().find(c => c.gameId === gameId && c.userId === player.user_id);
          if (gameClient) {
              gameClient.client.send(JSON.stringify({
                  type: MessageTypes.GAME_UPDATE,
                  opponentScore: updatedScores.find(p => p.user_id !== player.user_id),
                  playerScore: player,
                  game: game,
                  dice: await resetDices(game),
              }));
          }
      }
  } catch (error) {
    client.send(JSON.stringify({ type: MessageTypes.GAME_ERROR, message: 'Erreur lors du changement de tour' }));
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
  const gameClient = getGameClients().find(c => c.gameId === payload.gameId && c.userId !== payload.userId);

  if (gameClient) {
    gameClient.client.send(JSON.stringify({
      type: MessageTypes.OPPONENT_FORFEIT,
      message: `L'adversaire a abandonné.`,
    }));
  }

  client.send(JSON.stringify({
    type: MessageTypes.PLAYER_FORFEIT,
    message: 'Vous avez abandonné la partie.',
  }));

  removeGameClient(client);
}
