const UPGRADE_CONFIG = {
  click_boost: { 
    baseCost: 10, 
    multiplier: 1.15, 
    cpsBonus: 0, 
    clickBonus: 2, 
    maxLevel: null,
    canEnhance: true,
    canSpecialEnhance: false,
    specialEffect: null
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
    specialEnhanceMultiplier: 10000
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
    specialEnhanceMultiplier: 5000
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
    specialEnhanceMultiplier: 3000
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
    specialEnhanceMultiplier: 2000
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
    specialEnhanceMultiplier: 1500
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
    specialEnhanceMultiplier: 1000
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
    specialEnhanceMultiplier: 800
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
    specialEnhanceMultiplier: 500
  },
  portal: { 
    baseCost: 1000000000, 
    multiplier: 1.15, 
    cpsBonus: 5000000, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'production_2x',
    specialEnhanceMultiplier: 300
  }
};

const UPGRADE_TYPES = Object.keys(UPGRADE_CONFIG);

const UPGRADE_NAMES = {
  click_boost: '클릭 강화',
  cursor: '커서',
  grandma: '할머니',
  farm: '농장',
  mine: '광산',
  factory: '공장',
  bank: '은행',
  temple: '사원',
  wizard_tower: '마법사 탑',
  portal: '포털'
};

const UPGRADE_DESCRIPTIONS = {
  click_boost: '클릭당 +2 쿠키',
  cursor: '초당 +0.1 쿠키',
  grandma: '초당 +1 쿠키',
  farm: '초당 +15 쿠키',
  mine: '초당 +150 쿠키',
  factory: '초당 +1,200 쿠키',
  bank: '초당 +12,000 쿠키',
  temple: '초당 +100,000 쿠키',
  wizard_tower: '초당 +800,000 쿠키',
  portal: '초당 +5,000,000 쿠키'
};

const SPECIAL_EFFECT_DESCRIPTIONS = {
  click_crit_5pct_5x: '만렙: 클릭 크리티컬 5%, 5배',
  auto_crit_5pct_5x: '만렙: 자동 생산 크리티컬 5%, 5배',
  crit_chance_15pct: '만렙: 크리티컬 확률 +15%',
  production_1_2x: '만렙: 모든 생산량 1.2배',
  production_1_5x: '만렙: 모든 생산량 1.5배',
  production_2x: '만렙: 모든 생산량 2배',
  cost_10pct_discount: '만렙: 비용 10% 할인',
  interest_0_1pct: '만렙: 쿠키의 0.1% 매초 획득',
  click_cps_1pct: '만렙: 클릭당 초당 쿠키의 1% 추가'
};

module.exports = {
  UPGRADE_CONFIG,
  UPGRADE_TYPES,
  UPGRADE_NAMES,
  UPGRADE_DESCRIPTIONS,
  SPECIAL_EFFECT_DESCRIPTIONS
};