const { UPGRADE_TYPES } = require('../config/upgrades');

class PlayerService {
  constructor(playerRepository, upgradeRepository) {
    this.playerRepository = playerRepository;
    this.upgradeRepository = upgradeRepository;
  }

  getOrCreatePlayer(sessionId) {
    let player = this.playerRepository.findBySessionId(sessionId);
    
    if (!player) {
      player = this.playerRepository.create(sessionId);
      this.upgradeRepository.initializeForPlayer(player.id, UPGRADE_TYPES);
    }
    
    return player;
  }

  getPlayerById(playerId) {
    return this.playerRepository.findById(playerId);
  }

  updateCookies(playerId, cookies) {
    this.playerRepository.update(playerId, { cookies });
  }

  resetPlayer(playerId) {
    this.playerRepository.update(playerId, {
      cookies: 0,
      cookies_per_click: 1,
      cookies_per_second: 0
    });
    this.upgradeRepository.resetAll(playerId);
  }
}

module.exports = PlayerService;