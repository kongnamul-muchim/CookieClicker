const PlayerRepository = require('./repositories/playerRepository');
const UpgradeRepository = require('./repositories/upgradeRepository');
const SkillRepository = require('./repositories/skillRepository');
const AchievementRepository = require('./repositories/achievementRepository');
const StatsCalculator = require('./services/statsCalculator');
const PrestigeCalculator = require('./services/prestigeCalculator');
const PlayerService = require('./services/playerService');
const UpgradeService = require('./services/upgradeService');
const SkillService = require('./services/skillService');
const AchievementService = require('./services/achievementService');

class Container {
  constructor(db, saveDB) {
    this.db = db;
    this.saveDB = saveDB;
    this.init();
  }

  init() {
    this.playerRepository = new PlayerRepository(this.db, this.saveDB);
    this.upgradeRepository = new UpgradeRepository(this.db, this.saveDB);
    this.skillRepository = new SkillRepository(this.db, this.saveDB);
    this.achievementRepository = new AchievementRepository(this.db, this.saveDB);
    this.statsCalculator = new StatsCalculator();
    this.prestigeCalculator = new PrestigeCalculator();
    
    this.playerService = new PlayerService(
      this.playerRepository,
      this.upgradeRepository
    );
    
    this.upgradeService = new UpgradeService(
      this.upgradeRepository,
      this.statsCalculator
    );
    
    this.skillService = new SkillService(
      this.skillRepository,
      this.prestigeCalculator
    );
    
    this.achievementService = new AchievementService(this.achievementRepository);
  }

  getPlayerService() {
    return this.playerService;
  }

  getUpgradeService() {
    return this.upgradeService;
  }

  getSkillService() {
    return this.skillService;
  }

  getStatsCalculator() {
    return this.statsCalculator;
  }

  getPrestigeCalculator() {
    return this.prestigeCalculator;
  }

  getSkillRepository() {
    return this.skillRepository;
  }

  getAchievementService() {
    return this.achievementService;
  }
}

module.exports = Container;