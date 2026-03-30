class GameRoutes {
  constructor(container) {
    this.playerService = container.getPlayerService();
    this.upgradeService = container.getUpgradeService();
    this.statsCalculator = container.getStatsCalculator();
  }

  buildGameState(player) {
    const upgrades = this.upgradeService.getUpgradesForPlayer(player.id);
    const { cookiesPerClick, cookiesPerSecond, effects, clickBoostMultiplier } = 
      this.statsCalculator.calculateStats(upgrades, player.cookies);
    
    const upgradeList = this.upgradeService.buildUpgradeState(upgrades, effects);
    
    return {
      cookies: player.cookies,
      cookiesPerClick,
      cookiesPerSecond,
      upgrades: upgradeList,
      effects,
      clickBoostMultiplier
    };
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
      
      res.json({ 
        cookies: newCookies, 
        earned,
        clickCritChance: effects.clickCritChance,
        clickCritMultiplier: effects.clickCritMultiplier
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
      
      const updatedPlayer = { ...player, cookies: result.newCookies };
      res.json(this.buildGameState(updatedPlayer));
    });

    app.post('/api/special-enhance/:type', (req, res) => {
      const { type } = req.params;
      const player = req.player;
      
      if (!this.upgradeService.isValidUpgradeType(type)) {
        return res.status(400).json({ error: 'Invalid upgrade type' });
      }
      
      const result = this.upgradeService.specialEnhance(player.id, type, player.cookies);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      this.playerService.updateCookies(player.id, result.newCookies);
      
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
  }
}

module.exports = GameRoutes;