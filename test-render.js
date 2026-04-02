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

console.log('=== Farm Upgrade Test ===');
console.log('canSpecialEnhance:', farmUpgrade.canSpecialEnhance);
console.log('isMaxLevel:', farmUpgrade.isMaxLevel);
console.log('specialEnhancement:', farmUpgrade.specialEnhancement);

if (farmUpgrade.canSpecialEnhance) {
  console.log('Expected button: ★특별강화★');
} else if (farmUpgrade.isMaxLevel) {
  console.log('Expected button: 만렙');
} else {
  console.log('Expected button: other');
}