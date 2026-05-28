import { UpgradeData } from '../lib/upgradeService'
import { SkillEffect } from '../config/skillEffects'
import { getUpgradeConfig, getMilestoneMultiplier } from '../config/upgrades'

export interface GameState {
  cookies: number
  cookiesPerClick: number
  cookiesPerSecond: number
  upgrades: Array<{
    type: string
    level: number
    cost: number
    batchCost: number
    cpsBonus: number
    clickBonus: number
    milestoneMultiplier: number
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

  // Calculate base CPS and click from upgrades with milestone multipliers
  for (const upgrade of upgrades) {
    const config = getUpgradeConfig(upgrade.upgradeType)
    if (!config || upgrade.level <= 0) continue

    const milestoneMult = getMilestoneMultiplier(upgrade.level)
    baseCps += config.cpsBonus * upgrade.level * milestoneMult
    baseClick += config.clickBonus * upgrade.level * milestoneMult
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
  batchCost: number
  cpsBonus: number
  clickBonus: number
  isMaxLevel: boolean
  milestoneMultiplier: number
  milestoneNextAt: number
}> {
  const upgradeTypes = Object.keys(require('../config/upgrades').UPGRADE_CONFIG)
  
  return upgradeTypes.map((type) => {
    const config = getUpgradeConfig(type)
    if (!config) {
      return {
        type,
        level: 0,
        cost: 0,
        batchCost: 0,
        cpsBonus: 0,
        clickBonus: 0,
        isMaxLevel: false,
        milestoneMultiplier: 1,
        milestoneNextAt: 50,
      }
    }

    const upgrade = upgrades.find((u) => u.upgradeType === type)
    const level = upgrade?.level || 0
    let cost = Math.floor(config.baseCost * Math.pow(config.multiplier, level))
    
    // Batch cost (10 upgrades)
    let batchCost = 0
    for (let i = 0; i < 10; i++) {
      batchCost += Math.floor(config.baseCost * Math.pow(config.multiplier, level + i))
    }

    // Apply cost discount from skills
    if (effects.costDiscount) {
      cost = Math.floor(cost * (1 - effects.costDiscount / 100))
      batchCost = Math.floor(batchCost * (1 - effects.costDiscount / 100))
    }

    const milestoneMult = getMilestoneMultiplier(level)
    const nextMilestoneLevel = (Math.floor(level / 50) + 1) * 50

    return {
      type,
      level,
      cost,
      batchCost,
      cpsBonus: config.cpsBonus,
      clickBonus: config.clickBonus,
      isMaxLevel: false,
      milestoneMultiplier: milestoneMult,
      milestoneNextAt: nextMilestoneLevel,
    }
  })
}
