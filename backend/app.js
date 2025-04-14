import express from 'express';
import cors from 'cors';
import queueRoutes from './routes/queue.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/queue', queueRoutes);

app.get('/', (req, res) => {
  res.send('Serveur WebSocket avec file d’attente');
});

export default app;
