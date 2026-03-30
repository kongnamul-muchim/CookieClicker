const PlayerRepository = require('./repositories/playerRepository');
const UpgradeRepository = require('./repositories/upgradeRepository');
const StatsCalculator = require('./services/statsCalculator');
const PlayerService = require('./services/playerService');
const UpgradeService = require('./services/upgradeService');

class Container {
  constructor(db, saveDB) {
    this.db = db;
    this.saveDB = saveDB;
    this.init();
  }

  init() {
    this.playerRepository = new PlayerRepository(this.db, this.saveDB);
    this.upgradeRepository = new UpgradeRepository(this.db, this.saveDB);
    this.statsCalculator = new StatsCalculator();
    
    this.playerService = new PlayerService(
      this.playerRepository,
      this.upgradeRepository
    );
    
    this.upgradeService = new UpgradeService(
      this.upgradeRepository,
      this.statsCalculator
    );
  }

  getPlayerService() {
    return this.playerService;
  }

  getUpgradeService() {
    return this.upgradeService;
  }

  getStatsCalculator() {
    return this.statsCalculator;
  }
}

module.exports = Container;