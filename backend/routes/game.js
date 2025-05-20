import express from 'express';
import db from '../connection.js';

const router = express.Router();

router.get('/history/:userId', async (req, res) => {
    const { userId } = req.params;

    const player_scores = await db.player_score.findMany({
        where: {
            user_id: parseInt(userId),
        }
    });

    const opponentScores = await db.player_score.findMany({
        where: {
            game_id: {
                in: player_scores.map((player_score) => player_score.game_id)
            },
            user_id: {
                not: parseInt(userId)
            }
        },
        select: {
            user_id: true
        }
    });

    const opponents = opponentScores.length > 0
        ? await db.users.findMany({
            where: {
                id: {
                    in: opponentScores.map(os => os.user_id)
                }
            },
            select: {
                id: true,
                username: true
            }
        })
        : [];

    const games = await db.game.findMany({
        where: {
            id: {
                in: player_scores.map((player_score) => player_score.game_id)
            }
        },
        orderBy: {
            created_at: 'desc',
        },
        take: 10,
        select: {
            id: true,
            created_at: true,
            status: true,
        }
    });

    const gamesWithOpponentName = games.map(game => {
        const opponentScore = opponentScores.find(os => os.user_id !== parseInt(userId));
        const opponent = opponents.find(o => o.id === opponentScore?.user_id);
        return {
            ...game,
            isWinner: player_scores.some(ps => ps.game_id === game.id && ps.winner === true),
            opponentName: opponent ? opponent.username : null,
        };
    });

    res.json(gamesWithOpponentName);
});

export default router;