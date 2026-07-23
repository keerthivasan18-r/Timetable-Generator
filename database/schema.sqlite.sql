-- ChronoAI Timetable System — SQLite Schema & Seed Data

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('theory', 'practical', 'language')) DEFAULT 'theory',
  periods INTEGER NOT NULL DEFAULT 4,
  year TEXT DEFAULT 'First Year',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  staff_id TEXT,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
  UNIQUE(section, subject_id)
);

CREATE TABLE IF NOT EXISTS settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timetable (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT DEFAULT 'draft',
  tables_json TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL,
  day_order INTEGER NOT NULL,
  period INTEGER NOT NULL,
  subject_id TEXT,
  staff_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(section, day_order, period),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_id TEXT DEFAULT 'all',
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_broadcast INTEGER DEFAULT 0,
  recipient_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'success',
  sender TEXT DEFAULT 'HOD Admin',
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_sessions (
  id TEXT PRIMARY KEY,
  user_role TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  logout_at DATETIME,
  is_active INTEGER DEFAULT 1,
  ip_address TEXT
);

CREATE TABLE IF NOT EXISTS sections (
  name TEXT PRIMARY KEY,
  year TEXT NOT NULL
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT OR IGNORE INTO staff (id, name, email, password) VALUES
('STF001', 'Sangeetha', 'sangeetha@college.edu', 'StaffPassword1'),
('STF002', 'Tamilarasi', 'tamilarasi@college.edu', 'StaffPassword2'),
('STF003', 'Vijaya', 'vijaya@college.edu', 'StaffPassword3'),
('STF004', 'Murugan', 'murugan@college.edu', 'StaffPassword4'),
('STF005', 'Archana', 'archana@college.edu', 'StaffPassword5'),
('STF006', 'Sudha', 'sudha@college.edu', 'StaffPassword6'),
('STF007', 'Dharani', 'dharani@college.edu', 'StaffPassword7'),
('STF008', 'Vadivel Murugan', 'vadivel@college.edu', 'StaffPassword8'),
('STF009', 'Vidhya', 'vidhya@college.edu', 'StaffPassword9');

INSERT OR IGNORE INTO subjects (id, name, type, periods, year) VALUES
('CS101', 'Java', 'theory', 4, 'First Year'),
('CS102', 'Operating Systems', 'theory', 4, 'First Year'),
('CS103', 'Java Lab', 'practical', 4, 'First Year'),
('CS104', 'Mathematics', 'theory', 4, 'First Year'),
('CS105', 'Tamil', 'language', 6, 'First Year'),
('CS106', 'English', 'language', 6, 'First Year'),
('CS107', 'Soft Skills', 'theory', 2, 'First Year'),
('CS108', 'Statistics', 'theory', 4, 'First Year'),
('CS201', 'Python', 'theory', 4, 'Second Year'),
('CS202', 'Python Lab', 'practical', 4, 'Second Year'),
('CS203', 'DBMS', 'theory', 4, 'Second Year'),
('CS204', 'DBMS Lab', 'practical', 4, 'Second Year'),
('CS205', 'Tamil', 'language', 6, 'Second Year'),
('CS206', 'English', 'language', 6, 'Second Year'),
('CS207', 'Mathematics', 'theory', 4, 'Second Year'),
('CS208', 'Statistics', 'theory', 4, 'Second Year'),
('CS301', 'Computer Networks', 'theory', 4, 'Third Year'),
('CS302', 'Networks Lab', 'practical', 4, 'Third Year'),
('CS303', 'Web Technology', 'theory', 4, 'Third Year'),
('CS304', 'Web Tech Lab', 'practical', 4, 'Third Year'),
('CS305', 'Tamil', 'language', 6, 'Third Year'),
('CS306', 'English', 'language', 6, 'Third Year'),
('CS307', 'Mathematics', 'theory', 4, 'Third Year'),
('CS308', 'Statistics', 'theory', 4, 'Third Year');

INSERT OR IGNORE INTO sections (name, year) VALUES 
('1-A', 'First Year'),
('1-B', 'First Year'),
('2-A', 'Second Year'),
('2-B', 'Second Year'),
('3-A', 'Third Year'),
('3-B', 'Third Year');

INSERT OR IGNORE INTO course_assignments (section, subject_id, staff_id) VALUES
('1-A', 'CS101', 'STF001'),
('1-A', 'CS102', 'STF002'),
('1-A', 'CS103', 'STF001'),
('1-A', 'CS104', 'STF003'),
('1-A', 'CS105', 'STF004'),
('1-A', 'CS106', 'STF005'),
('1-A', 'CS107', 'STF005'),
('1-A', 'CS108', 'STF006'),
('1-B', 'CS101', 'STF006'),
('1-B', 'CS102', 'STF007'),
('1-B', 'CS103', 'STF006'),
('1-B', 'CS104', 'STF004'),
('1-B', 'CS105', 'STF008'),
('1-B', 'CS106', 'STF009'),
('1-B', 'CS107', 'STF009'),
('1-B', 'CS108', 'STF007'),
('2-A', 'CS201', 'STF001'),
('2-A', 'CS202', 'STF002'),
('2-A', 'CS203', 'STF003'),
('2-A', 'CS204', 'STF004'),
('2-A', 'CS205', 'STF004'),
('2-A', 'CS206', 'STF005'),
('2-A', 'CS207', 'STF003'),
('2-A', 'CS208', 'STF009'),
('2-B', 'CS201', 'STF005'),
('2-B', 'CS202', 'STF006'),
('2-B', 'CS203', 'STF007'),
('2-B', 'CS204', 'STF008'),
('2-B', 'CS205', 'STF008'),
('2-B', 'CS206', 'STF009'),
('2-B', 'CS207', 'STF004'),
('2-B', 'CS208', 'STF007'),
('3-A', 'CS301', 'STF001'),
('3-A', 'CS302', 'STF002'),
('3-A', 'CS303', 'STF003'),
('3-A', 'CS304', 'STF004'),
('3-A', 'CS305', 'STF004'),
('3-A', 'CS306', 'STF005'),
('3-A', 'CS307', 'STF003'),
('3-A', 'CS308', 'STF001'),
('3-B', 'CS301', 'STF005'),
('3-B', 'CS302', 'STF006'),
('3-B', 'CS303', 'STF007'),
('3-B', 'CS304', 'STF008'),
('3-B', 'CS305', 'STF008'),
('3-B', 'CS306', 'STF009'),
('3-B', 'CS307', 'STF006'),
('3-B', 'CS308', 'STF002');

INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES
('periodsPerDay', '5'),
('dayOrdersCount', '6'),
('breakAfterPeriod', '3'),
('timings', '{"1":"02:00 PM - 02:50 PM","2":"02:50 PM - 03:40 PM","3":"03:40 PM - 04:30 PM","break":"04:30 PM - 04:50 PM","4":"04:50 PM - 05:40 PM","5":"05:40 PM - 06:30 PM"}');

INSERT OR IGNORE INTO notifications (id, title, message, recipient_id) VALUES
('N001', 'System Initialized', 'ChronoAI Timetable Management System has been initialized with SQLite backend.', 'all');

INSERT OR IGNORE INTO timetable (id, status, tables_json) VALUES (1, 'draft', NULL);
