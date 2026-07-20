import express from 'express';
import pool from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/email-logs
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM email_logs ORDER BY sent_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email-logs — Send a custom email (supports individual and broadcast)
router.post('/', async (req, res) => {
  const { staffId, subject, body } = req.body;
  if (!staffId || !subject || !body) return res.status(400).json({ error: 'All fields required.' });
  try {
    if (staffId === 'all') {
      const [staffRows] = await pool.query('SELECT * FROM staff');
      if (staffRows.length === 0) return res.status(400).json({ error: 'No staff members registered.' });
      
      const logId = uuidv4();
      // Log broadcast summary row
      await pool.query(
        'INSERT INTO email_logs (id, recipient_email, recipient_name, subject, body, is_broadcast, recipient_count, status, sender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [logId, 'all@college.edu', 'All Staff', subject, body, 1, staffRows.length, 'success', 'HOD Admin']
      );

      // Create a global notification for everyone
      const notifId = `N${Date.now()}`;
      await pool.query(
        'INSERT INTO notifications (id, title, message, recipient_id) VALUES (?, ?, ?, ?)',
        [notifId, subject, body, 'all']
      );

      res.json({ success: true, logId, recipientCount: staffRows.length });
    } else {
      const [staffRows] = await pool.query('SELECT * FROM staff WHERE id=?', [staffId]);
      if (staffRows.length === 0) return res.status(404).json({ error: 'Staff not found.' });
      const staff = staffRows[0];
      const logId = uuidv4();
      
      await pool.query(
        'INSERT INTO email_logs (id, recipient_email, recipient_name, subject, body, is_broadcast, recipient_count, status, sender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [logId, staff.email, staff.name, subject, body, 0, 1, 'success', 'HOD Admin']
      );

      // Create a specific notification for this staff member
      const notifId = `N${Date.now()}`;
      await pool.query(
        'INSERT INTO notifications (id, title, message, recipient_id) VALUES (?, ?, ?, ?)',
        [notifId, subject, body, staff.id]
      );

      res.json({ success: true, logId });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/email-logs — Clear all logs
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM email_logs');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications
router.get('/notifications', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
