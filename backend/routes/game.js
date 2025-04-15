import express from 'express';
import jwt from 'jsonwebtoken';
const router = express.Router();

const rollDice = (count) => {
    return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
};

router.get('/roll-dice', (req, res) => {
    const { count } = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Token d'authentification manquant ou invalide !" });
    }

    const token = authHeader.split(' ')[1];

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ error: "Token invalide ou expiré." });
    }
    const user = decodedToken.user;

    if (!user) {
        return res.status(401).json({ error: "Token not found." });
    }

    if (!count || isNaN(count)) {
        return res.status(400).json({ error: 'Le paramètre "count" est requis et doit être un nombre.' });
    }

    const diceRolls = rollDice(parseInt(count, 10));
    res.json({ dice: diceRolls });
});

export default router;