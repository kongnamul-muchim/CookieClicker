const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'game.db');
const backupDir = path.join(__dirname, 'backups');
const MAX_BACKUPS = 10;

let db = null;
let backupInterval = null;

async function initDB() {
  const SQL = await initSqlJs();
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  if (fs.existsSync(dbPath)) {
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      if (fileBuffer.length > 0 && fileBuffer[0] === 0x53) {
        db = new SQL.Database(fileBuffer);
        createBackup('startup');
      } else {
        console.log('DB file corrupted, creating new DB');
        db = new SQL.Database();
      }
    } catch (e) {
      console.log('DB file error, creating new DB:', e.message);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }
  
  createTables();
  startAutoBackup();
  
  return db;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      cookies INTEGER DEFAULT 0,
      cookies_per_click INTEGER DEFAULT 1,
      cookies_per_second REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS upgrades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      upgrade_type TEXT NOT NULL,
      level INTEGER DEFAULT 0,
      enhancement_count INTEGER DEFAULT 0,
      special_enhancement INTEGER DEFAULT 0,
      FOREIGN KEY (player_id) REFERENCES players(id),
      UNIQUE(player_id, upgrade_type)
    )
  `);
  
  try {
    db.run('ALTER TABLE upgrades ADD COLUMN enhancement_count INTEGER DEFAULT 0');
  } catch (e) {
  }
  
  try {
    db.run('ALTER TABLE upgrades ADD COLUMN special_enhancement INTEGER DEFAULT 0');
  } catch (e) {
  }
  
  try {
    db.run('ALTER TABLE players ADD COLUMN prestige_count INTEGER DEFAULT 0');
  } catch (e) {
  }
  
  try {
    db.run('ALTER TABLE players ADD COLUMN prestige_stars INTEGER DEFAULT 0');
  } catch (e) {
  }
  
  try {
    db.run('ALTER TABLE players ADD COLUMN total_clicks INTEGER DEFAULT 0');
  } catch (e) {
  }
  
  try {
    db.run('ALTER TABLE players ADD COLUMN total_cookies_earned REAL DEFAULT 0');
  } catch (e) {
  }
  
  try {
    db.run('ALTER TABLE players ADD COLUMN total_upgrades_bought INTEGER DEFAULT 0');
  } catch (e) {
  }
  
  try {
    db.run('ALTER TABLE players ADD COLUMN total_enhancements INTEGER DEFAULT 0');
  } catch (e) {
  }
  
  try {
    db.run('ALTER TABLE players ADD COLUMN total_transcends INTEGER DEFAULT 0');
  } catch (e) {
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS unlocked_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      skill_id TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id),
      UNIQUE(player_id, skill_id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id),
      UNIQUE(player_id, achievement_id)
    )
  `);
  
  saveDB();
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function getDB() {
  return db;
}

function closeDB() {
  if (db) {
    createBackup('shutdown');
    saveDB();
    if (backupInterval) clearInterval(backupInterval);
    db.close();
    db = null;
  }
}

function createBackup(reason = 'auto') {
  if (!db) return;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `game-${timestamp}-${reason}.db`);
  
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(backupPath, buffer);
  
  cleanOldBackups();
}

function cleanOldBackups() {
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('game-') && f.endsWith('.db'))
    .map(f => ({
      name: f,
      path: path.join(backupDir, f),
      time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  while (files.length > MAX_BACKUPS) {
    const toDelete = files.pop();
    fs.unlinkSync(toDelete.path);
  }
}

function startAutoBackup() {
  backupInterval = setInterval(() => {
    createBackup('auto');
  }, 5 * 60 * 1000);
}

function restoreBackup(backupFile) {
  const backupPath = path.join(backupDir, backupFile);
  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup file not found');
  }
  
  if (db) {
    db.close();
    db = null;
  }
  
  fs.copyFileSync(backupPath, dbPath);
  
  const SQL = initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  db = new SQL.Database(fileBuffer);
  
  return true;
}

function listBackups() {
  return fs.readdirSync(backupDir)
    .filter(f => f.startsWith('game-') && f.endsWith('.db'))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(backupDir, f)).mtime
    }))
    .sort((a, b) => b.time - a.time);
}

module.exports = {
  initDB,
  getDB,
  closeDB,
  saveDB,
  createBackup,
  restoreBackup,
  listBackups
};