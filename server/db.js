import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'terrawatch.db');

let db;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        initSchema();
    }
    return db;
}

function initSchema() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT NOT NULL,
      zone TEXT NOT NULL,
      level TEXT NOT NULL,
      msg TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );
  `);

    const count = db.prepare('SELECT COUNT(*) as c FROM alerts').get();
    if (count.c === 0) {
        const insert = db.prepare('INSERT INTO alerts (time, zone, level, msg) VALUES (?, ?, ?, ?)');
        const seedAlerts = [
            ['06:14:22', 'Jharkhand', 'high', 'Seismic spike 2.4R — Zone 7A'],
            ['05:52:10', 'Jharkhand', 'high', 'Landslide risk elevated — Sector C2'],
            ['04:30:00', 'Odisha', 'med', 'Vegetation loss detected in grid B4'],
            ['03:15:45', 'Chhattisgarh', 'low', 'Soil moisture within normal parameters'],
            ['02:44:00', 'Jharkhand', 'med', 'Mining vibration logged — 1.8R equivalent'],
            ['01:20:00', 'Odisha', 'low', 'Water table level stable'],
            ['00:05:10', 'Chhattisgarh', 'med', 'Iron ore blasting detected — Grid E9'],
        ];
        const insertMany = db.transaction((rows) => {
            for (const row of rows) insert.run(...row);
        });
        insertMany(seedAlerts);
        console.log('[DB] Seeded initial alerts');
    }
}

export function getAllAlerts() {
    return getDb().prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 100').all();
}

export function addAlert(time, zone, level, msg) {
    const stmt = getDb().prepare('INSERT INTO alerts (time, zone, level, msg) VALUES (?, ?, ?, ?)');
    return stmt.run(time, zone, level, msg);
}

export function clearAlerts() {
    return getDb().prepare('DELETE FROM alerts').run();
}
