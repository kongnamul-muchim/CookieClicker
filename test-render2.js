const farmUpgrade = {
  type: 'farm',
  level: 100,
  cost: 1162570315,
  enhancementCount: 9,
  canEnhance: false,
  canSpecialEnhance: true,
  isMaxLevel: true,
  maxLevel: 100,
  specialEffect: 'auto_crit_5pct_5x',
  specialEnhanceCost: 2970000,
  specialEnhancement: 0
};

const cookies = 29042963065;

const specialEnhanceCost = farmUpgrade.specialEnhanceCost || 0;
const canAffordSpecial = farmUpgrade.canSpecialEnhance && specialEnhanceCost > 0 && cookies >= specialEnhanceCost;

console.log('=== Simulation ===');
console.log('specialEnhanceCost:', specialEnhanceCost);
console.log('canAffordSpecial:', canAffordSpecial);
console.log('cookies:', cookies);
console.log('cookies >= specialEnhanceCost:', cookies >= specialEnhanceCost);

// updateUpgrades가 찾을 버튼
console.log('\n=== Button that updateUpgrades finds ===');
console.log('data-action="special-enhance" button should exist');
console.log('Button disabled should be:', !canAffordSpecial);

// renderUpgrades 로직
console.log('\n=== renderUpgrades logic ===');
if (farmUpgrade.canSpecialEnhance) {
  console.log('Button created: ★특별강화★');
  console.log('className: buy-button special-enhance-button');
  console.log('disabled:', !canAffordSpecial);
} else if (farmUpgrade.isMaxLevel) {
  console.log('Button created: 만렙');
  console.log('className: buy-button max-level');
}