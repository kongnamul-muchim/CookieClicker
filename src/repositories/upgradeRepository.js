class UpgradeRepository {
  constructor(db, saveDB) {
    this.db = db;
    this.saveDB = saveDB;
  }

  findByPlayerId(playerId) {
    const stmt = this.db.prepare('SELECT * FROM upgrades WHERE player_id = ?');
    stmt.bind([playerId]);
    
    const upgrades = [];
    while (stmt.step()) {
      upgrades.push(stmt.getAsObject());
    }
    stmt.free();
    
    return upgrades;
  }

  findByType(playerId, upgradeType) {
    const stmt = this.db.prepare(
      'SELECT * FROM upgrades WHERE player_id = ? AND upgrade_type = ?'
    );
    stmt.bind([playerId, upgradeType]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    
    stmt.free();
    return null;
  }

  setLevel(playerId, upgradeType, level) {
    const existing = this.findByType(playerId, upgradeType);
    
    if (existing) {
      this.db.run(
        'UPDATE upgrades SET level = ? WHERE player_id = ? AND upgrade_type = ?',
        [level, playerId, upgradeType]
      );
    } else {
      this.db.run(
        'INSERT INTO upgrades (player_id, upgrade_type, level) VALUES (?, ?, ?)',
        [playerId, upgradeType, level]
      );
    }
    
    this.saveDB();
  }

  incrementLevel(playerId, upgradeType) {
    const existing = this.findByType(playerId, upgradeType);
    
    if (existing) {
      this.db.run(
        'UPDATE upgrades SET level = level + 1 WHERE player_id = ? AND upgrade_type = ?',
        [playerId, upgradeType]
      );
    } else {
      this.db.run(
        'INSERT INTO upgrades (player_id, upgrade_type, level) VALUES (?, ?, 1)',
        [playerId, upgradeType]
      );
    }
    
    this.saveDB();
  }

  incrementEnhancementCount(playerId, upgradeType) {
    this.db.run(
      'UPDATE upgrades SET enhancement_count = enhancement_count + 1 WHERE player_id = ? AND upgrade_type = ?',
      [playerId, upgradeType]
    );
    this.saveDB();
  }

  setSpecialEnhancement(playerId, upgradeType) {
    this.db.run(
      'UPDATE upgrades SET special_enhancement = 1 WHERE player_id = ? AND upgrade_type = ?',
      [playerId, upgradeType]
    );
    this.saveDB();
  }

  resetAll(playerId) {
    this.db.run(
      'UPDATE upgrades SET level = 0, enhancement_count = 0, special_enhancement = 0 WHERE player_id = ?',
      [playerId]
    );
    this.saveDB();
  }

  initializeForPlayer(playerId, upgradeTypes) {
    upgradeTypes.forEach(type => {
      this.setLevel(playerId, type, 0);
    });
  }
}

module.exports = UpgradeRepository;