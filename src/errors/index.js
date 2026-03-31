const GameError = require('./GameError');
const ValidationError = require('./ValidationError');
const InsufficientFundsError = require('./InsufficientFundsError');
const MaxLevelReachedError = require('./MaxLevelReachedError');
const AlreadyEnhancedError = require('./AlreadyEnhancedError');

module.exports = {
  GameError,
  ValidationError,
  InsufficientFundsError,
  MaxLevelReachedError,
  AlreadyEnhancedError
};