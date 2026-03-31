class AchievementRepository {
  constructor(db, saveDB) {
    this.db = db;
    this.saveDB = saveDB;
  }

  getUnlockedAchievements(playerId) {
    const stmt = this.db.prepare('SELECT achievement_id FROM achievements WHERE player_id = ?');
    stmt.bind([playerId]);
    
    const achievements = [];
    while (stmt.step()) {
      achievements.push(stmt.getAsObject().achievement_id);
    }
    stmt.free();
    
    return achievements;
  }

  unlockAchievement(playerId, achievementId) {
    this.db.run(
      'INSERT OR IGNORE INTO achievements (player_id, achievement_id) VALUES (?, ?)',
      [playerId, achievementId]
    );
    this.saveDB();
  }

  isUnlocked(playerId, achievementId) {
    const stmt = this.db.prepare('SELECT 1 FROM achievements WHERE player_id = ? AND achievement_id = ?');
    stmt.bind([playerId, achievementId]);
    
    const result = stmt.step();
    stmt.free();
    
    return result;
  }
}

module.exports = AchievementRepository;