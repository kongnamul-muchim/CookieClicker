const express = require('express');
const router = express.Router();
const {
  saveDB,
  updatePlayerById,
  getPlayerUpgrades,
  getUpgradeByType,
  incrementUpgradeLevel,
  incrementEnhancementCount,
  doSpecialEnhancement,
  resetAllUpgrades,
  upgradeTypes
} = require('../database/init');

const upgradeConfig = {
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
    specialEffect: 'click_crit_5pct_5x'
  },
  grandma: { 
    baseCost: 100, 
    multiplier: 1.15, 
    cpsBonus: 1, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'production_1_2x'
  },
  farm: { 
    baseCost: 1100, 
    multiplier: 1.15, 
    cpsBonus: 8, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'auto_crit_5pct_5x'
  },
  mine: { 
    baseCost: 12000, 
    multiplier: 1.15, 
    cpsBonus: 47, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'crit_chance_15pct'
  },
  factory: { 
    baseCost: 130000, 
    multiplier: 1.15, 
    cpsBonus: 260, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'cost_10pct_discount'
  },
  bank: { 
    baseCost: 1400000, 
    multiplier: 1.15, 
    cpsBonus: 1400, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'interest_0_1pct'
  },
  temple: { 
    baseCost: 20000000, 
    multiplier: 1.15, 
    cpsBonus: 7800, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'production_1_5x'
  },
  wizard_tower: { 
    baseCost: 330000000, 
    multiplier: 1.15, 
    cpsBonus: 44000, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'click_cps_1pct'
  },
  portal: { 
    baseCost: 1000000000, 
    multiplier: 1.15, 
    cpsBonus: 260000, 
    clickBonus: 0, 
    maxLevel: 100,
    canEnhance: true,
    canSpecialEnhance: true,
    specialEffect: 'production_2x'
  }
};

function calculateCost(baseCost, multiplier, level, hasDiscount) {
  let cost = Math.floor(baseCost * Math.pow(multiplier, level));
  if (hasDiscount) {
    cost = Math.floor(cost * 0.9);
  }
  return cost;
}

function calculateEnhanceCost(baseCost, multiplier, level) {
  const nextLevelCost = Math.floor(baseCost * Math.pow(multiplier, level));
  return nextLevelCost * 5;
}

