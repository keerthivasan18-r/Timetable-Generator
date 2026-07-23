import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    for (const row of rows) {
      try {
        settings[row.setting_key] = JSON.parse(row.setting_value);
      } catch {
        settings[row.setting_key] = row.setting_value;
      }
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  const { key, value } = req.body;
  try {
    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await pool.query(
      'INSERT OR REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)',
      [key, strValue]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
