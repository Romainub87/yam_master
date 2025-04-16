import { addGameClient } from '../websocket.js';
import db from '../connection.js';
import { MessageTypes } from '../types/message.js';
import jwt from 'jsonwebtoken';

export async function createGame(p1, p2) {
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
    const opponentToken = p1.token;
    const opponentDecodedToken = jwt.verify(
      opponentToken,
      process.env.JWT_SECRET
    );
    const opponentId = opponentDecodedToken.user.id;

    const clientToken = p2.token;
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
    (player) => player.user_id === p2.user.id
  );
  const opponentScore = playerScores.find(
    (player) => player.user_id !== p1.user.id
  );

  p1.client.send(
    JSON.stringify({
      type: MessageTypes.GAME_START,
      game: game,
      playerScore: opponentScore,
      opponentScore: playerScore,
    })
  );
  p2.client.send(
    JSON.stringify({
      type: MessageTypes.GAME_START,
      game: game,
      playerScore: playerScore,
      opponentScore: opponentScore,
    })
  );

  addGameClient({
    client: p1.client,
    gameId: game.id,
    userId: opponentScore.user_id,
  });
  addGameClient({
    client: p2.client,
    gameId: game.id,
    userId: playerScore.user_id,
  });
}
