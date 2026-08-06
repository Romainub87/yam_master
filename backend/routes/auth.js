import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../connection.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await db.users.findUnique({
      where: { username },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Le pseudo existe déjà' });
    }

    const newUser = await db.users.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ user: newUser }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    const refreshToken = jwt.sign(
      { user: newUser },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: '7d',
      }
    );

    res.status(201).json({ token, refreshToken });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.users.findUnique({
      where: { username },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Le pseudo ou le mot de passe sont incorrects' });
    }

    const token = jwt.sign({ user }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    const refreshToken = jwt.sign({ user }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });
    res.json({ token, refreshToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ message: 'Refresh token invalide ou expiré' });
    }

    const newToken = jwt.sign({ user: decoded.user }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token: newToken });
  });
});

export default router;
