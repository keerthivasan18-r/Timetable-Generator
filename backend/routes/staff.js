import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// GET /api/staff
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM staff ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/staff
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required.' });
  if (!/[A-Z]/.test(password)) return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' });

  try {
    // Auto-generate staff ID
    const [rows] = await pool.query('SELECT id FROM staff ORDER BY id DESC LIMIT 1');
    let nextNum = 1;
    if (rows.length > 0) {
      nextNum = parseInt(rows[0].id.replace('STF', ''), 10) + 1;
    }
    const newId = `STF${String(nextNum).padStart(3, '0')}`;
    await pool.query('INSERT INTO staff (id, name, email, password) VALUES (?, ?, ?, ?)', [newId, name, email, password]);
    res.json({ success: true, id: newId, name, email });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/staff/:id
router.put('/:id', async (req, res) => {
  const { name, email, password } = req.body;
  if (password && !/[A-Z]/.test(password)) return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' });

  try {
    await pool.query('UPDATE staff SET name=?, email=?, password=? WHERE id=?', [name, email, password, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM staff WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
