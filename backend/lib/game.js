import {addGameClient, getGameClients, getWaitingClients} from '../websocket.js';
import db from '../connection.js';
import { MessageTypes } from '../types/message.js';
import jwt from 'jsonwebtoken';

export async function createGame(p1, p2) {
  const game = await db.$transaction(async (prisma) => {

    const newGame = await prisma.game.create({
      data: { grid_state: {}, dice_state: Array(5).fill({ value: null, locked: false }), timer: 30 },
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