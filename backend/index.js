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

// Run database migrations on server startup to automatically extend tables for Second Year support
async function runMigrations() {
  try {
    // 1. Alter subjects table to add year column
    const [colsSubjects] = await pool.query("SHOW COLUMNS FROM subjects LIKE 'year'");
    if (colsSubjects.length === 0) {
      await pool.query("ALTER TABLE subjects ADD COLUMN year VARCHAR(20) DEFAULT 'First Year'");
      console.log("Migration: Added 'year' column to subjects table.");
    }

    // 2. Alter email_logs table to add broadcast-related columns
    const [colsBroadcast] = await pool.query("SHOW COLUMNS FROM email_logs LIKE 'is_broadcast'");
    if (colsBroadcast.length === 0) {
      await pool.query("ALTER TABLE email_logs ADD COLUMN is_broadcast TINYINT(1) DEFAULT 0");
      console.log("Migration: Added 'is_broadcast' column to email_logs table.");
    }
    const [colsCount] = await pool.query("SHOW COLUMNS FROM email_logs LIKE 'recipient_count'");
    if (colsCount.length === 0) {
      await pool.query("ALTER TABLE email_logs ADD COLUMN recipient_count INT DEFAULT 1");
      console.log("Migration: Added 'recipient_count' column to email_logs table.");
    }
    const [colsStatus] = await pool.query("SHOW COLUMNS FROM email_logs LIKE 'status'");
    if (colsStatus.length === 0) {
      await pool.query("ALTER TABLE email_logs ADD COLUMN status VARCHAR(20) DEFAULT 'success'");
      console.log("Migration: Added 'status' column to email_logs table.");
    }
    const [colsSender] = await pool.query("SHOW COLUMNS FROM email_logs LIKE 'sender'");
    if (colsSender.length === 0) {
      await pool.query("ALTER TABLE email_logs ADD COLUMN sender VARCHAR(100) DEFAULT 'HOD Admin'");
      console.log("Migration: Added 'sender' column to email_logs table.");
    }

    // 3. Create and seed sections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sections (
        name VARCHAR(10) PRIMARY KEY,
        year VARCHAR(20) NOT NULL
      )
    `);
    await pool.query(`
      INSERT IGNORE INTO sections (name, year) VALUES 
      ('1-A', 'First Year'),
      ('1-B', 'First Year'),
      ('2-A', 'Second Year'),
      ('2-B', 'Second Year'),
      ('3-A', 'Third Year'),
      ('3-B', 'Third Year')
    `);
    console.log("Migration: Seeded sections table.");

    // 4. Seed new common subjects and their default assignments
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
        'INSERT IGNORE INTO subjects (id, name, type, periods, year) VALUES (?, ?, ?, ?, ?)',
        [id, name, type, periods, year]
      );
    }
    console.log("Migration: Seeded extended subjects list.");

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
        'INSERT IGNORE INTO course_assignments (section, subject_id, staff_id) VALUES (?, ?, ?)',
        [section, subjectId, staffId]
      );
    }
    console.log("Migration: Seeded course_assignments for extended subjects.");
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
app.listen(PORT, () => {
  console.log(`\n✅ ChronoAI API Server running at http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`\n📋 Make sure your MySQL database is ready:`);
  console.log(`   mysql -u ${process.env.DB_USER || 'root'} -p ${process.env.DB_NAME || 'chronoai_timetable'} < database/schema.sql\n`);
});
