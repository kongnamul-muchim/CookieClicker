const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'game.db');

async function checkDB() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);
  
  const result = db.exec('SELECT * FROM upgrades WHERE upgrade_type = "farm" AND level = 100');
  console.log('=== Farm Level 100 in DB ===');
  console.log(JSON.stringify(result[0]?.values, null, 2));
  
  const players = db.exec('SELECT * FROM players');
  console.log('\n=== Players ===');
  console.log(JSON.stringify(players[0]?.values, null, 2));
  
  db.close();
}

checkDB();