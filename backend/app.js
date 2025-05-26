import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';
import playerRoutes from './routes/player.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/game', gameRoutes);
app.use('/player', playerRoutes);

app.get('/', (req, res) => {
  res.send('Serveur WebSocket avec file d’attente');
});

export default app;
