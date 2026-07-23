import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// GET /api/lab-slots
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ls.*, s.name as subject_name, st.name as staff_name
      FROM lab_slots ls
      LEFT JOIN subjects s ON ls.subject_id = s.id
      LEFT JOIN staff st ON ls.staff_id = st.id
      ORDER BY ls.section, ls.day_order, ls.period
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lab-slots — set a lab slot with strict validation
router.post('/', async (req, res) => {
  const { section, dayOrder, period, subjectId, staffId } = req.body;
  if (!section || !dayOrder || !period) return res.status(400).json({ error: 'section, dayOrder, period required.' });
  try {
    if (subjectId) {
      // 1. Faculty Availability Validation
      if (staffId) {
        const [facConflicts] = await pool.query(
          'SELECT section FROM lab_slots WHERE staff_id = ? AND day_order = ? AND period = ? AND section != ?',
          [staffId, dayOrder, period, section]
        );
        if (facConflicts.length > 0) {
          return res.status(400).json({ error: `Faculty Conflict: That teacher is already assigned to Section ${facConflicts[0].section} at Day ${dayOrder}, Period ${period}.` });
        }
      }

      // 2. Laboratory Availability Validation (based on subject_id representing a unique laboratory session)
      const [subjectRows] = await pool.query('SELECT type FROM subjects WHERE id = ?', [subjectId]);
      const isPractical = subjectRows.length > 0 && subjectRows[0].type === 'practical';

      if (isPractical) {
        const [labConflicts] = await pool.query(
          'SELECT section FROM lab_slots WHERE subject_id = ? AND day_order = ? AND period = ? AND section != ?',
          [subjectId, dayOrder, period, section]
        );
        if (labConflicts.length > 0) {
          return res.status(400).json({ error: `Laboratory Conflict: The lab room for this course is already occupied by Section ${labConflicts[0].section} at Day ${dayOrder}, Period ${period}.` });
        }
      }
    }

    await pool.query(
      'INSERT INTO lab_slots (section, day_order, period, subject_id, staff_id) VALUES (?, ?, ?, ?, ?) ON CONFLICT(section, day_order, period) DO UPDATE SET subject_id=excluded.subject_id, staff_id=excluded.staff_id',
      [section, dayOrder, period, subjectId || null, staffId || null]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/lab-slots — remove a lab slot
router.delete('/', async (req, res) => {
  const { section, dayOrder, period } = req.body;
  try {
    await pool.query(
      'DELETE FROM lab_slots WHERE section=? AND day_order=? AND period=?',
      [section, dayOrder, period]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
