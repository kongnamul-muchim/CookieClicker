const { UPGRADE_CONFIG, UPGRADE_TYPES } = require('../config/upgrades');

class UpgradeService {
  constructor(upgradeRepository, statsCalculator) {
    this.upgradeRepository = upgradeRepository;
    this.statsCalculator = statsCalculator;
  }

  getUpgradeConfig(type) {
    return UPGRADE_CONFIG[type];
  }

  isValidUpgradeType(type) {
    return UPGRADE_TYPES.includes(type);
  }

  getUpgradesForPlayer(playerId) {
    return this.upgradeRepository.findByPlayerId(playerId);
  }

  buildUpgradeState(upgrades, effects) {
    return UPGRADE_TYPES.map(type => {
      const upgrade = upgrades.find(u => u.upgrade_type === type) || { 
        level: 0, 
        enhancement_count: 0, 
        special_enhancement: 0 
      };
      const config = UPGRADE_CONFIG[type];
      const cost = this.statsCalculator.calculateCost(
        config.baseCost, 
        config.multiplier, 
        upgrade.level, 
        effects.hasDiscount
      );
      const enhancementCount = upgrade.enhancement_count || 0;
      const isMaxLevel = config.maxLevel !== null && upgrade.level >= config.maxLevel;
      const canEnhance = config.canEnhance && !isMaxLevel && upgrade.level >= (enhancementCount + 1) * 10;
      const enhanceCost = this.statsCalculator.calculateEnhanceCost(
        config.baseCost, 
        config.multiplier, 
        upgrade.level
      );
      const specialEnhancement = upgrade.special_enhancement || 0;
      const canSpecialEnhance = config.canSpecialEnhance && isMaxLevel && !specialEnhancement;
      
      const specialEnhanceCost = config.specialEnhanceMultiplier ? 
        this.statsCalculator.calculateSpecialEnhanceCost(
          config.baseCost, 
          config.specialEnhanceMultiplier,
          effects.hasDiscount
        ) : 0;
      
      const nextMilestone = Math.ceil((upgrade.level + 1) / 10) * 10;
      const targetLevel = config.maxLevel !== null ? Math.min(nextMilestone, config.maxLevel) : nextMilestone;
      const levelsToBuy = targetLevel - upgrade.level;
      
      const batchCost = this.statsCalculator.calculateBatchCost(
        config.baseCost, 
        config.multiplier, 
        upgrade.level, 
        levelsToBuy, 
        effects.hasDiscount
      );
      
      return {
        type,
        level: upgrade.level,
        cost,
        enhancementCount,
        canEnhance,
        enhanceCost,
        isMaxLevel,
        maxLevel: config.maxLevel,
        specialEffect: config.specialEffect,
        canSpecialEnhance,
        specialEnhancement,
        specialEnhanceCost,
        batchCost,
        levelsToBuy
      };
    });
  }

  canBuyUpgrade(playerCookies, currentLevel, maxLevel) {
    if (maxLevel !== null && currentLevel >= maxLevel) {
      return { success: false, error: 'Maximum level reached' };
    }
    return { success: true };
  }

  buyUpgrade(playerId, type, currentCookies, effects) {
    const config = UPGRADE_CONFIG[type];
    const upgrade = this.upgradeRepository.findByType(playerId, type);
    const currentLevel = upgrade ? upgrade.level : 0;
    
    const maxLevelCheck = this.canBuyUpgrade(currentCookies, currentLevel, config.maxLevel);
    if (!maxLevelCheck.success) {
      return { success: false, error: maxLevelCheck.error };
    }
    
    const cost = this.statsCalculator.calculateCost(
      config.baseCost, 
      config.multiplier, 
      currentLevel, 
      effects.hasDiscount
    );
    
    if (currentCookies < cost) {
      return { success: false, error: 'Not enough cookies' };
    }
    
    this.upgradeRepository.incrementLevel(playerId, type);
    
    return { 
      success: true, 
      newCookies: currentCookies - cost 
    };
  }

