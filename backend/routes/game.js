import express from 'express';
import db from '../connection.js';

const router = express.Router();

router.get('/history/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    const playerScores = await db.player_score.findMany({
        where: { user_id: userId }
    });

    const gameIds = playerScores.map(ps => ps.game_id);

    const opponentScores = await db.player_score.findMany({
        where: {
            game_id: { in: gameIds },
            user_id: { not: userId }
        },
        select: { user_id: true, game_id: true }
    });

    const opponentIds = opponentScores.map(os => os.user_id);

    const opponents = opponentIds.length
        ? await db.users.findMany({
            where: { id: { in: opponentIds } },
            select: { id: true, username: true }
        })
        : [];

    const games = await db.game.findMany({
        where: { id: { in: gameIds } },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: { id: true, created_at: true, status: true }
    });

    const gamesWithOpponentName = games.map(game => {
        const opponentScore = opponentScores.find(os => os.game_id === game.id && os.user_id !== userId);
        const opponent = opponents.find(o => o.id === opponentScore?.user_id);
        let opponentName = null;
        if (opponent?.id === -1) {
            opponentName = 'Bot facile';
        } else {
            opponentName = opponent ? opponent.username : null;
        }
        return {
            ...game,
            isWinner: playerScores.some(ps => ps.game_id === game.id && ps.winner === true),
            opponentName,
        };
    });

    res.json(gamesWithOpponentName);
});

export default router;