function getActiveEffects(upgrades) {
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
    const config = upgradeConfig[upgrade.upgrade_type];
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

function calculateStats(playerId, playerCookies) {
  const upgrades = getPlayerUpgrades(playerId);
  const effects = getActiveEffects(upgrades);
  
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
    const config = upgradeConfig[upgrade.upgrade_type];
    if (config) {
      const enhancementMultiplier = Math.pow(2, upgrade.enhancement_count || 0);
      cookiesPerClick += config.clickBonus * upgrade.level * enhancementMultiplier * (upgrade.upgrade_type === 'click_boost' ? clickBoostMultiplier : 1);
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

function buildGameState(player) {
  const upgrades = getPlayerUpgrades(player.id);
  const effects = getActiveEffects(upgrades);
  
  const upgradeList = upgradeTypes.map(type => {
    const upgrade = upgrades.find(u => u.upgrade_type === type) || { level: 0, enhancement_count: 0, special_enhancement: 0 };
    const config = upgradeConfig[type];
    const cost = calculateCost(config.baseCost, config.multiplier, upgrade.level, effects.hasDiscount);
    const enhancementCount = upgrade.enhancement_count || 0;
    const canEnhance = config.canEnhance && upgrade.level >= (enhancementCount + 1) * 10;
    const enhanceCost = calculateEnhanceCost(config.baseCost, config.multiplier, upgrade.level);
    const isMaxLevel = config.maxLevel !== null && upgrade.level >= config.maxLevel;
    const specialEnhancement = upgrade.special_enhancement || 0;
    const canSpecialEnhance = config.canSpecialEnhance && isMaxLevel && !specialEnhancement;
    
    const nextMilestone = Math.ceil((upgrade.level + 1) / 10) * 10;
    const targetLevel = config.maxLevel !== null ? Math.min(nextMilestone, config.maxLevel) : nextMilestone;
    const levelsToBuy = targetLevel - upgrade.level;
    
    let batchCost = 0;
    for (let i = 0; i < levelsToBuy; i++) {
      batchCost += calculateCost(config.baseCost, config.multiplier, upgrade.level + i, effects.hasDiscount);
    }
    
    return {
      type,
      level: upgrade.level,
      cost,
      enhancementCount,
      canEnhance,
      enhanceCost,
      isMaxLevel,
      maxLevel: config.maxLevel,
      specialEffect: config.specialEffect,
      canSpecialEnhance,
      specialEnhancement,
      batchCost,
      levelsToBuy
    };
  });

  const { cookiesPerClick, cookiesPerSecond, clickBoostMultiplier } = calculateStats(player.id, player.cookies);

  return {
    cookies: player.cookies,
    cookiesPerClick,
    cookiesPerSecond,
    upgrades: upgradeList,
    effects,
    clickBoostMultiplier
  };
}

router.get('/game', (req, res) => {
  res.json(buildGameState(req.player));
});

router.post('/click', (req, res) => {
  const player = req.player;
  const { cookiesPerClick, effects } = calculateStats(player.id, player.cookies);
  
  let earned = cookiesPerClick;
  
  if (effects.clickCpsBonus) {
    earned += Math.floor(cookiesPerSecond * 0.01);
  }
  
  const newCookies = player.cookies + earned;
  
  updatePlayerById(player.id, { cookies: newCookies });
  
  res.json({ 
    cookies: newCookies, 
    earned,
    clickCritChance: effects.clickCritChance,
    clickCritMultiplier: effects.clickCritMultiplier
  });
});

router.post('/upgrade/:type', (req, res) => {
  const { type } = req.params;
  const player = req.player;

  if (!upgradeTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid upgrade type' });
  }

  const config = upgradeConfig[type];
  const upgrades = getPlayerUpgrades(player.id);
  const effects = getActiveEffects(upgrades);
  
  const currentUpgrade = getUpgradeByType(player.id, type);
  const currentLevel = currentUpgrade ? currentUpgrade.level : 0;
  
  if (config.maxLevel !== null && currentLevel >= config.maxLevel) {
    return res.status(400).json({ error: 'Maximum level reached' });
  }
  
  const cost = calculateCost(config.baseCost, config.multiplier, currentLevel, effects.hasDiscount);

  if (player.cookies < cost) {
    return res.status(400).json({ error: 'Not enough cookies' });
  }

  const newCookies = player.cookies - cost;
  incrementUpgradeLevel(player.id, type);

  updatePlayerById(player.id, { cookies: newCookies });

  const updatedPlayer = { ...player, cookies: newCookies };
  res.json(buildGameState(updatedPlayer));
});

router.post('/upgrade-batch/:type', (req, res) => {
  const { type } = req.params;
  const player = req.player;

  if (!upgradeTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid upgrade type' });
  }

  const config = upgradeConfig[type];
  const upgrades = getPlayerUpgrades(player.id);
  const effects = getActiveEffects(upgrades);
  
  const currentUpgrade = getUpgradeByType(player.id, type);
  const currentLevel = currentUpgrade ? currentUpgrade.level : 0;
  
  if (config.maxLevel !== null && currentLevel >= config.maxLevel) {
    return res.status(400).json({ error: 'Maximum level reached' });
  }
  
  const nextMilestone = Math.ceil((currentLevel + 1) / 10) * 10;
  const targetLevel = config.maxLevel !== null ? Math.min(nextMilestone, config.maxLevel) : nextMilestone;
  const levelsToBuy = targetLevel - currentLevel;
  
  let totalCost = 0;
  for (let i = 0; i < levelsToBuy; i++) {
    totalCost += calculateCost(config.baseCost, config.multiplier, currentLevel + i, effects.hasDiscount);
  }
  
  let actualLevelsToBuy = levelsToBuy;
  let actualCost = totalCost;
  
  if (player.cookies < totalCost) {
    actualLevelsToBuy = 0;
    actualCost = 0;
    let tempCost = 0;
    for (let i = 0; i < levelsToBuy; i++) {
      const levelCost = calculateCost(config.baseCost, config.multiplier, currentLevel + i, effects.hasDiscount);
      if (tempCost + levelCost <= player.cookies) {
        tempCost += levelCost;
        actualLevelsToBuy++;
      } else {
        break;
      }
    }
    actualCost = tempCost;
  }
  
  if (actualLevelsToBuy === 0) {
    return res.status(400).json({ error: 'Not enough cookies for any upgrade' });
  }
  
  const newCookies = player.cookies - actualCost;
  
  for (let i = 0; i < actualLevelsToBuy; i++) {
    incrementUpgradeLevel(player.id, type);
  }
  
  updatePlayerById(player.id, { cookies: newCookies });
  
  const updatedPlayer = { ...player, cookies: newCookies };
  res.json(buildGameState(updatedPlayer));
});

router.post('/enhance/:type', (req, res) => {
  const { type } = req.params;
  const player = req.player;

  if (!upgradeTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid upgrade type' });
  }

  const config = upgradeConfig[type];
  
  if (!config.canEnhance) {
    return res.status(400).json({ error: 'This upgrade cannot be enhanced' });
  }

  const currentUpgrade = getUpgradeByType(player.id, type);
  
  if (!currentUpgrade) {
    return res.status(400).json({ error: 'Upgrade not found' });
  }

  const enhancementCount = currentUpgrade.enhancement_count || 0;
  const requiredLevel = (enhancementCount + 1) * 10;
  
  if (currentUpgrade.level < requiredLevel) {
    return res.status(400).json({ error: 'Level not high enough for enhancement' });
  }

  const enhanceCost = calculateEnhanceCost(config.baseCost, config.multiplier, currentUpgrade.level);

  if (player.cookies < enhanceCost) {
    return res.status(400).json({ error: 'Not enough cookies' });
  }

  const newCookies = player.cookies - enhanceCost;
  incrementEnhancementCount(player.id, type);

  updatePlayerById(player.id, { cookies: newCookies });

  const updatedPlayer = { ...player, cookies: newCookies };
  res.json(buildGameState(updatedPlayer));
});

router.post('/special-enhance/:type', (req, res) => {
  const { type } = req.params;
  const player = req.player;

  if (!upgradeTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid upgrade type' });
  }

  const config = upgradeConfig[type];
  
  if (!config.canSpecialEnhance) {
    return res.status(400).json({ error: 'This upgrade cannot be special enhanced' });
  }

  const currentUpgrade = getUpgradeByType(player.id, type);
  
  if (!currentUpgrade) {
    return res.status(400).json({ error: 'Upgrade not found' });
  }

  if (currentUpgrade.level < config.maxLevel) {
    return res.status(400).json({ error: 'Maximum level not reached' });
  }

  if (currentUpgrade.special_enhancement) {
    return res.status(400).json({ error: 'Already special enhanced' });
  }

  const specialEnhanceCost = calculateEnhanceCost(config.baseCost, config.multiplier, currentUpgrade.level);

  if (player.cookies < specialEnhanceCost) {
    return res.status(400).json({ error: 'Not enough cookies' });
  }

  const newCookies = player.cookies - specialEnhanceCost;
  doSpecialEnhancement(player.id, type);

  updatePlayerById(player.id, { cookies: newCookies });

  const updatedPlayer = { ...player, cookies: newCookies };
  res.json(buildGameState(updatedPlayer));
});

router.post('/game/reset', (req, res) => {
  const player = req.player;

  updatePlayerById(player.id, {
    cookies: 0,
    cookies_per_click: 1,
    cookies_per_second: 0
  });

  resetAllUpgrades(player.id);

  const updatedPlayer = {
    ...player,
    cookies: 0,
    cookies_per_click: 1,
    cookies_per_second: 0
  };

  res.json(buildGameState(updatedPlayer));
});

router.post('/sync', (req, res) => {
  const { cookies } = req.body;
  const player = req.player;

  if (typeof cookies !== 'number') {
    return res.status(400).json({ error: 'Invalid cookies value' });
  }

  updatePlayerById(player.id, { cookies });

  res.json({ cookies });
});

router.get('/player', (req, res) => {
  res.json(req.player);
});

module.exports = router;