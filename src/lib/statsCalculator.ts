import { UpgradeData } from '../lib/upgradeService'
import { SkillEffect } from '../config/skillEffects'
import { getUpgradeConfig } from '../config/upgrades'

export interface GameState {
  cookies: number
  cookiesPerClick: number
  cookiesPerSecond: number
  upgrades: Array<{
    type: string
    level: number
    cost: number
    cpsBonus: number
    canEnhance: boolean
    canSpecialEnhance: boolean
    enhancementCount: number
    specialEnhancement: number
  }>
  effects: SkillEffect
  clickBoostMultiplier: number
  prestigeCount: number
  prestigeStars: number
}

export function calculateStats(
  upgrades: UpgradeData[],
  cookies: number,
  skillEffects: SkillEffect = {}
): {
  cookiesPerClick: number
  cookiesPerSecond: number
  effects: SkillEffect
  clickBoostMultiplier: number
} {
  let baseCps = 0
  let baseClick = 1

  // Calculate base CPS and click from upgrades
  for (const upgrade of upgrades) {
    const config = getUpgradeConfig(upgrade.upgradeType)
    if (!config) continue

    baseCps += config.cpsBonus * upgrade.level
    baseClick += config.clickBonus * upgrade.level
  }

  // Apply skill effects
  let cookiesPerSecond = baseCps
  let cookiesPerClick = baseClick

  if (skillEffects.cpsPercent) {
    cookiesPerSecond *= 1 + skillEffects.cpsPercent / 100
  }

  if (skillEffects.clickPercent) {
    cookiesPerClick *= 1 + skillEffects.clickPercent / 100
  }

  // Interest effect
  if (skillEffects.interestRate && cookies > 0) {
    cookiesPerSecond += cookies * (skillEffects.interestRate / 100)
  }

  const clickBoostMultiplier = 1

  return {
    cookiesPerClick: Math.floor(cookiesPerClick),
    cookiesPerSecond,
    effects: skillEffects,
    clickBoostMultiplier,
  }
}

export function calculateStatsWithSkills(
  upgrades: UpgradeData[],
  cookies: number,
  skillEffects: SkillEffect = {}
): {
  cookiesPerClick: number
  cookiesPerSecond: number
  effects: SkillEffect
  clickBoostMultiplier: number
} {
  return calculateStats(upgrades, cookies, skillEffects)
}

export function buildUpgradeState(
  upgrades: UpgradeData[],
  effects: SkillEffect
): Array<{
  type: string
  level: number
  cost: number
  cpsBonus: number
  canEnhance: boolean
  canSpecialEnhance: boolean
  enhancementCount: number
  specialEnhancement: number
}> {
  const upgradeTypes = Object.keys(require('../config/upgrades').UPGRADE_CONFIG)
  
  return upgradeTypes.map((type) => {
    const config = getUpgradeConfig(type)
    if (!config) {
      return {
        type,
        level: 0,
        cost: 0,
        cpsBonus: 0,
        canEnhance: false,
        canSpecialEnhance: false,
        enhancementCount: 0,
        specialEnhancement: 0,
      }
    }

    const upgrade = upgrades.find((u) => u.upgradeType === type)
    const level = upgrade?.level || 0
    let cost = Math.floor(config.baseCost * Math.pow(config.multiplier, level))

    // Apply cost discount
    if (effects.costDiscount) {
      cost = Math.floor(cost * (1 - effects.costDiscount / 100))
    }

    return {
      type,
      level,
      cost,
      cpsBonus: config.cpsBonus,
      canEnhance: config.canEnhance,
      canSpecialEnhance: config.canSpecialEnhance,
      enhancementCount: upgrade?.enhancementCount || 0,
      specialEnhancement: upgrade?.specialEnhancement || 0,
    }
  })
}
