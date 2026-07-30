import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// GET /api/electives — Get all electives with courses, sections, groups, and slots
router.get('/', async (req, res) => {
  try {
    const [electives] = await pool.query('SELECT * FROM electives ORDER BY created_at DESC');
    const [elecSecRows] = await pool.query('SELECT * FROM elective_sections');
    const [courses] = await pool.query('SELECT * FROM elective_courses');
    const [groups] = await pool.query('SELECT * FROM elective_groups');
    const [slots] = await pool.query('SELECT * FROM elective_slots');
    const [studentElectives] = await pool.query('SELECT * FROM student_electives');
    const [staff] = await pool.query('SELECT id, name FROM staff');
    const [subjects] = await pool.query('SELECT id, name FROM subjects');

    const staffMap = {};
    staff.forEach(s => { staffMap[s.id] = s.name; });

    const subjectMap = {};
    subjects.forEach(s => { subjectMap[s.id] = s.name; });

    const result = electives.map(e => {
      const matchedSecs = elecSecRows.filter(es => es.elective_id === e.id).map(es => es.section);
      const defaultSecs = e.academic_year === 'Second Year' || e.semester === 3 ? ['2-A', '2-B'] : e.academic_year === 'Third Year' || e.semester === 5 ? ['3-A', '3-B'] : [e.class || '3-A'];
      const targetSections = matchedSecs.length > 0 ? matchedSecs : defaultSecs;

      const eCourses = courses
        .filter(c => c.elective_id === e.id)
        .map(c => {
          const cGroups = groups.filter(g => g.elective_course_id === c.id);
          const students = studentElectives.filter(se => se.elective_course_id === c.id);
          return {
            ...c,
            faculty_name: staffMap[c.faculty_id] || 'Not Assigned',
            subject_name: c.subject_name || subjectMap[c.subject_id] || c.subject_id,
            groups: cGroups,
            students: students
          };
        });

      const eSlots = slots.filter(s => s.semester === e.semester && (targetSections.includes(s.class) || s.class === e.class));

      return {
        ...e,
        sections: targetSections,
        enabled: Boolean(e.enabled),
        courses: eCourses,
        slots: eSlots
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/electives — Create elective
router.post('/', async (req, res) => {
  try {
    const { id, name, department, semester, class: className, academic_year, enabled, sections } = req.body;
    const electiveId = id || `ELEC_${Date.now()}`;
    const dept = department || 'Computer Science';
    const sem = parseInt(semester) || 5;
    const cls = className || '3-A';
    const year = academic_year || 'Third Year';
    const isEnabled = enabled !== undefined ? (enabled ? 1 : 0) : 1;

    await pool.query(
      'INSERT INTO electives (id, name, department, semester, class, academic_year, enabled) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [electiveId, name, dept, sem, cls, year, isEnabled]
    );

    const targetSections = Array.isArray(sections) && sections.length > 0 ? sections : (sem === 3 ? ['2-A', '2-B'] : sem === 5 ? ['3-A', '3-B'] : [cls]);
    for (const sec of targetSections) {
      await pool.query('INSERT OR IGNORE INTO elective_sections (elective_id, section) VALUES (?, ?)', [electiveId, sec]);
    }

    res.json({ success: true, id: electiveId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/electives/:id — Edit elective
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, semester, class: className, academic_year, enabled, sections } = req.body;

    await pool.query(
      'UPDATE electives SET name=?, department=?, semester=?, class=?, academic_year=?, enabled=? WHERE id=?',
      [name, department, parseInt(semester), className || '3-A', academic_year, enabled ? 1 : 0, id]
    );

    if (Array.isArray(sections)) {
      await pool.query('DELETE FROM elective_sections WHERE elective_id = ?', [id]);
      for (const sec of sections) {
        await pool.query('INSERT OR IGNORE INTO elective_sections (elective_id, section) VALUES (?, ?)', [id, sec]);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/electives/:id — Delete elective
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM electives WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/electives/:id/toggle — Enable/Disable elective
router.post('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    await pool.query('UPDATE electives SET enabled=? WHERE id=?', [enabled ? 1 : 0, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/electives/:id/courses — Add course to elective
router.post('/:id/courses', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_id, subject_name, faculty_id, weekly_hours, capacity, student_count } = req.body;

    const [info] = await pool.query(
      'INSERT INTO elective_courses (elective_id, subject_id, subject_name, faculty_id, weekly_hours, capacity, student_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, subject_id, subject_name || subject_id, faculty_id || null, parseInt(weekly_hours) || 4, parseInt(capacity) || 35, parseInt(student_count) || 0]
    );

    res.json({ success: true, id: info.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/electives/courses/:courseId — Update course
router.put('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { subject_id, subject_name, faculty_id, weekly_hours, capacity, student_count } = req.body;

    await pool.query(
      'UPDATE elective_courses SET subject_id=?, subject_name=?, faculty_id=?, weekly_hours=?, capacity=?, student_count=? WHERE id=?',
      [subject_id, subject_name || subject_id, faculty_id || null, parseInt(weekly_hours) || 4, parseInt(capacity) || 35, parseInt(student_count) || 0, courseId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/electives/courses/:courseId — Remove course
router.delete('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    await pool.query('DELETE FROM elective_courses WHERE id=?', [courseId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/electives/:id/distribute — Student distribution
router.post('/:id/distribute', async (req, res) => {
  try {
    const { id } = req.params;
    const { mode, distributions, totalStudents } = req.body;
    // distributions: [{ courseId, studentCount, studentIds: [...] }, ...]

    const [courses] = await pool.query('SELECT * FROM elective_courses WHERE elective_id=?', [id]);

    if (mode === 'auto') {
      const total = parseInt(totalStudents) || 60;
      const countPerCourse = Math.floor(total / (courses.length || 1));
      const remainder = total % (courses.length || 1);

      let currentRoll = 1;
      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const assignedCount = countPerCourse + (i < remainder ? 1 : 0);

        await pool.query('UPDATE elective_courses SET student_count=? WHERE id=?', [assignedCount, course.id]);

        // Remove old student assignments for this course
        await pool.query('DELETE FROM student_electives WHERE elective_course_id=?', [course.id]);

        // Create student records
        for (let j = 0; j < assignedCount; j++) {
          const studentId = `CS${26000 + currentRoll}`;
          const studentName = `Student ${currentRoll}`;
          currentRoll++;
          await pool.query(
            'INSERT INTO student_electives (student_id, student_name, elective_course_id) VALUES (?, ?, ?)',
            [studentId, studentName, course.id]
          );
        }
      }
    } else if (mode === 'manual' && Array.isArray(distributions)) {
      for (const dist of distributions) {
        const courseId = dist.courseId;
        const studentCount = dist.studentCount || (dist.studentIds ? dist.studentIds.length : 0);

        await pool.query('UPDATE elective_courses SET student_count=? WHERE id=?', [studentCount, courseId]);

        if (dist.studentIds && Array.isArray(dist.studentIds)) {
          await pool.query('DELETE FROM student_electives WHERE elective_course_id=?', [courseId]);
          for (const sId of dist.studentIds) {
            await pool.query(
              'INSERT INTO student_electives (student_id, student_name, elective_course_id) VALUES (?, ?, ?)',
              [sId, `Student ${sId}`, courseId]
            );
          }
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/electives/slots — Get elective slots
router.get('/slots', async (req, res) => {
  try {
    const [slots] = await pool.query('SELECT * FROM elective_slots ORDER BY semester, class, day, period');
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/electives/slots — Configure/save elective slots for semester across participating sections
router.post('/slots', async (req, res) => {
  try {
    const { semester, class: className, sections, slots } = req.body;
    const sem = parseInt(semester) || 5;
    const cls = className || '3-A';
    const targetSections = Array.isArray(sections) && sections.length > 0 ? sections : (sem === 3 ? ['2-A', '2-B'] : sem === 5 ? ['3-A', '3-B'] : [cls]);

    for (const targetSec of targetSections) {
      await pool.query('DELETE FROM elective_slots WHERE semester=? AND class=?', [sem, targetSec]);
      if (Array.isArray(slots)) {
        for (const s of slots) {
          await pool.query(
            'INSERT INTO elective_slots (semester, class, day, period, locked) VALUES (?, ?, ?, ?, 1)',
            [sem, targetSec, parseInt(s.day), parseInt(s.period)]
          );
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/electives/reports — Summary & Allocation Reports
router.get('/reports', async (req, res) => {
  try {
    const [electives] = await pool.query('SELECT * FROM electives');
    const [courses] = await pool.query('SELECT * FROM elective_courses');
    const [students] = await pool.query('SELECT * FROM student_electives');
    const [slots] = await pool.query('SELECT * FROM elective_slots');
    const [staff] = await pool.query('SELECT id, name FROM staff');

    const staffMap = {};
    staff.forEach(s => { staffMap[s.id] = s.name; });

    const summaryReport = electives.map(e => {
      const eCourses = courses.filter(c => c.elective_id === e.id);
      const totalStudents = eCourses.reduce((sum, c) => sum + (c.student_count || 0), 0);
      const totalCapacity = eCourses.reduce((sum, c) => sum + (c.capacity || 0), 0);
      const configuredSlots = slots.filter(s => s.semester === e.semester && s.class === e.class).length;

      return {
        id: e.id,
        name: e.name,
        department: e.department,
        semester: e.semester,
        class: e.class,
        enabled: Boolean(e.enabled),
        coursesCount: eCourses.length,
        totalStudents,
        totalCapacity,
        configuredSlots,
        weeklyHoursNeeded: eCourses[0]?.weekly_hours || 4
      };
    });

    const allocationReport = courses.map(c => {
      const elective = electives.find(e => e.id === c.elective_id);
      const enrolledStudents = students.filter(s => s.elective_course_id === c.id);
      return {
        courseId: c.id,
        electiveId: c.elective_id,
        electiveName: elective?.name || c.elective_id,
        class: elective?.class || '-',
        subjectId: c.subject_id,
        subjectName: c.subject_name,
        facultyId: c.faculty_id,
        facultyName: staffMap[c.faculty_id] || 'Not Assigned',
        weeklyHours: c.weekly_hours,
        capacity: c.capacity,
        studentCount: c.student_count,
        enrolledCount: enrolledStudents.length
      };
    });

    res.json({
      summaryReport,
      allocationReport,
      studentList: students
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
