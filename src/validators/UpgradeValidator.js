const { ValidationError, InsufficientFundsError, MaxLevelReachedError, AlreadyEnhancedError } = require('../errors');

class UpgradeValidator {
  validateBuy(upgrade, config, cookies) {
    if (!upgrade || upgrade.level === undefined) {
      return { valid: false, error: new ValidationError('Upgrade not found') };
    }
    
    if (config.maxLevel !== null && upgrade.level >= config.maxLevel) {
      return { valid: false, error: new MaxLevelReachedError(config.type || 'Upgrade') };
    }
    
    return { valid: true };
  }

  validateEnhance(upgrade, config, cookies, enhanceCost) {
    if (!config.canEnhance) {
      return { valid: false, error: new ValidationError('This upgrade cannot be enhanced') };
    }
    
    if (!upgrade) {
      return { valid: false, error: new ValidationError('Upgrade not found') };
    }
    
    const requiredLevel = (upgrade.enhancementCount + 1) * 10;
    if (upgrade.level < requiredLevel) {
      return { valid: false, error: new ValidationError(`Level ${requiredLevel} required for enhancement`) };
    }
    
    if (cookies < enhanceCost) {
      return { valid: false, error: new InsufficientFundsError(enhanceCost, cookies) };
    }
    
    return { valid: true };
  }

  validateTranscend(upgrade, config, cookies, cost) {
    if (!config.canSpecialEnhance) {
      return { valid: false, error: new ValidationError('This upgrade cannot be transcended') };
    }
    
    if (!upgrade) {
      return { valid: false, error: new ValidationError('Upgrade not found') };
    }
    
    if (upgrade.level < config.maxLevel) {
      return { valid: false, error: new ValidationError('Maximum level not reached') };
    }
    
    if (upgrade.specialEnhancement) {
      return { valid: false, error: new AlreadyEnhancedError(config.type || 'Upgrade') };
    }
    
    if (cookies < cost) {
      return { valid: false, error: new InsufficientFundsError(cost, cookies) };
    }
    
    return { valid: true };
  }
}

module.exports = UpgradeValidator;