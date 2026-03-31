const { ValidationError } = require('../errors');

class PrestigeValidator {
  validate(totalEnhancementCount) {
    if (totalEnhancementCount === 0) {
      return { valid: false, error: new ValidationError('No enhancements to prestige') };
    }
    
    return { valid: true };
  }
}

module.exports = PrestigeValidator;