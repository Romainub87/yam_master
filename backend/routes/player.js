import express from 'express';
import db from '../connection.js';

const router = express.Router();

router.get('/leaderboard', (req, res) => {
    const players = db.users.findMany(
        {
            where: {id: {not: -1}},
            select: {
                username: true,
                mmr: true,
            },
            orderBy: {mmr: 'desc'}
        }
    );

    players.then((data) => {
        res.json(data);
    }).catch((error) => {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    });
});

export default router;