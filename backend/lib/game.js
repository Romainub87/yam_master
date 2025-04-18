import {addGameClient} from '../websocket.js';
import db from '../connection.js';
import {MessageTypes} from '../types/message.js';
import jwt from 'jsonwebtoken';

export async function createGame(p1, p2) {
  const game = await db.$transaction(async (prisma) => {

    const newGame = await prisma.game.create({
      data: {
        grid_state: createGridFor2Players(),
        dice_state: Array(5).fill({ value: null, locked: false }),
        timer: 20,
        status: 'IN_PROGRESS',
      },
    });

    const gameId = newGame.id;

    const opponentId = jwt.verify(p1.token, process.env.JWT_SECRET).user.id;
    const clientId = jwt.verify(p2.token, process.env.JWT_SECRET).user.id;

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

  if (diceRolls.every(dice => dice.value !== null) && diceRolls.reduce((sum, dice) => sum + dice.value, 0) <= 8 && isCombinationPlaceable('LESS8')) {
    validCombination.push('LESS8');
  }
  if (Object.values(counts).some(count => count === 3)) {
    validCombination.push('BRELAN');
  }
  if (Object.values(counts).some(count => count === 4) && isCombinationPlaceable('CARRE')) {
    validCombination.push('CARRE');
  }
  if (Object.values(counts).includes(3) && Object.values(counts).includes(2) && isCombinationPlaceable('FULL')) {
    validCombination.push('FULL');
  }
  if (Object.values(counts).some(count => count === 5)) {
    validCombination.push('YAM'); // Pas de vérification pour YAM
  }
  if (([1, 2, 3, 4, 5].every(num => counts[num]) || [2, 3, 4, 5, 6].every(num => counts[num])) && isCombinationPlaceable('SUITE')) {
    validCombination.push('SUITE');
  }

  const majorityValue = validCombination.length > 0
      ? Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b))
      : null;

  [1, 2, 3, 4, 5, 6].forEach(value => {
    if (parseInt(majorityValue) === value && isCombinationPlaceable(`WITH${value}`)) {
      validCombination.push(`WITH${value}`);
    }
  });

  if (playerScore.rolls_left === 2 && validCombination.length > 0 && isCombinationPlaceable('SEC')) {
    validCombination.push('SEC');
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

export async function checkAlignmentsAndUpdateScores(gameId, userId) {
  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) {
    throw new Error('Partie introuvable');
  }

  const grid = game.grid_state;
  const alignments = checkAlignments(grid, userId);

  if (alignments > 0) {
    await db.player_score.update({
      where: { game_id_user_id: { game_id: gameId, user_id: userId } },
      data: { score: alignments },
    });
  }
}

function checkAlignments(grid, userId) {
  let alignments = 0;
  // Vérification des lignes
  grid.forEach(row => {
    let consecutive = 0;
    for (let i = 0; i < row.length; i++) {
      if (row[i].user === userId) {
        consecutive++;
        if (consecutive === row.length) {
          alignments++; // Priorité maximale : alignement complet
        } else if (consecutive === 4) {
          alignments += 3; // +3 points pour un alignement de 4
        } else if (consecutive === 3) {
          alignments += 1; // +1 point pour un alignement de 3
        }
      } else {
        consecutive = 0; // Réinitialiser si la case n'appartient pas à l'utilisateur
      }
    }
  });

// Vérification des colonnes
  for (let col = 0; col < grid[0].length; col++) {
    let consecutive = 0;
    for (let row = 0; row < grid.length; row++) {
      if (grid[row][col].user === userId) {
        consecutive++;
        if (consecutive === grid.length) {
          alignments++; // Priorité maximale : alignement complet
        } else if (consecutive === 4) {
          alignments += 3; // +3 points pour un alignement de 4
        } else if (consecutive === 3) {
          alignments += 1; // +1 point pour un alignement de 3
        }
      } else {
        consecutive = 0; // Réinitialiser si la case n'appartient pas à l'utilisateur
      }
    }
  }

// Vérification des diagonales
  let mainDiagonal = 0;
  let antiDiagonal = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i][i].user === userId) {
      mainDiagonal++;
    } else {
      mainDiagonal = 0; // Réinitialiser si la case n'appartient pas à l'utilisateur
    }
    if (grid[i][grid.length - 1 - i].user === userId) {
      antiDiagonal++;
    } else {
      antiDiagonal = 0; // Réinitialiser si la case n'appartient pas à l'utilisateur
    }
  }

  if (mainDiagonal === grid.length || antiDiagonal === grid.length) {
    alignments++; // Priorité maximale : alignement complet
  } else if (mainDiagonal === 4 || antiDiagonal === 4) {
    alignments += 3; // +3 points pour un alignement de 4
  } else if (mainDiagonal === 3 || antiDiagonal === 3) {
    alignments += 1; // +1 point pour un alignement de 3
  }

  return alignments;
}