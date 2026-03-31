const { UPGRADE_CONFIG } = require('../config/upgrades');

class StatsCalculator {
  calculateCost(baseCost, multiplier, level, hasDiscount = false) {
    let cost = Math.floor(baseCost * Math.pow(multiplier, level));
    if (hasDiscount) {
      cost = Math.floor(cost * 0.9);
    }
    return cost;
  }

  calculateEnhanceCost(baseCost, multiplier, level) {
    const nextLevelCost = this.calculateCost(baseCost, multiplier, level);
    return nextLevelCost * 5;
  }

  calculateSpecialEnhanceCost(baseCost, specialEnhanceMultiplier, hasDiscount = false) {
    let cost = Math.floor(baseCost * specialEnhanceMultiplier);
    if (hasDiscount) {
      cost = Math.floor(cost * 0.9);
    }
    return cost;
  }

  getActiveEffects(upgrades) {
    const effects = {
      clickCritChance: 0,
      clickCritMultiplier: 1,
      autoCritChance: 0,
      autoCritMultiplier: 1,
      productionMultiplier: 1,
      hasDiscount: false,
      interestRate: 0,
      clickCpsBonus: false
    };
    
    for (const upgrade of upgrades) {
      const config = UPGRADE_CONFIG[upgrade.upgrade_type];
      if (!config || !config.specialEffect) continue;
      
      if (upgrade.level >= config.maxLevel) {
        switch (config.specialEffect) {
          case 'click_crit_5pct_5x':
            effects.clickCritChance += 0.05;
            effects.clickCritMultiplier = 5;
            break;
          case 'auto_crit_5pct_5x':
            effects.autoCritChance += 0.05;
            effects.autoCritMultiplier = 5;
            break;
          case 'crit_chance_15pct':
            effects.clickCritChance += 0.15;
            effects.autoCritChance += 0.15;
            break;
          case 'production_1_2x':
            effects.productionMultiplier *= 1.2;
            break;
          case 'production_1_5x':
            effects.productionMultiplier *= 1.5;
            break;
          case 'production_2x':
            effects.productionMultiplier *= 2;
            break;
          case 'cost_10pct_discount':
            effects.hasDiscount = true;
            break;
          case 'interest_0_1pct':
            effects.interestRate += 0.001;
            break;
          case 'click_cps_1pct':
            effects.clickCpsBonus = true;
            break;
        }
      }
    }
    
    return effects;
  }

  calculateStats(upgrades, playerCookies) {
    const effects = this.getActiveEffects(upgrades);
    
    let cookiesPerClick = 1;
    let cookiesPerSecond = 0;
    
    let specialEnhanceCount = 0;
    for (const upgrade of upgrades) {
      if (upgrade.special_enhancement) {
        specialEnhanceCount++;
      }
    }
    const clickBoostMultiplier = Math.pow(2, specialEnhanceCount);

    for (const upgrade of upgrades) {
      const config = UPGRADE_CONFIG[upgrade.upgrade_type];
      if (config) {
        const enhancementMultiplier = Math.pow(2, upgrade.enhancement_count || 0);
        const isClickBoost = upgrade.upgrade_type === 'click_boost';
        cookiesPerClick += config.clickBonus * upgrade.level * enhancementMultiplier * (isClickBoost ? clickBoostMultiplier : 1);
        cookiesPerSecond += config.cpsBonus * upgrade.level * enhancementMultiplier;
      }
    }
    
    cookiesPerSecond *= effects.productionMultiplier;
    
    if (effects.interestRate > 0 && playerCookies) {
      cookiesPerSecond += playerCookies * effects.interestRate;
    }

    return { 
      cookiesPerClick, 
      cookiesPerSecond, 
      effects,
      clickBoostMultiplier
    };
  }

  calculateStatsWithSkills(upgrades, playerCookies, skillEffects) {
    const baseStats = this.calculateStats(upgrades, playerCookies);
    
    let cookiesPerClick = baseStats.cookiesPerClick;
    let cookiesPerSecond = baseStats.cookiesPerSecond;
    
    const clickBonusSum = (skillEffects.clickPercentBonus || 0) + (skillEffects.allBonus || 0);
    cookiesPerClick *= (1 + clickBonusSum / 100);
    
    const cpsBonusSum = (skillEffects.cpsPercentBonus || 0) + (skillEffects.allBonus || 0);
    cookiesPerSecond *= (1 + cpsBonusSum / 100);
    
    if (skillEffects.cpsFlat) {
      cookiesPerSecond += skillEffects.cpsFlat;
    }
    
    if (skillEffects.interestRate > 0 && playerCookies) {
      const interestGain = playerCookies * (skillEffects.interestRate / 100);
      const cappedInterest = Math.min(interestGain, cookiesPerSecond * 0.1);
      cookiesPerSecond += cappedInterest;
    }
    
    if (skillEffects.buildingCpsBonus > 0) {
      let totalBuildings = 0;
      for (const upgrade of upgrades) {
        if (upgrade.upgrade_type !== 'click_boost') {
          totalBuildings += upgrade.level || 0;
        }
      }
      cookiesPerSecond *= (1 + (totalBuildings * skillEffects.buildingCpsBonus) / 100);
    }
    
    const mergedEffects = {
      ...baseStats.effects,
      skillCriticalChance: skillEffects.criticalChance,
      skillCriticalMultiplier: skillEffects.criticalMultiplier,
      autoClickRate: skillEffects.autoClickRate,
      luckBonus: skillEffects.luckBonus,
      allBonus: skillEffects.allBonus,
      costDiscount: skillEffects.costDiscount,
      doubleChance: skillEffects.doubleChance,
      lightningChance: skillEffects.lightningChance,
      lightningMultiplier: skillEffects.lightningMultiplier || 10,
      jackpotChance: skillEffects.jackpotChance,
      jackpotMultiplier: skillEffects.jackpotMultiplier || 100,
      allChancesMax: skillEffects.allChancesMax
    };
    
    const hasDiscount = baseStats.effects.hasDiscount || (skillEffects.costDiscount || 0) > 0;
    const discountPercent = (baseStats.effects.hasDiscount ? 10 : 0) + (skillEffects.costDiscount || 0);
    
    return {
      cookiesPerClick,
      cookiesPerSecond,
      effects: mergedEffects,
      clickBoostMultiplier: baseStats.clickBoostMultiplier,
      hasDiscount,
      discountPercent
    };
  }

  calculateBatchCost(baseCost, multiplier, currentLevel, levelsToBuy, hasDiscount = false) {
    let totalCost = 0;
    for (let i = 0; i < levelsToBuy; i++) {
      totalCost += this.calculateCost(baseCost, multiplier, currentLevel + i, hasDiscount);
    }
    return totalCost;
  }
}

module.exports = StatsCalculator;