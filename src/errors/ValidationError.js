const GameError = require('./GameError');

class ValidationError extends GameError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

module.exports = ValidationError;