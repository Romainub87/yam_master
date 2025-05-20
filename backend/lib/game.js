import {addGameClient} from '../websocket.js';
import db from '../connection.js';
import {MessageTypes} from '../types/message.js';
import {timers} from "../handlers/queue.js";

export async function createGame(p1, p2) {
  const game = await db.$transaction(async (prisma) => {

    const newGame = await prisma.game.create({
      data: {
        grid_state: createGridFor2Players(),
        dice_state: Array(5).fill({ value: null, locked: false }),
        timer: 20,
        status: 'IN_PROGRESS',
        isRanked: p1.ranked,
      },
    });

    const gameId = newGame.id;

    const opponentId = p2.user.id;
    const clientId = p1.user.id;

    const turn = Math.random() < 0.5;

    await prisma.player_score.createMany({
      data: [
        {
          user_id: opponentId,
          game_id: gameId,
          score: 0,
          rolls_left: turn ? 3 : 0,
          turn: turn,
        },
        {
          user_id: clientId,
          game_id: gameId,
          score: 0,
          rolls_left: turn ? 0 : 3,
          turn: !turn,
        },
      ],
    });

    return newGame;
  });

  const playerScores = await db.player_score.findMany({
    where: { game_id: game.id },
  });

  const playerScore = playerScores.find((player) => player.user_id === p2.user.id);
  const opponentScore = playerScores.find((player) => player.user_id !== p2.user.id);

  [p1.user.id, p2.user.id].forEach(userId => {
    const interval = timers.get(userId);
    if (interval) {
      clearInterval(interval);
      timers.delete(userId);
    }
  });

  const gameStartMessage = (player, opponent) => ({
    type: MessageTypes.GAME_START,
    game: game,
    playerScore: player,
    opponentScore: opponent,
  });

  p1.client.send(JSON.stringify(gameStartMessage(opponentScore, playerScore)));
  p2.client.send(JSON.stringify(gameStartMessage(playerScore, opponentScore)));

  addGameClient({ client: p1.client, gameId: game.id, userId: opponentScore.user_id });
  addGameClient({ client: p2.client, gameId: game.id, userId: playerScore.user_id });

  if (timers.has(p1.user.id)) {
    timers.delete(p1.user.id);
  }
    if (timers.has(p2.user.id)) {
        timers.delete(p2.user.id);
    }
}

export async function resetDices(game) {
  return db.$transaction(async (prisma) => {
    const updatedGame = await prisma.game.update({
      where: {id: game.id},
      data: {
        dice_state: Array(5).fill({value: null, locked: false}),
      },
      select: {dice_state: true},
    });
    return updatedGame.dice_state;
  });
}

export function calculateValidCombinations(diceRolls, playerScore, grid_state) {
  const counts = diceRolls.reduce((acc, dice) => {
    if (dice.value === null) return acc;
    acc[dice.value] = (acc[dice.value] || 0) + 1;
    return acc;
  }, {});

  const validCombination = [];

  const isCombinationPlaceable = (combination) => {
    return grid_state.some(row =>
        row.some(cell => cell.combination === combination && cell.user === null)
    );
  };

  if (
      diceRolls.every(dice => dice.value !== null) &&
      diceRolls.reduce((sum, dice) => sum + dice.value, 0) <= 8 &&
      isCombinationPlaceable('LESS8')
  ) {
    validCombination.push('LESS8');
  }
  if (
      Object.values(counts).some(count => count === 4) &&
      isCombinationPlaceable('CARRE')
  ) {
    validCombination.push('CARRE');
  }
  if (
      Object.values(counts).includes(3) &&
      Object.values(counts).includes(2) &&
      isCombinationPlaceable('FULL')
  ) {
    validCombination.push('FULL');
  }
  if (
      Object.values(counts).some(count => count === 5)
  ) {
    validCombination.push('YAM');
  }
  if (
      ([1, 2, 3, 4, 5].every(num => counts[num]) || [2, 3, 4, 5, 6].every(num => counts[num])) &&
      isCombinationPlaceable('SUITE')
  ) {
    validCombination.push('SUITE');
  }
  if (
      Object.values(counts).some(count => count === 3)
  ) {
    validCombination.push('BRELAN');
  }

  const majorityValue = validCombination.length > 0
      ? Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b))
      : null;

  [1, 2, 3, 4, 5, 6].forEach(value => {
    if (
        parseInt(majorityValue) === value &&
        isCombinationPlaceable(`WITH${value}`)
    ) {
      validCombination.push(`WITH${value}`);
    }
  });

  if (
      playerScore &&
      playerScore.rolls_left === 2 &&
      validCombination.length > 0 &&
      isCombinationPlaceable('SEC')) {
    validCombination.push('SEC');
  }

  if (playerScore?.challenge && validCombination.length > 0) {
    validCombination.push('DEFI');
  }

  if (validCombination.includes('BRELAN')) {
      validCombination.splice(validCombination.indexOf('BRELAN'), 1);
  }

  return validCombination;
}

export function createGridFor2Players() {
  return Array.from({ length: 5 }, (_, row) =>
      Array(5).fill(null).map((_, col) => ({
        combination: setCaseValue(row, col),
        user: null,
      }))
  );
}

