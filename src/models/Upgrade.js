class Upgrade {
  constructor(data = {}) {
    this.id = data.id || null;
    this.playerId = data.player_id || null;
    this.type = data.upgrade_type || '';
    this.level = data.level || 0;
    this.enhancementCount = data.enhancement_count || 0;
    this.specialEnhancement = data.special_enhancement || 0;
  }

  incrementLevel() {
    this.level++;
  }

  incrementEnhancement() {
    this.enhancementCount++;
  }

  setSpecialEnhancement() {
    this.specialEnhancement = 1;
  }

  reset() {
    this.level = 0;
    this.enhancementCount = 0;
    this.specialEnhancement = 0;
  }

  toJSON() {
    return {
      id: this.id,
      playerId: this.playerId,
      type: this.type,
      level: this.level,
      enhancementCount: this.enhancementCount,
      specialEnhancement: this.specialEnhancement
    };
  }
}

module.exports = Upgrade;