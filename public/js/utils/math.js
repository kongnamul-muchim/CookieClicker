export function calculateProgress(current, target) {
  if (target === 0) return 0;
  const progress = (current / target) * 100;
  return Math.min(100, Math.max(0, progress));
}

export function calculateCost(baseCost, multiplier, level, discount = false) {
  let cost = baseCost * Math.pow(multiplier, level);
  if (discount) cost *= 0.9;
  return Math.floor(cost);
}

export function calculateBatchCost(baseCost, multiplier, currentLevel, count, discount = false) {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += calculateCost(baseCost, multiplier, currentLevel + i, discount);
  }
  return total;
}