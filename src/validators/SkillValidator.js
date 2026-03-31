const { ValidationError, InsufficientFundsError } = require('../errors');
const { SKILLS } = require('../config/skills');

class SkillValidator {
  validateUnlock(skillId, currentStars, unlockedSkills) {
    const skill = SKILLS[skillId];
    
    if (!skill) {
      return { valid: false, error: new ValidationError('Invalid skill') };
    }
    
    if (unlockedSkills.includes(skillId)) {
      return { valid: false, error: new ValidationError('Skill already unlocked') };
    }
    
    if (skill.cost > currentStars) {
      return { valid: false, error: new InsufficientFundsError(skill.cost, currentStars) };
    }
    
    if (skill.requires && !skill.requires.every(req => unlockedSkills.includes(req))) {
      return { valid: false, error: new ValidationError('Prerequisites not met') };
    }
    
    return { valid: true };
  }
}

module.exports = SkillValidator;