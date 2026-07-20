import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// GET /api/subjects
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subjects ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subjects
router.post('/', async (req, res) => {
  const { id, name, type, periods, year } = req.body;
  if (!id || !name || !periods) return res.status(400).json({ error: 'All fields required.' });
  try {
    await pool.query('INSERT INTO subjects (id, name, type, periods, year) VALUES (?, ?, ?, ?, ?)', [id, name, type || 'theory', parseInt(periods), year || 'First Year']);
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Subject Code already exists.' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/subjects/:id
router.put('/:id', async (req, res) => {
  const { name, type, periods, year } = req.body;
  if (!name || !periods) return res.status(400).json({ error: 'Name and periods are required.' });
  try {
    await pool.query(
      'UPDATE subjects SET name=?, type=?, periods=?, year=? WHERE id=?',
      [name, type || 'theory', parseInt(periods), year || 'First Year', req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/subjects/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM subjects WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subjects/assignments
router.get('/assignments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM course_assignments');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subjects/assignments
router.post('/assignments', async (req, res) => {
  const { section, subjectId, staffId } = req.body;
  try {
    if (!staffId) {
      await pool.query('DELETE FROM course_assignments WHERE section=? AND subject_id=?', [section, subjectId]);
    } else {
      await pool.query(
        'INSERT INTO course_assignments (section, subject_id, staff_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE staff_id=?',
        [section, subjectId, staffId, staffId]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subjects/assignments/batch — save all assignments at once
router.post('/assignments/batch', async (req, res) => {
  const { assignments } = req.body;
  try {
    await pool.query('DELETE FROM course_assignments');
    if (assignments && assignments.length > 0) {
      const values = assignments.map(a => [a.section, a.subjectId, a.staffId]);
      await pool.query('INSERT INTO course_assignments (section, subject_id, staff_id) VALUES ?', [values]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
