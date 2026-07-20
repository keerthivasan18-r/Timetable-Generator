-- ChronoAI Timetable System — MySQL Schema
-- Run this file to initialize the database:
--   mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS chronoai_timetable CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chronoai_timetable;

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('theory', 'practical', 'language') DEFAULT 'theory',
  periods INT NOT NULL DEFAULT 4,
  year VARCHAR(20) DEFAULT 'First Year',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Faculty Assignments Table
CREATE TABLE IF NOT EXISTS course_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section VARCHAR(10) NOT NULL,
  subject_id VARCHAR(20) NOT NULL,
  staff_id VARCHAR(20),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
  UNIQUE KEY unique_section_subject (section, subject_id)
);

-- Settings Table (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Timetable Table (stores generated grid as JSON)
CREATE TABLE IF NOT EXISTS timetable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status ENUM('draft', 'published') DEFAULT 'draft',
  tables_json LONGTEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Lab Slots Table (admin-specified lab periods)
CREATE TABLE IF NOT EXISTS lab_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section VARCHAR(10) NOT NULL,
  day_order INT NOT NULL,
  period INT NOT NULL,
  subject_id VARCHAR(20),
  staff_id VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_lab_slot (section, day_order, period),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  recipient_id VARCHAR(50) DEFAULT 'all',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Simulation Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
  id VARCHAR(50) PRIMARY KEY,
  recipient_email VARCHAR(150) NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_broadcast TINYINT(1) DEFAULT 0,
  recipient_count INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'success',
  sender VARCHAR(100) DEFAULT 'HOD Admin',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login Sessions Table (Active Users Tracking)
CREATE TABLE IF NOT EXISTS login_sessions (
  id VARCHAR(50) PRIMARY KEY,
  user_role ENUM('hod', 'staff') NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(150),
  login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_at TIMESTAMP NULL,
  is_active TINYINT(1) DEFAULT 1,
  ip_address VARCHAR(45)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Staff
INSERT IGNORE INTO staff (id, name, email, password) VALUES
('STF001', 'Sangeetha', 'sangeetha@college.edu', 'StaffPassword1'),
('STF002', 'Tamilarasi', 'tamilarasi@college.edu', 'StaffPassword2'),
('STF003', 'Vijaya', 'vijaya@college.edu', 'StaffPassword3'),
('STF004', 'Murugan', 'murugan@college.edu', 'StaffPassword4'),
('STF005', 'Archana', 'archana@college.edu', 'StaffPassword5'),
('STF006', 'Sudha', 'sudha@college.edu', 'StaffPassword6'),
('STF007', 'Dharani', 'dharani@college.edu', 'StaffPassword7'),
('STF008', 'Vadivel Murugan', 'vadivel@college.edu', 'StaffPassword8'),
('STF009', 'Vidhya', 'vidhya@college.edu', 'StaffPassword9');

-- Default Subjects
INSERT IGNORE INTO subjects (id, name, type, periods, year) VALUES
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

-- Default Assignments — Section 1-A
INSERT IGNORE INTO course_assignments (section, subject_id, staff_id) VALUES
('1-A', 'CS101', 'STF001'),
('1-A', 'CS102', 'STF002'),
('1-A', 'CS103', 'STF001'),
('1-A', 'CS104', 'STF003'),
('1-A', 'CS105', 'STF004'),
('1-A', 'CS106', 'STF005'),
('1-A', 'CS107', 'STF005'),
('1-A', 'CS108', 'STF006');

-- Default Assignments — Section 1-B
INSERT IGNORE INTO course_assignments (section, subject_id, staff_id) VALUES
('1-B', 'CS101', 'STF006'),
('1-B', 'CS102', 'STF007'),
('1-B', 'CS103', 'STF006'),
('1-B', 'CS104', 'STF004'),
('1-B', 'CS105', 'STF008'),
('1-B', 'CS106', 'STF009'),
('1-B', 'CS107', 'STF009'),
('1-B', 'CS108', 'STF007');

-- Default Assignments — Section 2-A
INSERT IGNORE INTO course_assignments (section, subject_id, staff_id) VALUES
('2-A', 'CS201', 'STF001'),
('2-A', 'CS202', 'STF002'),
('2-A', 'CS203', 'STF003'),
('2-A', 'CS204', 'STF004'),
('2-A', 'CS205', 'STF004'),
('2-A', 'CS206', 'STF005'),
('2-A', 'CS207', 'STF003'),
('2-A', 'CS208', 'STF009');

-- Default Assignments — Section 2-B
INSERT IGNORE INTO course_assignments (section, subject_id, staff_id) VALUES
('2-B', 'CS201', 'STF005'),
('2-B', 'CS202', 'STF006'),
('2-B', 'CS203', 'STF007'),
('2-B', 'CS204', 'STF008'),
('2-B', 'CS205', 'STF008'),
('2-B', 'CS206', 'STF009'),
('2-B', 'CS207', 'STF004'),
('2-B', 'CS208', 'STF007');

-- Default Assignments — Section 3-A
INSERT IGNORE INTO course_assignments (section, subject_id, staff_id) VALUES
('3-A', 'CS301', 'STF001'),
('3-A', 'CS302', 'STF002'),
('3-A', 'CS303', 'STF003'),
('3-A', 'CS304', 'STF004'),
('3-A', 'CS305', 'STF004'),
('3-A', 'CS306', 'STF005'),
('3-A', 'CS307', 'STF003'),
('3-A', 'CS308', 'STF001');

-- Default Assignments — Section 3-B
INSERT IGNORE INTO course_assignments (section, subject_id, staff_id) VALUES
('3-B', 'CS301', 'STF005'),
('3-B', 'CS302', 'STF006'),
('3-B', 'CS303', 'STF007'),
('3-B', 'CS304', 'STF008'),
('3-B', 'CS305', 'STF008'),
('3-B', 'CS306', 'STF009'),
('3-B', 'CS307', 'STF006'),
('3-B', 'CS308', 'STF002');

-- Default Settings
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('periodsPerDay', '5'),
('dayOrdersCount', '6'),
('breakAfterPeriod', '3'),
('timings', '{"1":"02:00 PM - 02:50 PM","2":"02:50 PM - 03:40 PM","3":"03:40 PM - 04:30 PM","break":"04:30 PM - 04:50 PM","4":"04:50 PM - 05:40 PM","5":"05:40 PM - 06:30 PM"}');

-- Default Notification
INSERT IGNORE INTO notifications (id, title, message, recipient_id) VALUES
('N001', 'System Initialized', 'ChronoAI Timetable Management System has been initialized with MySQL backend.', 'all');

-- Initial timetable record
INSERT IGNORE INTO timetable (id, status, tables_json) VALUES (1, 'draft', NULL);
