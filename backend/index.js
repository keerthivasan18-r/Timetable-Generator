import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db/connection.js';

import authRoutes from './routes/auth.js';
import staffRoutes from './routes/staff.js';
import subjectsRoutes from './routes/subjects.js';
import timetableRoutes from './routes/timetable.js';
import settingsRoutes from './routes/settings.js';
import sessionsRoutes from './routes/sessions.js';
import emailLogsRoutes from './routes/email_logs.js';
import labSlotsRoutes from './routes/lab_slots.js';

dotenv.config();

// Run database migrations on server startup to automatically extend tables
async function runMigrations() {
  try {
    // 1. Alter subjects table to add year column
    const [colsSubjects] = await pool.query("PRAGMA table_info(subjects)");
    if (!colsSubjects.some(c => c.name === 'year')) {
      await pool.query("ALTER TABLE subjects ADD COLUMN year TEXT DEFAULT 'First Year'");
      console.log("Migration: Added 'year' column to subjects table.");
    }

    // 2. Alter email_logs table to add broadcast-related columns
    const [colsEmailLogs] = await pool.query("PRAGMA table_info(email_logs)");
    if (!colsEmailLogs.some(c => c.name === 'is_broadcast')) {
      await pool.query("ALTER TABLE email_logs ADD COLUMN is_broadcast INTEGER DEFAULT 0");
    }
    if (!colsEmailLogs.some(c => c.name === 'recipient_count')) {
      await pool.query("ALTER TABLE email_logs ADD COLUMN recipient_count INTEGER DEFAULT 1");
    }
    if (!colsEmailLogs.some(c => c.name === 'status')) {
      await pool.query("ALTER TABLE email_logs ADD COLUMN status TEXT DEFAULT 'success'");
    }
    if (!colsEmailLogs.some(c => c.name === 'sender')) {
      await pool.query("ALTER TABLE email_logs ADD COLUMN sender TEXT DEFAULT 'HOD Admin'");
    }

    // 3. Create and seed sections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sections (
        name TEXT PRIMARY KEY,
        year TEXT NOT NULL
      )
    `);
    await pool.query(`
      INSERT OR IGNORE INTO sections (name, year) VALUES 
      ('1-A', 'First Year'),
      ('1-B', 'First Year'),
      ('2-A', 'Second Year'),
      ('2-B', 'Second Year'),
      ('3-A', 'Third Year'),
      ('3-B', 'Third Year')
    `);

    // 4. Seed new common subjects and default assignments
    const newSubjects = [
      ['CS108', 'Statistics', 'theory', 4, 'First Year'],
      ['CS205', 'Tamil', 'language', 6, 'Second Year'],
      ['CS206', 'English', 'language', 6, 'Second Year'],
      ['CS207', 'Mathematics', 'theory', 4, 'Second Year'],
      ['CS208', 'Statistics', 'theory', 4, 'Second Year'],
      ['CS305', 'Tamil', 'language', 6, 'Third Year'],
      ['CS306', 'English', 'language', 6, 'Third Year'],
      ['CS307', 'Mathematics', 'theory', 4, 'Third Year'],
      ['CS308', 'Statistics', 'theory', 4, 'Third Year']
    ];

    for (const [id, name, type, periods, year] of newSubjects) {
      await pool.query(
        'INSERT OR IGNORE INTO subjects (id, name, type, periods, year) VALUES (?, ?, ?, ?, ?)',
        [id, name, type, periods, year]
      );
    }

    const newAssignments = [
      ['1-A', 'CS108', 'STF006'],
      ['1-B', 'CS108', 'STF007'],
      ['2-A', 'CS205', 'STF004'],
      ['2-A', 'CS206', 'STF005'],
      ['2-A', 'CS207', 'STF003'],
      ['2-A', 'CS208', 'STF009'],
      ['2-B', 'CS205', 'STF008'],
      ['2-B', 'CS206', 'STF009'],
      ['2-B', 'CS207', 'STF004'],
      ['2-B', 'CS208', 'STF007'],
      ['3-A', 'CS305', 'STF004'],
      ['3-A', 'CS306', 'STF005'],
      ['3-A', 'CS307', 'STF003'],
      ['3-A', 'CS308', 'STF001'],
      ['3-B', 'CS305', 'STF008'],
      ['3-B', 'CS306', 'STF009'],
      ['3-B', 'CS307', 'STF006'],
      ['3-B', 'CS308', 'STF002']
    ];

    for (const [section, subjectId, staffId] of newAssignments) {
      await pool.query(
        'INSERT OR IGNORE INTO course_assignments (section, subject_id, staff_id) VALUES (?, ?, ?)',
        [section, subjectId, staffId]
      );
    }
  } catch (err) {
    console.error("Migration error:", err.message);
  }
}
runMigrations();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/email-logs', emailLogsRoutes);
app.use('/api/lab-slots', labSlotsRoutes);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n✅ ChronoAI API Server running at http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💾 SQLite Database file: ${process.env.DB_FILE || '../database/timetable.sqlite'}\n`);
  });
}

export default app;
