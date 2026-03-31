class GameRoutes {
  constructor(container) {
    this.playerService = container.getPlayerService();
    this.upgradeService = container.getUpgradeService();
    this.statsCalculator = container.getStatsCalculator();
    this.skillService = container.getSkillService();
    this.skillRepository = container.getSkillRepository();
    this.prestigeCalculator = container.getPrestigeCalculator();
    this.achievementService = container.getAchievementService();
  }

  buildGameState(player) {
    const upgrades = this.upgradeService.getUpgradesForPlayer(player.id);
    const unlockedSkills = this.skillService.getUnlockedSkills(player.id);
    const skillEffects = this.skillService.getSkillEffects(unlockedSkills);
    
    const { cookiesPerClick, cookiesPerSecond, effects, clickBoostMultiplier } = 
      this.statsCalculator.calculateStatsWithSkills(upgrades, player.cookies, skillEffects);
    
    const upgradeList = this.upgradeService.buildUpgradeState(upgrades, effects);
    
    return {
      cookies: player.cookies,
      cookiesPerClick,
      cookiesPerSecond,
      upgrades: upgradeList,
      effects,
      clickBoostMultiplier,
      prestigeCount: player.prestige_count || 0,
      prestigeStars: player.prestige_stars || 0
    };
  }

  checkAchievements(playerId) {
    const stats = this.playerService.playerRepository.getStats(playerId);
    if (stats) {
      return this.achievementService.checkAndUnlockAchievements(playerId, stats);
    }
    return [];
  }

  register(app) {
    app.get('/api/game', (req, res) => {
      res.json(this.buildGameState(req.player));
    });

    app.post('/api/click', (req, res) => {
      const player = req.player;
      const upgrades = this.upgradeService.getUpgradesForPlayer(player.id);
      const { cookiesPerClick, effects } = this.statsCalculator.calculateStats(upgrades, player.cookies);
      
      let earned = cookiesPerClick;
      
      if (effects.clickCpsBonus) {
        const { cookiesPerSecond } = this.statsCalculator.calculateStats(upgrades, player.cookies);
        earned += Math.floor(cookiesPerSecond * 0.01);
      }
      
      const newCookies = player.cookies + earned;
      
      this.playerService.updateCookies(player.id, newCookies);
      this.playerService.playerRepository.incrementStat(player.id, 'total_clicks', 1);
      this.playerService.playerRepository.incrementStat(player.id, 'total_cookies_earned', earned);
      
      const newAchievements = this.checkAchievements(player.id);
      
      res.json({ 
        cookies: newCookies, 
        earned,
        clickCritChance: effects.clickCritChance,
        clickCritMultiplier: effects.clickCritMultiplier,
        newAchievements
      });
    });

    app.post('/api/upgrade/:type', (req, res) => {
      const { type } = req.params;
      const player = req.player;
      
      if (!this.upgradeService.isValidUpgradeType(type)) {
        return res.status(400).json({ error: 'Invalid upgrade type' });
      }
      
      const upgrades = this.upgradeService.getUpgradesForPlayer(player.id);
      const effects = this.statsCalculator.getActiveEffects(upgrades);
      
      const result = this.upgradeService.buyUpgrade(player.id, type, player.cookies, effects);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      this.playerService.updateCookies(player.id, result.newCookies);
      this.playerService.playerRepository.incrementStat(player.id, 'total_upgrades_bought', 1);
      
      const updatedPlayer = { ...player, cookies: result.newCookies };
      res.json(this.buildGameState(updatedPlayer));
    });

    app.post('/api/upgrade-batch/:type', (req, res) => {
      const { type } = req.params;
      const player = req.player;
      
      if (!this.upgradeService.isValidUpgradeType(type)) {
        return res.status(400).json({ error: 'Invalid upgrade type' });
      }
      
      const upgrades = this.upgradeService.getUpgradesForPlayer(player.id);
      const effects = this.statsCalculator.getActiveEffects(upgrades);
      
      const result = this.upgradeService.buyUpgradeBatch(player.id, type, player.cookies, effects);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      this.playerService.updateCookies(player.id, result.newCookies);
      this.playerService.playerRepository.incrementStat(player.id, 'total_upgrades_bought', result.levelsBought || 1);
      
      const updatedPlayer = { ...player, cookies: result.newCookies };
      res.json(this.buildGameState(updatedPlayer));
    });

    app.post('/api/enhance/:type', (req, res) => {
      const { type } = req.params;
      const player = req.player;
      
      if (!this.upgradeService.isValidUpgradeType(type)) {
        return res.status(400).json({ error: 'Invalid upgrade type' });
      }
      
      const result = this.upgradeService.enhance(player.id, type, player.cookies);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      this.playerService.updateCookies(player.id, result.newCookies);
      this.playerService.playerRepository.incrementStat(player.id, 'total_enhancements', 1);
      
      const updatedPlayer = { ...player, cookies: result.newCookies };
      res.json(this.buildGameState(updatedPlayer));
    });

    app.post('/api/special-enhance/:type', (req, res) => {
      const { type } = req.params;
      const player = req.player;
      
      if (!this.upgradeService.isValidUpgradeType(type)) {
        return res.status(400).json({ error: 'Invalid upgrade type' });
      }
      
      const upgrades = this.upgradeService.getUpgradesForPlayer(player.id);
      const effects = this.statsCalculator.getActiveEffects(upgrades);
      
      const result = this.upgradeService.specialEnhance(player.id, type, player.cookies, effects);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      this.playerService.updateCookies(player.id, result.newCookies);
      this.playerService.playerRepository.incrementStat(player.id, 'total_transcends', 1);
      
      const updatedPlayer = { ...player, cookies: result.newCookies };
      res.json(this.buildGameState(updatedPlayer));
    });

    app.post('/api/game/reset', (req, res) => {
      const player = req.player;
      
      this.playerService.resetPlayer(player.id);
      
      const updatedPlayer = {
        ...player,
        cookies: 0,
        cookies_per_click: 1,
        cookies_per_second: 0
      };
      
      res.json(this.buildGameState(updatedPlayer));
    });

    app.post('/api/prestige', (req, res) => {
      const player = req.player;
      const upgrades = this.upgradeService.getUpgradesForPlayer(player.id);
      
      const totalEnhancementCount = upgrades.reduce((sum, u) => 
        sum + (u.enhancement_count || 0), 0);
      
      if (totalEnhancementCount === 0) {
        return res.status(400).json({ error: 'No enhancements to prestige' });
      }
      
      const unlockedSkills = this.skillService.getUnlockedSkills(player.id);
      const unlockedSkillIds = unlockedSkills.map(s => s.skill_id);
      const starsEarned = this.prestigeCalculator.calculateStarsEarned(
        upgrades, unlockedSkillIds);
      
      const currentPrestige = player.prestige_count || 0;
      const currentStars = player.prestige_stars || 0;
      
      this.playerService.resetPlayer(player.id);
      this.skillRepository.updatePrestigeData(
        player.id, currentPrestige + 1, currentStars + starsEarned);
      
      if (currentPrestige === 0) {
        this.skillRepository.unlockSkill(player.id, 'prestige_start');
      }
      
      res.json({
        prestigeCount: currentPrestige + 1,
        starsEarned,
        totalStars: currentStars + starsEarned
      });
    });

    app.post('/api/skill/unlock/:skillId', (req, res) => {
      const { skillId } = req.params;
      const player = req.player;
      const currentStars = player.prestige_stars || 0;
      
      const result = this.skillService.unlockSkill(player.id, skillId, currentStars);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      if (result.newStars !== undefined) {
        this.skillRepository.updatePrestigeStars(player.id, result.newStars);
      }
      
      res.json({
        success: true,
        skillId,
        remainingStars: result.newStars || currentStars
      });
    });

    app.get('/api/skills', (req, res) => {
      const player = req.player;
      const unlockedSkills = this.skillService.getUnlockedSkills(player.id);
      const allSkills = this.skillService.getAllSkills();
      const skillEffects = this.skillService.getSkillEffects(unlockedSkills);
      
      res.json({
        prestigeCount: player.prestige_count || 0,
        prestigeStars: player.prestige_stars || 0,
        unlockedSkills,
        allSkills,
        skillEffects
      });
    });

    app.get('/api/prestige/preview', (req, res) => {
      const player = req.player;
      const upgrades = this.upgradeService.getUpgradesForPlayer(player.id);
      
      const totalEnhancementCount = upgrades.reduce((sum, u) => 
        sum + (u.enhancement_count || 0), 0);
      
      const unlockedSkills = this.skillService.getUnlockedSkills(player.id);
      const unlockedSkillIds = unlockedSkills.map(s => s.skill_id);
      const expectedStars = this.prestigeCalculator.calculateStarsEarned(
        upgrades, unlockedSkillIds);
      
      res.json({
        totalEnhancements: totalEnhancementCount,
        expectedStars
      });
    });

    app.post('/api/sync', (req, res) => {
      const { cookies } = req.body;
      const player = req.player;
      
      if (typeof cookies !== 'number') {
        return res.status(400).json({ error: 'Invalid cookies value' });
      }
      
      this.playerService.updateCookies(player.id, cookies);
      
      res.json({ cookies });
    });

    app.get('/api/player', (req, res) => {
      res.json(req.player);
    });

    app.get('/api/stats', (req, res) => {
      const player = req.player;
      const stats = this.playerService.playerRepository.getStats(player.id);
      res.json(stats || {});
    });

    app.post('/api/debug/reset-special/:type', (req, res) => {
      const player = req.player;
      const type = req.params.type;
      
      this.upgradeService.upgradeRepository.resetSpecialEnhancement(player.id, type);
      
      res.json({ success: true, message: `${type} special enhancement reset` });
    });

    app.get('/api/achievements', (req, res) => {
      const player = req.player;
      const achievements = this.achievementService.getAllAchievements(player.id);
      res.json(achievements);
    });
  }
}

module.exports = GameRoutes;