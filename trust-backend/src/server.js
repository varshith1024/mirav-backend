// src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import  pool  from './db/index.js';
import { authenticate } from './middleware/auth.middleware.js';

dotenv.config();
const app = express();

app.use(cors({ origin: "https://mirav-nu.vercel.app/", credentials: true }));
app.use(express.json());

// health + DB test
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connected successfully', time: result.rows[0].now });
  } catch (err) {
    console.error('DB test error', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// mount auth routes
app.use('/api/auth', authRoutes);

// protected example route
app.get('/api/protected', authenticate, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
