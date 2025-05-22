import express from 'express';
import cors from 'cors';
import queueRoutes from './routes/queue.js';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';

const app = express();

app.use(cors());
app.use(express.json());

// Ces routes ne doivent PAS contenir /api si tu utilises rewrite dans Nginx
app.use('/queue', queueRoutes);   // accessible via /api/queue
app.use('/auth', authRoutes);     // accessible via /api/auth
app.use('/game', gameRoutes);     // accessible via /api/game

app.get('/', (req, res) => {
  res.send('Serveur WebSocket avec file d’attente');
});

export default app;
