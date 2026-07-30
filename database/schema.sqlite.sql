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

CREATE TABLE IF NOT EXISTS lab_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT DEFAULT 'Computer Science',
  capacity INTEGER DEFAULT 30,
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL,
  day_order INTEGER NOT NULL,
  period INTEGER NOT NULL,
  subject_id TEXT,
  staff_id TEXT,
  lab_room_id TEXT,
  is_manual INTEGER DEFAULT 1,
  is_locked INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(section, day_order, period),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
  FOREIGN KEY (lab_room_id) REFERENCES lab_rooms(id) ON DELETE SET NULL
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

CREATE TABLE IF NOT EXISTS electives (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'Computer Science',
  semester INTEGER NOT NULL DEFAULT 5,
  class TEXT DEFAULT '3-A',
  academic_year TEXT NOT NULL DEFAULT 'Third Year',
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS elective_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  elective_id TEXT NOT NULL,
  section TEXT NOT NULL,
  FOREIGN KEY (elective_id) REFERENCES electives(id) ON DELETE CASCADE,
  UNIQUE(elective_id, section)
);

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
);

CREATE TABLE IF NOT EXISTS elective_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  elective_course_id INTEGER NOT NULL,
  student_count INTEGER DEFAULT 0,
  FOREIGN KEY (elective_course_id) REFERENCES elective_courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_electives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  student_name TEXT DEFAULT '',
  elective_course_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (elective_course_id) REFERENCES elective_courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS elective_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day INTEGER NOT NULL,
  period INTEGER NOT NULL,
  elective_id TEXT NOT NULL,
  FOREIGN KEY (elective_id) REFERENCES electives(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS elective_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester INTEGER NOT NULL,
  class TEXT NOT NULL,
  day INTEGER NOT NULL,
  period INTEGER NOT NULL,
  locked INTEGER DEFAULT 1,
  UNIQUE(semester, class, day, period)
);

-- ============================================================
-- DEFAULT CONFIGURATION
-- ============================================================

INSERT OR IGNORE INTO sections (name, year) VALUES 
('1-A', 'First Year'),
('1-B', 'First Year'),
('2-A', 'Second Year'),
('2-B', 'Second Year'),
('3-A', 'Third Year'),
('3-B', 'Third Year');

INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES
('periodsPerDay', '5'),
('dayOrdersCount', '6'),
('breakAfterPeriod', '3'),
('timings', '{"1":"02:00 PM - 02:50 PM","2":"02:50 PM - 03:40 PM","3":"03:40 PM - 04:30 PM","break":"04:30 PM - 04:50 PM","4":"04:50 PM - 05:40 PM","5":"05:40 PM - 06:30 PM"}');

INSERT OR IGNORE INTO lab_rooms (id, name, department, capacity, enabled) VALUES
('L1', 'Lab A', 'Computer Science', 30, 1),
('L2', 'Lab B', 'Computer Science', 30, 1),
('L3', 'Lab C', 'Computer Science', 30, 1);


