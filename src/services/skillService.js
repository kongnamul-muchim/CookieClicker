const { SKILLS } = require('../config/skills');

class SkillService {
  constructor(skillRepository, prestigeCalculator) {
    this.skillRepository = skillRepository;
    this.prestigeCalculator = prestigeCalculator;
  }

  getSkillConfig(skillId) {
    return SKILLS.find(s => s.id === skillId);
  }

  getAllSkills() {
    return SKILLS;
  }

  getUnlockedSkills(playerId) {
    return this.skillRepository.getUnlockedSkills(playerId);
  }

  canUnlockSkill(playerId, skillId, currentStars) {
    const skill = this.getSkillConfig(skillId);
    
    if (!skill) {
      return { success: false, error: 'Skill not found' };
    }
    
    if (skill.autoUnlock) {
      return { success: true, autoUnlock: true };
    }
    
    if (currentStars < skill.cost) {
      return { success: false, error: 'Not enough stars' };
    }
    
    const unlockedSkillIds = this.getUnlockedSkills(playerId);
    
    if (unlockedSkillIds.includes(skillId)) {
      return { success: false, error: 'Already unlocked' };
    }
    
    if (skill.requires && skill.requires.length > 0) {
      const minRequired = skill.minRequired || skill.requires.length;
      const unlockedCount = skill.requires.filter(r => unlockedSkillIds.includes(r)).length;
      
      if (unlockedCount < minRequired) {
        return { success: false, error: 'Requirements not met' };
      }
    }
    
    return { success: true };
  }

  unlockSkill(playerId, skillId, currentStars) {
    const check = this.canUnlockSkill(playerId, skillId, currentStars);
    
    if (!check.success) {
      return check;
    }
    
    const skill = this.getSkillConfig(skillId);
    let newStars = currentStars;
    
    if (!skill.autoUnlock) {
      newStars = currentStars - skill.cost;
    }
    
    this.skillRepository.unlockSkill(playerId, skillId);
    
    return { success: true, newStars };
  }

  getSkillEffects(unlockedSkillIds) {
    const effects = {
      clickPercentBonus: 0,
      cpsPercentBonus: 0,
      costDiscount: 0,
      criticalChance: 0,
      criticalMultiplier: 3,
      interestRate: 0,
      autoClickRate: 0,
      luckBonus: 0,
      reinforceBonus: 0,
      startBonus: 0,
      specialReinforceDiscount: 0,
      allBonus: 0,
      starGainMultiplier: 1,
      burningClickStackBonus: 0,
      burningClickMaxStack: 10,
      lightningChance: 0,
      lightningMultiplier: 1,
      doubleChance: 0,
      doubleMultiplier: 2,
      randomMultiplierMin: 1,
      randomMultiplierMax: 1,
      criticalMultiplierBonus: 0,
      jackpotChance: 0,
      jackpotMultiplier: 1,
      timeBonusNight: 0,
      timeBonusDay: 0,
      burningUpgradeMaxStack: 10,
      burningUpgradeStackBonus: 0,
      randomSkillCopyChance: 0,
      activeBoostDuration: 0,
      activeBoostPercent: 0,
      activeBoostCooldown: 0,
      bonusChance: 0,
      bonusChancePercent: 0,
      buildingCpsBonus: 0,
      buildingCpsMaxBuildings: 0,
      featureUnlocked: [],
      cpsFlat: 0,
      criticalChanceBonus: 0,
      criticalChanceMax: false,
      burningMaxBonus: 0,
      hourlyBonus: 0,
      allChancesMax: false
    };
    
    for (const skillId of unlockedSkillIds) {
      const skill = this.getSkillConfig(skillId);
      if (!skill || !skill.effect) continue;
      
      const effect = skill.effect;
      
      switch (effect.type) {
        case 'click_percent':
          effects.clickPercentBonus += effect.value;
          break;
        case 'cps_percent':
          effects.cpsPercentBonus += effect.value;
          break;
        case 'cost_discount':
          effects.costDiscount += effect.value;
          break;
        case 'critical':
          effects.criticalChance += effect.chance;
          effects.criticalMultiplier *= effect.multiplier;
          break;
        case 'interest':
          effects.interestRate += effect.rate;
          break;
        case 'auto_click':
          effects.autoClickRate += effect.rate;
          break;
        case 'luck_bonus':
          effects.luckBonus += effect.value;
          break;
        case 'all_bonus':
          effects.allBonus += effect.value;
          break;
        case 'reinforce_bonus':
          effects.reinforceBonus += effect.value;
          break;
        case 'start_bonus':
          effects.startBonus += effect.cookies;
          break;
        case 'special_reinforce_discount':
          effects.specialReinforceDiscount += effect.value;
          break;
        case 'star_gain_multiplier':
          effects.starGainMultiplier *= (1 + effect.value / 100);
          break;
        case 'burning_click':
          effects.burningClickStackBonus += effect.stackBonus;
          effects.burningClickMaxStack = Math.max(effects.burningClickMaxStack, effect.maxStack);
          break;
        case 'lightning':
          effects.lightningChance += effect.chance;
          effects.lightningMultiplier = Math.max(effects.lightningMultiplier, effect.multiplier);
          break;
        case 'double_chance':
          effects.doubleChance += effect.chance;
          break;
        case 'random_multiplier':
          effects.randomMultiplierMax = Math.max(effects.randomMultiplierMax, effect.max);
          break;
        case 'critical_multiplier_bonus':
          effects.criticalMultiplierBonus += effect.value;
          break;
        case 'jackpot':
          effects.jackpotChance += effect.chance;
          effects.jackpotMultiplier = Math.max(effects.jackpotMultiplier, effect.multiplier);
          break;
        case 'time_bonus':
          if (effect.timeRange === 'night') {
            effects.timeBonusNight += effect.value;
          } else if (effect.timeRange === 'day') {
            effects.timeBonusDay += effect.value;
          }
          break;
        case 'burning_upgrade':
          effects.burningUpgradeMaxStack = Math.max(effects.burningUpgradeMaxStack, effect.maxStack);
          effects.burningUpgradeStackBonus += effect.stackBonus;
          break;
        case 'random_skill_copy':
          effects.randomSkillCopyChance += effect.chance;
          break;
        case 'active_boost':
          effects.activeBoostDuration += effect.duration;
          effects.activeBoostPercent += effect.bonus;
          effects.activeBoostCooldown = Math.max(effects.activeBoostCooldown, effect.cooldown);
          break;
        case 'bonus_chance':
          effects.bonusChance += effect.chance;
          effects.bonusChancePercent += effect.bonus;
          break;
        case 'building_cps_bonus':
          effects.buildingCpsBonus += effect.perBuilding;
          effects.buildingCpsMaxBuildings = Math.max(effects.buildingCpsMaxBuildings, effect.maxBuildings);
          break;
        case 'feature_unlock':
          if (!effects.featureUnlocked.includes(effect.feature)) {
            effects.featureUnlocked.push(effect.feature);
          }
          break;
        case 'cps_flat':
          effects.cpsFlat += effect.value;
          break;
        case 'critical_chance_bonus':
          effects.criticalChanceBonus += effect.value;
          break;
        case 'critical_chance_max':
          effects.criticalChanceMax = true;
          break;
        case 'burning_max_bonus':
          effects.burningMaxBonus += effect.value;
          break;
        case 'hourly_bonus':
          effects.hourlyBonus += effect.value;
          break;
        case 'all_chances_max':
          effects.allChancesMax = true;
          break;
      }
    }
    
    return effects;
  }
}

module.exports = SkillService;