class Player {
  constructor(data = {}) {
    this.id = data.id || null;
    this.sessionId = data.session_id || '';
    this.cookies = data.cookies || 0;
    this.cookiesPerClick = data.cookies_per_click || 1;
    this.cookiesPerSecond = data.cookies_per_second || 0;
    this.prestigeCount = data.prestige_count || 0;
    this.prestigeStars = data.prestige_stars || 0;
    this.totalClicks = data.total_clicks || 0;
    this.totalCookiesEarned = data.total_cookies_earned || 0;
    this.totalUpgradesBought = data.total_upgrades_bought || 0;
    this.totalEnhancements = data.total_enhancements || 0;
    this.totalTranscends = data.total_transcends || 0;
  }

  canAfford(cost) {
    return this.cookies >= cost;
  }

  spend(amount) {
    this.cookies -= amount;
  }

  earn(amount) {
    this.cookies += amount;
    this.totalCookiesEarned += amount;
  }

  click() {
    this.totalClicks++;
  }

  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      cookies: this.cookies,
      cookiesPerClick: this.cookiesPerClick,
      cookiesPerSecond: this.cookiesPerSecond,
      prestigeCount: this.prestigeCount,
      prestigeStars: this.prestigeStars,
      totalClicks: this.totalClicks,
      totalCookiesEarned: this.totalCookiesEarned,
      totalUpgradesBought: this.totalUpgradesBought,
      totalEnhancements: this.totalEnhancements,
      totalTranscends: this.totalTranscends
    };
  }
}

module.exports = Player;