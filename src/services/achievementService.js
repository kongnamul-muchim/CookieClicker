const { ACHIEVEMENTS, ACHIEVEMENT_IDS } = require('../config/achievements');

class AchievementService {
  constructor(achievementRepository) {
    this.achievementRepository = achievementRepository;
  }

  checkAndUnlockAchievements(playerId, stats) {
    const unlocked = [];
    
    ACHIEVEMENT_IDS.forEach(achievementId => {
      const achievement = ACHIEVEMENTS[achievementId];
      
      if (achievement.condition(stats) && !this.achievementRepository.isUnlocked(playerId, achievementId)) {
        this.achievementRepository.unlockAchievement(playerId, achievementId);
        unlocked.push({
          id: achievementId,
          name: achievement.name,
          icon: achievement.icon
        });
      }
    });
    
    return unlocked;
  }

  getUnlockedAchievements(playerId) {
    const unlockedIds = this.achievementRepository.getUnlockedAchievements(playerId);
    return unlockedIds.map(id => ({
      id,
      ...ACHIEVEMENTS[id]
    }));
  }

  getAllAchievements(playerId) {
    const unlockedIds = this.achievementRepository.getUnlockedAchievements(playerId);
    
    return ACHIEVEMENT_IDS.map(id => ({
      id,
      ...ACHIEVEMENTS[id],
      unlocked: unlockedIds.includes(id)
    }));
  }
}

module.exports = AchievementService;