export function setCaseValue(row, col) {
  switch (true) {
    case row === 1 && col === 3 || row === 2 && col === 1:
      return 'FULL';
    case row === 3 && col === 1 || row === 1 && col === 2:
      return 'SEC';
    case row === 0 && col === 2 || row === 2 && col === 3:
      return 'DEFI';
    case row === 2 && col === 2:
      return 'YAM';
    case row === 1 && col === 1 || row === 4 && col === 2:
      return 'CARRE';
    case row === 2 && col === 0 || row === 3 && col === 3:
      return 'LESS8';
    case row === 3 && col === 2 || row === 2 && col === 4:
      return 'SUITE';
    case row === 0 && col === 0 || row === 3 && col === 4:
        return 'WITH1';
    case row === 1 && col === 0 || row === 4 && col === 1:
        return 'WITH2';
    case row === 0 && col === 1 || row === 4 && col === 0:
        return 'WITH3';
    case row === 0 && col === 3 || row === 4 && col === 4:
        return 'WITH4';
    case row === 1 && col === 4 || row === 4 && col === 3:
        return 'WITH5';
    case row === 0 && col === 4 || row === 3 && col === 0:
        return 'WITH6';
    default:
      return null;
  }
}

export async function checkAlignmentsAndUpdateScores(gameId, userId, client, opponentClient) {
  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) {
    throw new Error('Partie introuvable');
  }

  const grid = game.grid_state;
  const alignments = await checkAlignments(grid, userId, gameId, game.isRanked, client, opponentClient);

  if (alignments > 0) {
    await db.player_score.update({
      where: { game_id_user_id: { game_id: gameId, user_id: userId } },
      data: { score: alignments },
    });
  }
}

async function checkAlignments(grid, userId, gameId, isRanked, client, opponentClient) {
  let alignments = 0;
  let hasWon = false;

  const calculateAlignmentScore = (count) => {
    if (count === 5) {
      hasWon = true;
      return 3;
    }
    if (count === 4) return 2;
    if (count === 3) return 1;
    return 0;
  };

  const checkRowColumn = (cells) => {
    let consecutive = 0;
    cells.forEach(cell => {
      consecutive = (cell.user === userId) ? consecutive + 1 : 0;
      if (consecutive >= 3) {
        alignments += calculateAlignmentScore(consecutive);
        if (hasWon) return;
      }
    });
  };

  grid.forEach(row => checkRowColumn(row));

  for (let col = 0; col < grid[0].length; col++) {
    let column = grid.map(row => row[col]);
    checkRowColumn(column);
    if (hasWon) break;
  }

  // Vérifie les diagonales
  const checkDiagonal = (startRow, startCol, rowIncrement, colIncrement) => {
    let consecutive = 0;
    let row = startRow, col = startCol;
    while (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
      consecutive = (grid[row][col].user === userId) ? consecutive + 1 : 0;
      if (consecutive >= 3) {
        alignments += calculateAlignmentScore(consecutive);
        if (hasWon) return;
      }
      row += rowIncrement;
      col += colIncrement;
    }
  };

  // Vérifie toutes les diagonales principales possibles
  for (let i = 0; i < grid.length; i++) {
    checkDiagonal(i, 0, 1, 1);
    if (hasWon) break;
  }
  for (let j = 1; j < grid[0].length; j++) {
    checkDiagonal(0, j, 1, 1);
    if (hasWon) break;
  }
  for (let i = 0; i < grid.length; i++) {
    checkDiagonal(i, grid[0].length - 1, 1, -1);
    if (hasWon) break;
  }
  for (let j = grid[0].length - 2; j >= 0; j--) {
    checkDiagonal(0, j, 1, -1);
    if (hasWon) break;
  }

  if (hasWon) {
    await db.game.update({
      where: { id: gameId },
      data: { status: 'FINISHED' },
    });

    await db.player_score.update({
      where: { game_id_user_id: { game_id: gameId, user_id: userId } },
      data: { winner: true },
    });
    if (opponentClient) {
      await db.player_score.update({
        where: { game_id_user_id: { game_id: gameId, user_id: opponentClient.userId } },
        data: { winner: false },
      });
    }

    client.send(JSON.stringify({
      type: MessageTypes.GAME_WIN,
      message: 'Vous avez gagné !',
    }));

    if (opponentClient) {
      opponentClient.client.send(JSON.stringify({
        type: MessageTypes.GAME_LOSE,
        message: 'Vous avez perdu.',
      }));
      await updateMMR(userId, gameId, true, isRanked);
      await updateMMR(opponentClient.userId, gameId, false, isRanked);
    }
  } else {
    const hasFreeCell = grid.some(row => row.some(cell => cell.user === null));
    if (!hasFreeCell) {
      const scores = await db.player_score.findMany({ where: { game_id: gameId } });
      if (scores.length === 2) {
        const [p1, p2] = scores;
        let winnerId = null;
        if (p1.score > p2.score) winnerId = p1.user_id;
        else if (p2.score > p1.score) winnerId = p2.user_id;

        await db.game.update({
          where: { id: gameId },
          data: { status: 'FINISHED' },
        });

        if (winnerId) {
          await db.player_score.updateMany({
            where: { game_id: gameId },
            data: { winner: false },
          });
          await db.player_score.update({
            where: { game_id_user_id: { game_id: gameId, user_id: winnerId } },
            data: { winner: true },
          });
        }
      }

      client.send(JSON.stringify({
        type: MessageTypes.GAME_WIN,
        message: 'Vous avez gagné !',
      }));

      if (opponentClient) {
        opponentClient.client.send(JSON.stringify({
          type: MessageTypes.GAME_LOSE,
          message: 'Vous avez perdu.',
        }));
        await updateMMR(userId, gameId, true, isRanked);
        await updateMMR(opponentClient.userId, gameId, false, isRanked);
      }
    }
  }

  return alignments;
}

async function updateMMR(userId, gameId, isWinner, isRanked) {
  const mmrChange = isWinner ? 9 : -9;
  if (isRanked) {
    return db.users.update({
      where: { id: userId },
      data: {
        mmr: {
          increment: mmrChange,
        },
      },
    });
  } else {
    return db.users.update({
      where: { id: userId },
      data: {
        hide_mmr: {
          increment: mmrChange,
        },
      },
    });
  }
}

