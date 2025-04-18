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

export function calculateValidCombinations(diceRolls) {
  const counts = diceRolls.reduce((acc, dice) => {
    if (dice.value === null) return acc;
    acc[dice.value] = (acc[dice.value] || 0) + 1;
    return acc;
  }, {});

  const validCombination = [];

  if (Object.values(counts).some(count => count === 3)) validCombination.push('BRELAN');
  if (Object.values(counts).some(count => count === 4)) validCombination.push('CARRE');
  if (Object.values(counts).includes(3) && Object.values(counts).includes(2)) validCombination.push('FULL');
  if (Object.values(counts).some(count => count === 5)) validCombination.push('YAM');
  if ([1, 2, 3, 4, 5].every(num => counts[num]) || [2, 3, 4, 5, 6].every(num => counts[num])) validCombination.push('SUITE');

  const majorityValue = validCombination.length > 0
      ? Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b))
      : null;

  [1, 2, 3, 4, 5, 6].forEach(value => {
    if (parseInt(majorityValue) === value) {
      validCombination.push(`WITH${value}`);
    }
  });

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