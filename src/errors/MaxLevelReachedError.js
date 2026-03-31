const GameError = require('./GameError');

class MaxLevelReachedError extends GameError {
  constructor(type) {
    super(`${type} has reached maximum level`, 'MAX_LEVEL_REACHED');
    this.name = 'MaxLevelReachedError';
    this.type = type;
  }
}

module.exports = MaxLevelReachedError;