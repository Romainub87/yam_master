import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../connection.js';

const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const existingUser = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = await db.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
            [username, hashedPassword]
        );

        const token = jwt.sign({ user: newUser.rows[0] }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({token});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Connexion
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.query('SELECT * FROM users WHERE username = $1', [username]);

        if (user.rows.length === 0 || !(await bcrypt.compare(password, user.rows[0].password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ user: user.rows[0] }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/refresh-token', (req, res) => {
    const { refreshToken } = req.body;

    // Vérifiez la validité du refresh token
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Refresh token invalide ou expiré' });
        }

        // Générez un nouveau JWT
        const newToken = jwt.sign(
            { userId: decoded.userId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token: newToken });
    });
});

export default router;