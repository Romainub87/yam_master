import express from 'express';
const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ message: 'Route queue disponible' });
});

export default router;
