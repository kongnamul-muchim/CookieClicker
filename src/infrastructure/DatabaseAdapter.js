class DatabaseAdapter {
  constructor(db, saveDB) {
    this.db = db;
    this.saveDB = saveDB;
  }

  run(sql, params = []) {
    this.db.run(sql, params);
    this.saveDB();
  }

  get(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    
    stmt.free();
    return null;
  }

  all(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    
    return rows;
  }

  prepare(sql) {
    return this.db.prepare(sql);
  }
}

module.exports = DatabaseAdapter;