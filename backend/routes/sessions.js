import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// GET /api/sessions — All login sessions (HOD admin view)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM login_sessions ORDER BY login_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/active — Only currently active sessions
router.get('/active', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM login_sessions WHERE is_active = 1 ORDER BY login_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
