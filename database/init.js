const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'game.db');

let db = null;

async function initDB() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  createTables();
  
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
    saveDB();
    db.close();
    db = null;
  }
}

module.exports = {
  initDB,
  getDB,
  closeDB,
  saveDB
};