class SkillRepository {
  constructor(db, saveDB) {
    this.db = db;
    this.saveDB = saveDB;
  }

  getUnlockedSkills(playerId) {
    const stmt = this.db.prepare('SELECT skill_id FROM unlocked_skills WHERE player_id = ?');
    stmt.bind([playerId]);
    
    const skills = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      skills.push(row.skill_id);
    }
    stmt.free();
    
    return skills;
  }

  unlockSkill(playerId, skillId) {
    this.db.run(
      'INSERT INTO unlocked_skills (player_id, skill_id) VALUES (?, ?)',
      [playerId, skillId]
    );
    this.saveDB();
  }

  hasSkill(playerId, skillId) {
    const stmt = this.db.prepare('SELECT 1 FROM unlocked_skills WHERE player_id = ? AND skill_id = ?');
    stmt.bind([playerId, skillId]);
    
    const exists = stmt.step();
    stmt.free();
    
    return exists;
  }

  getPrestigeData(playerId) {
    const stmt = this.db.prepare('SELECT prestige_count, prestige_stars FROM players WHERE id = ?');
    stmt.bind([playerId]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    
    stmt.free();
    return null;
  }

  updatePrestigeData(playerId, prestigeCount, prestigeStars) {
    this.db.run(
      'UPDATE players SET prestige_count = ?, prestige_stars = ?, cookies = 0 WHERE id = ?',
      [prestigeCount, prestigeStars, playerId]
    );
    this.saveDB();
  }

  updatePrestigeStars(playerId, stars) {
    this.db.run(
      'UPDATE players SET prestige_stars = ? WHERE id = ?',
      [stars, playerId]
    );
    this.saveDB();
  }
}

module.exports = SkillRepository;