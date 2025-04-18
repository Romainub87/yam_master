import {
  getGameClients,
  removeGameClient,
  getSuspendedClients, removeSuspendedClient
} from '../websocket.js';
import db from '../connection.js';
import { MessageTypes } from '../types/message.js';
import {resetDices, calculateValidCombinations} from "../lib/game.js";

export async function handleGameSubscribe(client, payload) {
  const { userId, gameId } = payload;
    const gameClient = getGameClients().find(c => c.gameId === gameId && c.userId === userId);
    if (gameClient && gameClient.client !== client) {
        gameClient.client = client;
    }
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
      combinations: calculateValidCombinations(game.dice_state),
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

  const validCombination = calculateValidCombinations(diceRolls);

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
    combinations: validCombination,
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

      const updatedScore = await db.player_score.findMany({ where: { game_id: gameId } });
      console.log(updatedScore);
      const game = await db.game.update({
          where: { id: gameId },
          data: {
              timer: 20,
          },
      });

      const playerScore = updatedScore.find(player => player.user_id === userId);
      const opponentScore = updatedScore.find(player => player.user_id !== userId);
      const gameClient = getGameClients().find(c => c.gameId === gameId && c.userId === opponentScore.user_id);

      gameClient.client.send(JSON.stringify({
          type: MessageTypes.GAME_UPDATE,
          opponentScore: playerScore,
          playerScore: opponentScore,
          game: game,
          dice: await resetDices(game),
      }));

      client.send(JSON.stringify({
          type: MessageTypes.GAME_UPDATE,
          opponentScore: opponentScore,
          playerScore: playerScore,
          game: game,
          dice: await resetDices(game),
      }));
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

export async function handleTimerUpdate(client, payload) {
    const { gameId, time } = payload;
    const game = await db.game.update({
        where: { id: gameId },
        data: {
            timer: time - 1,
        },
    });

    client.send(JSON.stringify({
        type: MessageTypes.TIMER_UPDATE,
        time: game.timer,
    }));
}
