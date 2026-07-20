import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// GET /api/timetable
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM timetable ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) return res.json({ status: 'draft', tables: null });
    const row = rows[0];
    res.json({
      status: row.status,
      tables: row.tables_json ? JSON.parse(row.tables_json) : null,
      updatedAt: row.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/timetable — save draft or publish
router.put('/', async (req, res) => {
  const { tables, status } = req.body;
  try {
    const tablesJson = tables ? JSON.stringify(tables) : null;
    const [existing] = await pool.query('SELECT id FROM timetable LIMIT 1');
    if (existing.length > 0) {
      await pool.query('UPDATE timetable SET tables_json=?, status=? WHERE id=?', [tablesJson, status || 'draft', existing[0].id]);
    } else {
      await pool.query('INSERT INTO timetable (tables_json, status) VALUES (?, ?)', [tablesJson, status || 'draft']);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/timetable/publish
router.post('/publish', async (req, res) => {
  const { tables } = req.body;
  try {
    const tablesJson = tables ? JSON.stringify(tables) : null;
    const [existing] = await pool.query('SELECT id FROM timetable LIMIT 1');
    if (existing.length > 0) {
      await pool.query('UPDATE timetable SET tables_json=?, status="published" WHERE id=?', [tablesJson, existing[0].id]);
    }

    // Add notification
    const notifId = `N${Date.now()}`;
    await pool.query(
      'INSERT INTO notifications (id, title, message, recipient_id) VALUES (?, ?, ?, ?)',
      [notifId, 'New Timetable Published', 'HOD has published a new academic timetable.', 'all']
    );

    // Add email logs for all staff
    const [staffRows] = await pool.query('SELECT id, name, email FROM staff');
    
    // Log a main broadcast email summary row for stats tracking
    const broadcastLogId = `LOG_${Date.now()}_broadcast`;
    await pool.query(
      'INSERT INTO email_logs (id, recipient_email, recipient_name, subject, body, is_broadcast, recipient_count, status, sender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [broadcastLogId, 'all@college.edu', 'All Staff', 'ALERT: New Academic Timetable Published',
        'Timetable published. Please log in to view your teaching slots.', 1, staffRows.length, 'success', 'HOD Admin']
    );

    for (const staff of staffRows) {
      const logId = `LOG_${Date.now()}_${staff.id}`;
      await pool.query(
        'INSERT INTO email_logs (id, recipient_email, recipient_name, subject, body, is_broadcast, recipient_count, status, sender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [logId, staff.email, staff.name, 'ALERT: New Academic Timetable Published',
          `Dear Prof. ${staff.name},\n\nThe timetable has been published by the HOD. Please log in to view your teaching slots.\n\nBest regards,\nChronoAI System`,
          0, 1, 'success', 'HOD Admin']
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
