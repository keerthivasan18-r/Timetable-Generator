import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

let dbPath;
if (isVercel) {
  dbPath = '/tmp/timetable.sqlite';
} else if (process.env.DB_FILE) {
  dbPath = path.isAbsolute(process.env.DB_FILE)
    ? process.env.DB_FILE
    : path.resolve(process.cwd(), process.env.DB_FILE);
} else {
  dbPath = path.resolve(process.cwd(), '../database/timetable.sqlite');
}

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  try { fs.mkdirSync(dbDir, { recursive: true }); } catch {}
}

// Copy seed database to /tmp if running on Vercel and /tmp file is not created yet
if (isVercel && !fs.existsSync(dbPath)) {
  try {
    const seedCandidates = [
      path.resolve(process.cwd(), 'database/timetable.sqlite'),
      path.resolve(process.cwd(), '../database/timetable.sqlite'),
      path.resolve(process.cwd(), 'timetable.sqlite')
    ];
    const seedDbPath = seedCandidates.find(p => fs.existsSync(p));
    if (seedDbPath) {
      fs.copyFileSync(seedDbPath, dbPath);
      console.log(`📋 Copied seed database from ${seedDbPath} to ${dbPath}`);
    }
  } catch (err) {
    console.warn('⚠️ Could not copy seed DB to /tmp:', err.message);
  }
}

const db = new DatabaseSync(dbPath);

try {
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA journal_mode = WAL');
} catch (err) {
  // Pragma warning catch
}

// Initialize schema & seeds if database is fresh
function initDb() {
  try {
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='staff'");
    const tables = stmt.all();
    if (tables.length === 0) {
      console.log('🔄 Initializing SQLite database schema and seed data...');
      const candidates = [
        path.resolve(process.cwd(), '../database/schema.sqlite.sql'),
        path.resolve(process.cwd(), 'database/schema.sqlite.sql'),
        path.resolve(process.cwd(), 'schema.sqlite.sql')
      ];
      const actualSchemaPath = candidates.find(p => fs.existsSync(p));
      if (actualSchemaPath) {
        const sql = fs.readFileSync(actualSchemaPath, 'utf8');
        db.exec(sql);
        console.log('✅ SQLite schema and seed data initialized successfully.');
      } else {
        console.warn('⚠️ SQLite schema file not found, skipping initial auto-seed.');
      }
    }
  } catch (err) {
    console.error('❌ Error initializing SQLite database:', err.message);
  }
}

initDb();

const pool = {
  db,
  async query(sql, params = []) {
    try {
      let cleanedSql = sql.trim();

      // Convert MySQL NOW() to DATETIME('now', 'localtime') in SQLite
      cleanedSql = cleanedSql.replace(/\bNOW\(\)/gi, "DATETIME('now', 'localtime')");

      // Handle MySQL-style batch inserts: INSERT INTO table (cols) VALUES ? with params = [[[v1, v2], [v3, v4]]]
      if (/VALUES\s*\?/i.test(cleanedSql) && Array.isArray(params[0]) && Array.isArray(params[0][0])) {
        const rows = params[0];
        const placeholders = rows.map(() => `(${rows[0].map(() => '?').join(', ')})`).join(', ');
        cleanedSql = cleanedSql.replace(/VALUES\s*\?/i, `VALUES ${placeholders}`);
        params = rows.flat();
      }

      const isSelect = /^(SELECT|PRAGMA|EXPLAIN|WITH)/i.test(cleanedSql);

      if (isSelect) {
        const stmt = db.prepare(cleanedSql);
        const rows = stmt.all(...params);
        return [rows];
      } else {
        const stmt = db.prepare(cleanedSql);
        const info = stmt.run(...params);
        return [info];
      }
    } catch (err) {
      if (err.code === 'ERR_SQLITE_ERROR' || err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'SQLITE_CONSTRAINT' || (err.message && err.message.includes('UNIQUE constraint failed'))) {
        err.code = 'ER_DUP_ENTRY';
      }
      throw err;
    }
  }
};

console.log(`✅ Connected to SQLite database file at: ${dbPath}`);

export default pool;
