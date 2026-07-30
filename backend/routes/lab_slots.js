import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// GET /api/lab-slots
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ls.*, s.name as subject_name, st.name as staff_name, lr.name as lab_room_name
      FROM lab_slots ls
      LEFT JOIN subjects s ON ls.subject_id = s.id
      LEFT JOIN staff st ON ls.staff_id = st.id
      LEFT JOIN lab_rooms lr ON ls.lab_room_id = lr.id
      ORDER BY ls.section, ls.day_order, ls.period
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lab-slots — set a lab slot with strict validation
router.post('/', async (req, res) => {
  let { section, dayOrder, period, subjectId, staffId, labRoomId } = req.body;
  if (!section || !dayOrder || !period) return res.status(400).json({ error: 'section, dayOrder, period required.' });

  // Default lab room based on section if not explicitly supplied
  if (!labRoomId) {
    labRoomId = section.endsWith('B') ? 'L2' : 'L1';
  }

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

      // 2. Laboratory Room Occupancy Validation (based on lab_room_id availability)
      const [labConflicts] = await pool.query(
        'SELECT section FROM lab_slots WHERE lab_room_id = ? AND day_order = ? AND period = ? AND section != ?',
        [labRoomId, dayOrder, period, section]
      );
      if (labConflicts.length > 0) {
        const [roomRows] = await pool.query('SELECT name FROM lab_rooms WHERE id = ?', [labRoomId]);
        const roomName = roomRows.length > 0 ? roomRows[0].name : labRoomId;
        const displayRoom = (labRoomId === 'L1' || roomName === 'Lab A') ? 'Lab A' : (labRoomId === 'L2' || roomName === 'Lab B') ? 'Lab B' : `Lab Room ${labRoomId}`;
        return res.status(400).json({
          error: `Lab Room Conflict: ${displayRoom} is already occupied by Section ${labConflicts[0].section} on Day ${dayOrder} Period ${period}. Please choose another available lab room.`
        });
      }
    }

    await pool.query(
      'INSERT INTO lab_slots (section, day_order, period, subject_id, staff_id, lab_room_id, is_manual, is_locked) VALUES (?, ?, ?, ?, ?, ?, 1, 1) ON CONFLICT(section, day_order, period) DO UPDATE SET subject_id=excluded.subject_id, staff_id=excluded.staff_id, lab_room_id=excluded.lab_room_id, is_manual=1, is_locked=1',
      [section, dayOrder, period, subjectId || null, staffId || null, labRoomId || null]
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
