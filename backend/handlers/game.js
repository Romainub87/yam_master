import {
  getGameClients,
  removeGameClient,
  getSuspendedClients,
  removeSuspendedClient,
} from '../websocket.js';
import db from '../connection.js';
import { MessageTypes } from '../types/message.js';
import {
  resetDices,
  calculateValidCombinations,
  checkAlignmentsAndUpdateScores,
  updateMMR,
} from '../lib/game.js';
import { handleBotAction } from './bot.js';

export async function handleGameSubscribe(client, payload) {
  const { userId, gameId } = payload;
  const gameClient = getGameClients().find(
    (c) => c.gameId === gameId && c.userId === userId
  );
  if (gameClient && gameClient.client !== client) {
    gameClient.client = client;
  }
  try {
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

    const playerScores = await db.player_score.findMany({
      where: { game_id: gameId },
    });

    const playerScore = playerScores.find(
      (player) => player.user_id === userId
    );
    const opponentScore = playerScores.find(
      (player) => player.user_id !== userId
    );

    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_UPDATE,
        game: game,
        dice: game.dice_state,
        combinations: calculateValidCombinations(
          game.dice_state?.length ? game.dice_state : [],
          playerScore,
          game.grid_state
        ),
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
  const { gameId, userId, dices } = payload;

  const playerScores = await db.player_score.findMany({
    where: { game_id: gameId },
  });
  const opponentUserId = playerScores.find(
    (player) => player.user_id !== userId
  )?.user_id;

  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) {
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_ERROR,
        message: 'Partie introuvable',
      })
    );
    return;
  }

  const diceRolls = dices.map((dice) => ({
    value: dice.locked ? dice.value : Math.floor(Math.random() * 6) + 1,
    locked: dice.locked,
  }));

  await db.player_score.update({
    where: { game_id_user_id: { game_id: gameId, user_id: userId } },
    data: { rolls_left: { decrement: 1 } },
  });

  const playerScoreUpdated = await db.player_score.findUnique({
    where: { game_id_user_id: { game_id: gameId, user_id: userId } },
  });

  const validCombination = calculateValidCombinations(
    diceRolls,
    playerScoreUpdated,
    game.grid_state
  );

  await db.game.update({
    where: { id: gameId },
    data: { dice_state: diceRolls },
  });

  client.send(
    JSON.stringify({
      type: MessageTypes.DICE_ROLL,
      dice: diceRolls,
      game,
      combinations: validCombination,
      playerScore: playerScoreUpdated,
    })
  );

  const opponentClient = getGameClients().find(
    (c) =>
      c.gameId === gameId && c.userId === opponentUserId && c.client !== client
  );
  if (opponentClient) {
    opponentClient.client.send(
      JSON.stringify({
        type: MessageTypes.OPPONENT_UPDATE,
        dice: diceRolls,
        game,
        opponentScore: playerScoreUpdated,
      })
    );
  }
}

export async function handleLockDice(client, payload) {
  const { gameId, userId, dices, dicePos } = payload;

  const playerScores = await db.player_score.findMany({
    where: { game_id: gameId },
  });
  const opponentUserId = playerScores.find(
    (player) => player.user_id !== userId
  )?.user_id;

  const game = await db.game.findUnique({ where: { id: gameId } });

  if (!game) {
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_ERROR,
        message: 'Partie introuvable',
      })
    );
    return;
  }

  const diceRolls = dices.map((dice, index) => ({
    value: dice.value,
    locked: index === dicePos ? !dice.locked : dice.locked,
  }));

  await db.game.update({
    where: { id: gameId },
    data: { dice_state: diceRolls },
  });

  client.send(
    JSON.stringify({
      type: MessageTypes.LOCK_DICE,
      dice: diceRolls,
      game,
    })
  );

  const opponentClient = getGameClients().find(
    (c) =>
      c.gameId === gameId && c.userId === opponentUserId && c.client !== client
  );
  if (opponentClient) {
    opponentClient.client.send(
      JSON.stringify({
        type: MessageTypes.LOCK_DICE_OPPONENT,
        dice: diceRolls,
        game,
      })
    );
  }
}

