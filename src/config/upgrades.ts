export interface UpgradeConfig {
  baseCost: number
  multiplier: number
  cpsBonus: number
  clickBonus: number
  maxLevel: number | null
}

export const UPGRADE_CONFIG: Record<string, UpgradeConfig> = {
  click_boost: { 
    baseCost: 15, 
    multiplier: 1.15, 
    cpsBonus: 0, 
    clickBonus: 1, 
    maxLevel: null,
  },
  cursor: { 
    baseCost: 15, 
    multiplier: 1.15, 
    cpsBonus: 0.1, 
    clickBonus: 0, 
    maxLevel: null,
  },
  grandma: { 
    baseCost: 100, 
    multiplier: 1.15, 
    cpsBonus: 1, 
    clickBonus: 0, 
    maxLevel: null,
  },
  farm: { 
    baseCost: 700, 
    multiplier: 1.15, 
    cpsBonus: 8, 
    clickBonus: 0, 
    maxLevel: null,
  },
  mine: { 
    baseCost: 6000, 
    multiplier: 1.15, 
    cpsBonus: 47, 
    clickBonus: 0, 
    maxLevel: null,
  },
  factory: { 
    baseCost: 50000, 
    multiplier: 1.15, 
    cpsBonus: 260, 
    clickBonus: 0, 
    maxLevel: null,
  },
  bank: { 
    baseCost: 500000, 
    multiplier: 1.15, 
    cpsBonus: 1400, 
    clickBonus: 0, 
    maxLevel: null,
  },
  temple: { 
    baseCost: 5000000, 
    multiplier: 1.15, 
    cpsBonus: 7800, 
    clickBonus: 0, 
    maxLevel: null,
  },
  wizard_tower: { 
    baseCost: 50000000, 
    multiplier: 1.15, 
    cpsBonus: 44000, 
    clickBonus: 0, 
    maxLevel: null,
  },
  portal: { 
    baseCost: 500000000, 
    multiplier: 1.15, 
    cpsBonus: 260000, 
    clickBonus: 0, 
    maxLevel: null,
  },
}

export function getUpgradeConfig(type: string): UpgradeConfig | null {
  return UPGRADE_CONFIG[type] || null
}

export function calculateUpgradeCost(baseCost: number, level: number): number {
  return Math.floor(baseCost * Math.pow(1.15, level))
}

export function getAllUpgradeTypes(): string[] {
  return Object.keys(UPGRADE_CONFIG)
}

/**
 * Milestone multiplier for a building.
 * Every 50 levels → ×2 production for that building type.
 */
export function getMilestoneMultiplier(level: number): number {
  return Math.pow(2, Math.floor(level / 50))
}
