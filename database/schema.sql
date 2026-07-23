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
-- DEFAULT CONFIGURATION
-- ============================================================

-- Default Settings
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('periodsPerDay', '5'),
('dayOrdersCount', '6'),
('breakAfterPeriod', '3'),
('timings', '{"1":"02:00 PM - 02:50 PM","2":"02:50 PM - 03:40 PM","3":"03:40 PM - 04:30 PM","break":"04:30 PM - 04:50 PM","4":"04:50 PM - 05:40 PM","5":"05:40 PM - 06:30 PM"}');