export async function handleTurnChange(client, payload) {
  const { gameId, userId } = payload;

  if (gameId) {
    const game = await db.game.findUnique({
      where: { id: gameId, status: 'IN_PROGRESS' },
    });
    if (game && game.isBot) {
      await handleBotAction(client, payload);
      return;
    }
    if (!game) {
      client.send(
        JSON.stringify({
          type: MessageTypes.GAME_ERROR,
          message: 'Partie introuvable',
        })
      );
      return;
    }
  }

  try {
    const playerScores = await db.player_score.findMany({
      where: { game_id: gameId },
    });

    if (playerScores.length !== 2) {
      return client.send(
        JSON.stringify({
          type: MessageTypes.GAME_ERROR,
          message: 'Nombre de joueurs incorrect',
        })
      );
    }

    await Promise.all(
      playerScores.map((player) =>
        db.player_score.update({
          where: {
            game_id_user_id: { game_id: gameId, user_id: player.user_id },
          },
          data: {
            turn: player.user_id !== userId,
            rolls_left: player.user_id !== userId ? 3 : 0,
            challenge: false,
          },
        })
      )
    );

    const updatedScore = await db.player_score.findMany({
      where: { game_id: gameId },
    });
    const game = await db.game.update({
      where: { id: gameId },
      data: {
        timer: 20,
      },
    });

    const playerScore = updatedScore.find(
      (player) => player.user_id === userId
    );
    const opponentScore = updatedScore.find(
      (player) => player.user_id !== userId
    );
    const gameClient = getGameClients().find(
      (c) => c.gameId === gameId && c.userId === opponentScore.user_id
    );

    gameClient.client.send(
      JSON.stringify({
        type: MessageTypes.GAME_UPDATE,
        opponentScore: playerScore,
        playerScore: opponentScore,
        game: game,
        dice: await resetDices(game),
      })
    );

    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_UPDATE,
        opponentScore: opponentScore,
        playerScore: playerScore,
        game: game,
        dice: await resetDices(game),
      })
    );
  } catch (error) {
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_ERROR,
        message: 'Erreur lors du changement de tour',
      })
    );
  }
}

export async function handleDefinitiveQuitGame(client, payload) {
  const { gameId } = payload;

  const allPlayers = [
    ...getGameClients().filter((c) => c.gameId === gameId),
    ...getSuspendedClients().filter((c) => c.gameId === gameId),
  ];

  allPlayers.forEach((player) => {
    removeSuspendedClient(player);
    removeGameClient(player);
    player.client.send(
      JSON.stringify({
        type: MessageTypes.DEFINITIVE_QUIT_GAME,
        message: 'La partie est terminée.',
      })
    );
  });

  await db.game.update({
    where: { id: payload.gameId },
    data: { status: 'FINISHED' },
  });
}

export async function handleForfeit(client, payload) {
  const gameClient = getGameClients().find(
    (c) => c.gameId === payload.gameId && c.userId !== payload.userId
  );

  if (gameClient) {
    gameClient.client.send(
      JSON.stringify({
        type: MessageTypes.OPPONENT_FORFEIT,
        message: `L'adversaire a abandonné.`,
        winner: true,
      })
    );
    await db.player_score.update({
      where: {
        game_id_user_id: {
          game_id: payload.gameId,
          user_id: gameClient.userId,
        },
      },
      data: { winner: true },
    });
  }

  await db.player_score.update({
    where: {
      game_id_user_id: { game_id: payload.gameId, user_id: payload.userId },
    },
    data: { winner: false },
  });

  client.send(
    JSON.stringify({
      type: MessageTypes.PLAYER_FORFEIT,
      message: 'Vous avez abandonné la partie.',
      winner: false,
    })
  );

  await db.game.update({
    where: { id: payload.gameId },
    data: { status: 'FINISHED' },
  });

  if (gameClient && gameClient.gameId) {
    const game = await db.game.findUnique({ where: { id: gameClient.gameId } });
    await updateMMR(
      payload.userId,
      gameClient.gameId,
      false,
      game.isRanked,
      client
    );
    await updateMMR(
      gameClient.userId,
      gameClient.gameId,
      true,
      game.isRanked,
      gameClient.client
    );
  }

  removeGameClient(client);
}

