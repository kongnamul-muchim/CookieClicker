export interface UpgradeConfig {
  baseCost: number
  multiplier: number
  cpsBonus: number
  clickBonus: number
  maxLevel: number | null
  canEnhance: boolean
  canSpecialEnhance: boolean
  specialEffect?: string
  specialEnhanceMultiplier?: number
}

export const UPGRADE_CONFIG: Record<string, UpgradeConfig> = {
  click_boost: { 
    baseCost: 10, 
    multiplier: 1.15, 
    cpsBonus: 0, 
    clickBonus: 2, 
    maxLevel: null,
    canEnhance: true,
    canSpecialEnhance: false,
  },
  cursor: { 
    baseCost: 15, 
    multiplier: 1.15, 
    cpsBonus: 0.1, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'click_crit_5pct_5x',
    specialEnhanceMultiplier: 10000,
  },
  grandma: { 
    baseCost: 100, 
    multiplier: 1.15, 
    cpsBonus: 1, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'production_1_2x',
    specialEnhanceMultiplier: 5000,
  },
  farm: { 
    baseCost: 1100, 
    multiplier: 1.15, 
    cpsBonus: 15, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'auto_crit_5pct_5x',
    specialEnhanceMultiplier: 3000,
  },
  mine: { 
    baseCost: 12000, 
    multiplier: 1.15, 
    cpsBonus: 150, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'crit_chance_15pct',
    specialEnhanceMultiplier: 2000,
  },
  factory: { 
    baseCost: 130000, 
    multiplier: 1.15, 
    cpsBonus: 1200, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'cost_10pct_discount',
    specialEnhanceMultiplier: 1500,
  },
  bank: { 
    baseCost: 1400000, 
    multiplier: 1.15, 
    cpsBonus: 12000, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'interest_0_1pct',
    specialEnhanceMultiplier: 1000,
  },
  temple: { 
    baseCost: 20000000, 
    multiplier: 1.15, 
    cpsBonus: 100000, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'production_1_5x',
    specialEnhanceMultiplier: 800,
  },
  wizard_tower: { 
    baseCost: 330000000, 
    multiplier: 1.15, 
    cpsBonus: 800000, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'click_cps_1pct',
    specialEnhanceMultiplier: 500,
  },
  portal: { 
    baseCost: 5100000000, 
    multiplier: 1.15, 
    cpsBonus: 10000000, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'portal_passive_10pct',
    specialEnhanceMultiplier: 400,
  },
}

export function getUpgradeConfig(type: string): UpgradeConfig | null {
  return UPGRADE_CONFIG[type] || null
}

export function calculateUpgradeCost(baseCost: number, level: number): number {
  return Math.floor(baseCost * Math.pow(1.15, level))
}

export function calculateEnhancementCost(baseCost: number): number {
  return baseCost * 100
}

export function calculateSpecialEnhancementCost(baseCost: number): number {
  return baseCost * 1000
}

export function getAllUpgradeTypes(): string[] {
  return Object.keys(UPGRADE_CONFIG)
}
