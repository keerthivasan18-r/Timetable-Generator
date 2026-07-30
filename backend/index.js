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
import labRoomsRoutes from './routes/lab_rooms.js';
import electivesRoutes from './routes/electives.js';
import { seedAcademicData } from './db/seedAcademicData.js';

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

    // 3. Create sections table if not exists
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

    // 4. Create Elective tables if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS electives (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL DEFAULT 'Computer Science',
        semester INTEGER NOT NULL DEFAULT 5,
        class TEXT NOT NULL DEFAULT '3-A',
        academic_year TEXT NOT NULL DEFAULT 'Third Year',
        enabled INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS elective_courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        elective_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        subject_name TEXT NOT NULL,
        faculty_id TEXT,
        weekly_hours INTEGER DEFAULT 4,
        capacity INTEGER DEFAULT 35,
        student_count INTEGER DEFAULT 0,
        FOREIGN KEY (elective_id) REFERENCES electives(id) ON DELETE CASCADE,
        FOREIGN KEY (faculty_id) REFERENCES staff(id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS elective_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        elective_course_id INTEGER NOT NULL,
        student_count INTEGER DEFAULT 0,
        FOREIGN KEY (elective_course_id) REFERENCES elective_courses(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_electives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        student_name TEXT DEFAULT '',
        elective_course_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (elective_course_id) REFERENCES elective_courses(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS elective_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day INTEGER NOT NULL,
        period INTEGER NOT NULL,
        elective_id TEXT NOT NULL,
        FOREIGN KEY (elective_id) REFERENCES electives(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS elective_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        semester INTEGER NOT NULL,
        class TEXT NOT NULL,
        day INTEGER NOT NULL,
        period INTEGER NOT NULL,
        locked INTEGER DEFAULT 1,
        UNIQUE(semester, class, day, period)
      )
    `);

    // Seed B.Sc Computer Science academic structure
    await seedAcademicData();
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
app.use('/api/lab-rooms', labRoomsRoutes);
app.use('/api/electives', electivesRoutes);


// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n✅ ChronoAI API Server running at http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💾 SQLite Database file: ${process.env.DB_FILE || '../database/timetable.sqlite'}\n`);
  });
}

export default app;