export async function handleTimerUpdate(client, payload) {
  const { gameId, time } = payload;

  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game || game.status !== 'IN_PROGRESS') {
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_ERROR,
        message: 'Partie introuvable ou statut incorrect',
      })
    );
    return;
  }

  const updatedGame = await db.game.update({
    where: { id: gameId },
    data: {
      timer: time - 1,
    },
  });

  client.send(
    JSON.stringify({
      type: MessageTypes.TIMER_UPDATE,
      time: updatedGame.timer,
    })
  );
}

export async function handleScoreCombination(client, payload) {
  const { gameId, userId, combination, row, col } = payload;

  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) {
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_ERROR,
        message: 'Partie introuvable',
      })
    );
    return;
  }

  const grid = game.grid_state;

  const updatedGrid = grid.map((rowData, rowIndex) => {
    if (rowIndex === row) {
      return rowData.map((cell, colIndex) => {
        if (colIndex === col) {
          return {
            ...cell,
            user: userId,
            combination: combination,
          };
        }
        return cell;
      });
    }
    return rowData;
  });

  await db.game.update({
    where: { id: gameId },
    data: {
      grid_state: updatedGrid,
    },
  });

  const playerScores = await db.player_score.findMany({
    where: { game_id: gameId },
  });
  const opponentUserId = playerScores.find(
    (player) => player.user_id !== userId
  )?.user_id;

  const gameClient = getGameClients().find(
    (c) => c.gameId === gameId && c.userId === opponentUserId
  );
  await Promise.all(
    playerScores.map((player) =>
      checkAlignmentsAndUpdateScores(gameId, player.user_id, client, gameClient)
    )
  );

  const updatedPlayerScore = await db.player_score.findUnique({
    where: { game_id_user_id: { game_id: gameId, user_id: userId } },
  });
  const updatedOpponentScore = await db.player_score.findUnique({
    where: { game_id_user_id: { game_id: gameId, user_id: opponentUserId } },
  });

  if (gameClient) {
    gameClient.client.send(
      JSON.stringify({
        type: MessageTypes.OPPONENT_UPDATE,
        game: game,
        playerScore: updatedPlayerScore,
        opponentScore: updatedOpponentScore,
      })
    );
  }

  client.send(
    JSON.stringify({
      type: MessageTypes.SCORE_COMBINATION,
      game: game,
      playerScore: updatedPlayerScore,
      opponentScore: updatedOpponentScore,
    })
  );
}

export async function handleChallenge(client, payload) {
  const { gameId, userId } = payload;

  const game = await db.game.findUnique({ where: { id: gameId } });

  if (!game) {
    client.send(
      JSON.stringify({
        type: MessageTypes.GAME_ERROR,
        message: 'Partie introuvable',
        show: false,
      })
    );
    return;
  }

  const hasFreeChallengeCell = game.grid_state.some((row) =>
    row.some((cell) => cell.combination === 'DEFI' && !cell.user)
  );

  if (!hasFreeChallengeCell) {
    client.send(
      JSON.stringify({
        type: MessageTypes.CHALLENGE,
        message: 'Aucune case défi disponible.',
        show: false,
      })
    );
    return;
  }

  await db.player_score.update({
    where: { game_id_user_id: { game_id: gameId, user_id: userId } },
    data: { challenge: true },
  });

  client.send(
    JSON.stringify({
      type: MessageTypes.CHALLENGE,
      message: 'Défi activé !',
      show: false,
    })
  );
}
