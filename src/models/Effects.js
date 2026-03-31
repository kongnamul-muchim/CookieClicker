class Effects {
  constructor(data = {}) {
    this.hasDiscount = data.hasDiscount || false;
    this.clickCritChance = data.clickCritChance || 0.05;
    this.clickCritMultiplier = data.clickCritMultiplier || 5;
    this.autoCritChance = data.autoCritChance || 0;
    this.autoCritMultiplier = data.autoCritMultiplier || 5;
    this.productionMultiplier = data.productionMultiplier || 1;
    this.clickCpsBonus = data.clickCpsBonus || false;
  }

  static fromUpgradesAndSkills(upgrades, unlockedSkills) {
    const effects = new Effects();
    
    upgrades.forEach(upgrade => {
      if (upgrade.specialEnhancement) {
        switch (upgrade.specialEffect) {
          case 'cost_10pct_discount':
            effects.hasDiscount = true;
            break;
          case 'crit_chance_15pct':
            effects.clickCritChance += 0.15;
            break;
          case 'production_1_2x':
            effects.productionMultiplier *= 1.2;
            break;
          case 'production_1_5x':
            effects.productionMultiplier *= 1.5;
            break;
          case 'production_2x':
            effects.productionMultiplier *= 2;
            break;
          case 'click_cps_1pct':
            effects.clickCpsBonus = true;
            break;
          case 'auto_crit_5pct_5x':
            effects.autoCritChance += 0.05;
            break;
          case 'click_crit_5pct_5x':
            effects.clickCritChance += 0.05;
            break;
        }
      }
    });
    
    return effects;
  }

  toJSON() {
    return {
      hasDiscount: this.hasDiscount,
      clickCritChance: this.clickCritChance,
      clickCritMultiplier: this.clickCritMultiplier,
      autoCritChance: this.autoCritChance,
      autoCritMultiplier: this.autoCritMultiplier,
      productionMultiplier: this.productionMultiplier,
      clickCpsBonus: this.clickCpsBonus
    };
  }
}

module.exports = Effects;