  buyUpgradeBatch(playerId, type, currentCookies, effects) {
    const config = UPGRADE_CONFIG[type];
    const upgrade = this.upgradeRepository.findByType(playerId, type);
    const currentLevel = upgrade ? upgrade.level : 0;
    
    const maxLevelCheck = this.canBuyUpgrade(currentCookies, currentLevel, config.maxLevel);
    if (!maxLevelCheck.success) {
      return { success: false, error: maxLevelCheck.error };
    }
    
    const nextMilestone = Math.ceil((currentLevel + 1) / 10) * 10;
    const targetLevel = config.maxLevel !== null ? Math.min(nextMilestone, config.maxLevel) : nextMilestone;
    const levelsToBuy = targetLevel - currentLevel;
    
    const totalCost = this.statsCalculator.calculateBatchCost(
      config.baseCost, 
      config.multiplier, 
      currentLevel, 
      levelsToBuy, 
      effects.hasDiscount
    );
    
    let actualLevelsToBuy = levelsToBuy;
    let actualCost = totalCost;
    
    if (currentCookies < totalCost) {
      actualLevelsToBuy = 0;
      actualCost = 0;
      let tempCost = 0;
      for (let i = 0; i < levelsToBuy; i++) {
        const levelCost = this.statsCalculator.calculateCost(
          config.baseCost, 
          config.multiplier, 
          currentLevel + i, 
          effects.hasDiscount
        );
        if (tempCost + levelCost <= currentCookies) {
          tempCost += levelCost;
          actualLevelsToBuy++;
        } else {
          break;
        }
      }
      actualCost = tempCost;
    }
    
    if (actualLevelsToBuy === 0) {
      return { success: false, error: 'Not enough cookies for any upgrade' };
    }
    
    for (let i = 0; i < actualLevelsToBuy; i++) {
      this.upgradeRepository.incrementLevel(playerId, type);
    }
    
    return { 
      success: true, 
      newCookies: currentCookies - actualCost 
    };
  }

  enhance(playerId, type, currentCookies) {
    const config = UPGRADE_CONFIG[type];
    
    if (!config.canEnhance) {
      return { success: false, error: 'This upgrade cannot be enhanced' };
    }
    
    const upgrade = this.upgradeRepository.findByType(playerId, type);
    
    if (!upgrade) {
      return { success: false, error: 'Upgrade not found' };
    }
    
    const enhancementCount = upgrade.enhancement_count || 0;
    const requiredLevel = (enhancementCount + 1) * 10;
    
    if (upgrade.level < requiredLevel) {
      return { success: false, error: 'Level not high enough for enhancement' };
    }
    
    const enhanceCost = this.statsCalculator.calculateEnhanceCost(
      config.baseCost, 
      config.multiplier, 
      upgrade.level
    );
    
    if (currentCookies < enhanceCost) {
      return { success: false, error: 'Not enough cookies' };
    }
    
    this.upgradeRepository.incrementEnhancementCount(playerId, type);
    
    return { 
      success: true, 
      newCookies: currentCookies - enhanceCost 
    };
  }

  specialEnhance(playerId, type, currentCookies, effects) {
    const config = UPGRADE_CONFIG[type];
    
    if (!config.canSpecialEnhance) {
      return { success: false, error: 'This upgrade cannot be special enhanced' };
    }
    
    const upgrade = this.upgradeRepository.findByType(playerId, type);
    
    if (!upgrade) {
      return { success: false, error: 'Upgrade not found' };
    }
    
    if (upgrade.level < config.maxLevel) {
      return { success: false, error: 'Maximum level not reached' };
    }
    
    if (upgrade.special_enhancement) {
      return { success: false, error: 'Already special enhanced' };
    }
    
    const hasDiscount = effects && effects.hasDiscount;
    const specialEnhanceCost = this.statsCalculator.calculateSpecialEnhanceCost(
      config.baseCost, 
      config.specialEnhanceMultiplier,
      hasDiscount
    );
    
    if (currentCookies < specialEnhanceCost) {
      return { success: false, error: 'Not enough cookies' };
    }
    
    this.upgradeRepository.setSpecialEnhancement(playerId, type);
    
    return { 
      success: true, 
      newCookies: currentCookies - specialEnhanceCost 
    };
  }
}

module.exports = UpgradeService;