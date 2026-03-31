const GameError = require('./GameError');

class AlreadyEnhancedError extends GameError {
  constructor(type) {
    super(`${type} is already transcended`, 'ALREADY_ENHANCED');
    this.name = 'AlreadyEnhancedError';
    this.type = type;
  }
}

module.exports = AlreadyEnhancedError;