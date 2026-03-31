const { UPGRADE_CONFIG } = require('../config/upgrades');

class PrestigeCalculator {
  constructor() {}

  calculateStarsEarned(upgrades, unlockedSkillIds) {
    let totalStars = 0;
    
    upgrades.forEach(upgrade => {
      const config = UPGRADE_CONFIG[upgrade.upgrade_type];
      if (!config) return;
      
      const enhancementCount = upgrade.enhancement_count || 0;
      if (enhancementCount === 0) return;
      
      const baseCost = config.baseCost;
      const logCost = Math.log10(baseCost);
      const starsPerEnhancement = Math.max(1, Math.floor(logCost + 1));
      
      totalStars += enhancementCount * starsPerEnhancement;
    });
    
    let multiplier = 1;
    
    if (unlockedSkillIds.includes('reset_bonus')) {
      multiplier *= 1.5;
    }
    
    if (unlockedSkillIds.includes('demon_contract') || unlockedSkillIds.includes('devil_contract')) {
      multiplier *= 2;
    }
    
    return Math.floor(totalStars * multiplier);
  }

  calculateExpectedStars(upgrades) {
    let totalStars = 0;
    
    upgrades.forEach(upgrade => {
      const config = UPGRADE_CONFIG[upgrade.upgrade_type];
      if (!config) return;
      
      const enhancementCount = upgrade.enhancement_count || 0;
      if (enhancementCount === 0) return;
      
      const baseCost = config.baseCost;
      const logCost = Math.log10(baseCost);
      const starsPerEnhancement = Math.max(1, Math.floor(logCost + 1));
      
      totalStars += enhancementCount * starsPerEnhancement;
    });
    
    return totalStars;
  }
}

module.exports = PrestigeCalculator;