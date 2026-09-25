import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'bioadaptive.db')
const db = new DatabaseSync(dbPath)

// Initialize database tables
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'demo-user',
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration_seconds INTEGER DEFAULT 0,
      mode TEXT DEFAULT 'camera',
      status TEXT DEFAULT 'active',
      avg_fatigue_score REAL DEFAULT 0,
      peak_fatigue_score INTEGER DEFAULT 0,
      blink_count INTEGER DEFAULT 0,
      avg_typing_speed INTEGER DEFAULT 0,
      posture_summary TEXT DEFAULT 'Upright',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS telemetry_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      timestamp INTEGER NOT NULL,
      time_str TEXT,
      fatigue_score REAL DEFAULT 0,
      blink_rate INTEGER DEFAULT 0,
      typing_speed INTEGER DEFAULT 0,
      posture TEXT DEFAULT 'Upright',
      perclos REAL DEFAULT 0,
      mar REAL DEFAULT 0,
      is_idle INTEGER DEFAULT 0,
      privacy_mode INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accessibility_settings (
      key TEXT PRIMARY KEY,
      font_active INTEGER DEFAULT 0,
      brightness_active INTEGER DEFAULT 0,
      focus_active INTEGER DEFAULT 0,
      voice_active INTEGER DEFAULT 1,
      privacy_mode INTEGER DEFAULT 0,
      current_adaptation_level TEXT DEFAULT 'LOW_FATIGUE',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS interventions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      trigger_type TEXT NOT NULL,
      adaptation_applied TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Ensure default accessibility row exists
  const stmt = db.prepare('SELECT key FROM accessibility_settings WHERE key = ?')
  const row = stmt.get('global')
  if (!row) {
    db.prepare(`
      INSERT INTO accessibility_settings (key, font_active, brightness_active, focus_active, voice_active, privacy_mode, current_adaptation_level)
      VALUES ('global', 0, 0, 0, 1, 0, 'LOW_FATIGUE')
    `).run()
  }

  // Seed initial historical session data if DB is empty to populate analytics out of the box
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM sessions')
  const countRow = countStmt.get()
  if (countRow && countRow.count === 0) {
    seedInitialData()
  }
}

function seedInitialData() {
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000

  // Seed 5 historical days of realistic sessions
  const sampleSessions = [
    { daysAgo: 4, mode: 'camera', avgScore: 18, peakScore: 35, blinks: 140, duration: 1800, posture: 'Upright' },
    { daysAgo: 3, mode: 'camera', avgScore: 42, peakScore: 65, blinks: 210, duration: 2400, posture: 'Upright' },
    { daysAgo: 2, mode: 'privacy_mode', avgScore: 28, peakScore: 48, blinks: 160, duration: 2100, posture: 'Privacy Tracking' },
    { daysAgo: 1, mode: 'camera', avgScore: 68, peakScore: 82, blinks: 310, duration: 3600, posture: 'Tilted Down' },
    { daysAgo: 0, mode: 'camera', avgScore: 22, peakScore: 40, blinks: 95, duration: 1200, posture: 'Upright' }
  ]

  const insertSession = db.prepare(`
    INSERT INTO sessions (id, user_id, start_time, end_time, duration_seconds, mode, status, avg_fatigue_score, peak_fatigue_score, blink_count, avg_typing_speed, posture_summary)
    VALUES (?, 'demo-user', ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?)
  `)

  const insertTelemetry = db.prepare(`
    INSERT INTO telemetry_logs (session_id, timestamp, time_str, fatigue_score, blink_rate, typing_speed, posture, perclos, mar, is_idle, privacy_mode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  sampleSessions.forEach((s, idx) => {
    const sessionId = `seed-session-${idx + 1}`
    const startTime = now - (s.daysAgo * oneDayMs) - 3600000
    const endTime = startTime + (s.duration * 1000)
    
    insertSession.run(sessionId, startTime, endTime, s.duration, s.mode, s.avgScore, s.peakScore, s.blinks, 45 + idx * 5, s.posture)

    // Generate 12 telemetry data points per sample session across hours
    for (let point = 0; point < 12; point++) {
      const pointTime = startTime + (point * 5 * 60 * 1000)
      const dateObj = new Date(pointTime)
      const timeStr = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`
      const noise = Math.floor(Math.sin(point) * 12)
      const score = Math.max(5, Math.min(95, s.avgScore + noise))
      
      insertTelemetry.run(
        sessionId,
        pointTime,
        timeStr,
        score,
        14 + Math.floor(score / 5),
        40 + Math.floor(Math.random() * 20),
        s.posture,
        (score / 100) * 0.25,
        0.35,
        point % 5 === 0 ? 1 : 0,
        s.mode === 'privacy_mode' ? 1 : 0
      )
    }
  })
}

export default db
