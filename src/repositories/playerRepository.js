class PlayerRepository {
  constructor(db, saveDB) {
    this.db = db;
    this.saveDB = saveDB;
  }

  findBySessionId(sessionId) {
    const stmt = this.db.prepare('SELECT * FROM players WHERE session_id = ?');
    stmt.bind([sessionId]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    
    stmt.free();
    return null;
  }

  findById(playerId) {
    const stmt = this.db.prepare('SELECT * FROM players WHERE id = ?');
    stmt.bind([playerId]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    
    stmt.free();
    return null;
  }

  create(sessionId) {
    this.db.run(
      'INSERT INTO players (session_id) VALUES (?)',
      [sessionId]
    );
    this.saveDB();
    
    return this.findBySessionId(sessionId);
  }

  update(playerId, updates) {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), playerId];
    
    this.db.run(
      `UPDATE players SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    this.saveDB();
  }
}

module.exports = PlayerRepository;