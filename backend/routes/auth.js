import express from 'express';
import pool from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { role, idOrEmail, password } = req.body;

  try {
    if (role === 'hod') {
      if (idOrEmail?.toLowerCase() === 'hod@college.edu' && password === 'Admin123') {
        const sessionId = uuidv4();
        await pool.query(
          'INSERT INTO login_sessions (id, user_role, user_id, user_name, user_email, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          [sessionId, 'hod', 'HOD', 'HOD Admin', 'hod@college.edu']
        );
        const user = { role: 'hod', name: 'HOD Admin', email: 'hod@college.edu', sessionId };
        return res.json({ success: true, user });
      }
      return res.json({ success: false, error: 'Invalid HOD credentials.' });
    }

    if (role === 'staff') {
      const [rows] = await pool.query(
        'SELECT * FROM staff WHERE (id = ? OR email = ?) AND password = ?',
        [idOrEmail, idOrEmail, password]
      );
      if (rows.length > 0) {
        const staff = rows[0];
        const sessionId = uuidv4();
        await pool.query(
          'INSERT INTO login_sessions (id, user_role, user_id, user_name, user_email, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          [sessionId, 'staff', staff.id, staff.name, staff.email]
        );
        const user = { role: 'staff', name: staff.name, id: staff.id, email: staff.email, sessionId };
        return res.json({ success: true, user });
      }
      return res.json({ success: false, error: 'Invalid Staff ID / Email or Password.' });
    }

    return res.json({ success: false, error: 'Invalid role.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const { sessionId } = req.body;
  try {
    if (sessionId) {
      await pool.query(
        'UPDATE login_sessions SET is_active = 0, logout_at = NOW() WHERE id = ?',
        [sessionId]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error during logout.' });
  }
});

export default router;
