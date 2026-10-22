import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import userRoutes from './routes/users.js';
import { uploadsDir } from './uploadsDir.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: process.env.DB_NAME || 'tiktok' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

export default app;

// Local / non-Vercel only — Vercel imports the app export
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    try {
      await pool.query('SELECT 1');
      console.log(`API running on http://localhost:${PORT}`);
      console.log(`Connected to PostgreSQL database: ${process.env.DB_NAME || 'tiktok'}`);
    } catch (err) {
      console.error('Failed to connect to PostgreSQL:', err.message);
    }
  });
}
