import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// GET /api/lab-rooms — fetch all laboratory rooms
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM lab_rooms WHERE enabled = 1 ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lab-rooms — create or update laboratory room
router.post('/', async (req, res) => {
  const { id, name, department, capacity, enabled } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'Room ID and Name are required.' });
  try {
    await pool.query(
      'INSERT INTO lab_rooms (id, name, department, capacity, enabled) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, department=excluded.department, capacity=excluded.capacity, enabled=excluded.enabled',
      [id, name, department || 'Computer Science', capacity || 30, enabled !== undefined ? enabled : 1]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
