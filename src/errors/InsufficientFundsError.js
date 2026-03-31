const GameError = require('./GameError');

class InsufficientFundsError extends GameError {
  constructor(required, available) {
    super(`Insufficient funds. Required: ${required}, Available: ${available}`, 'INSUFFICIENT_FUNDS');
    this.name = 'InsufficientFundsError';
    this.required = required;
    this.available = available;
  }
}

module.exports = InsufficientFundsError;