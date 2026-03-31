# 프레스티지 스킬 트리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 프레스티지 시스템과 20티어 50개 스킬 트리를 구현하여 플레이어에게 영구적인 강화 옵션 제공

**Architecture:** 
- 기존 DI Container 패턴 확장 (SkillRepository, SkillService 추가)
- StatsCalculator에 스킬 효과 계산 로직 추가
- 프레스티지 = 모든 업그레이드 레벨/강화 리셋 + ⭐(특수 재화) 지급

**Tech Stack:** Node.js, Express, sql.js, vanilla JS frontend

---

## File Structure

### Backend (새 파일)
- `src/config/skills.js` - 50개 스킬 정의
- `src/repositories/skillRepository.js` - 스킬 DB 접근
- `src/services/skillService.js` - 스킬 비즈니스 로직
- `src/services/prestigeCalculator.js` - ⭐ 지급량 계산

### Backend (수정)
- `src/container.js` - SkillRepository, SkillService, PrestigeCalculator 추가
- `src/services/statsCalculator.js` - 스킬 효과 계산 추가
- `src/routes/gameRoutes.js` - 프레스티지/스킬 API 추가
- `database/schema.sql` - players 테이블에 prestige_count, prestige_stars 추가

### Frontend (새 파일)
- `public/skillTree.js` - 스킬 트리 UI 로직

### Frontend (수정)
- `public/index.html` - 스킬 트리 버튼, 모달 추가
- `public/game.js` - 프레스티지 버튼, 스킬 트리 연동
- `public/style.css` - 스킬 트리 스일

---

## Task 1: DB 스키마 확장

**Files:**
- Modify: `database/schema.sql` (새 파일 생성)

- [ ] **Step 1: players 테이블에 프레스티지 컬럼 추가**

```sql
-- database/schema.sql
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  cookies REAL DEFAULT 0,
  cookies_per_click REAL DEFAULT 1,
  cookies_per_second REAL DEFAULT 0,
  prestige_count INTEGER DEFAULT 0,
  prestige_stars INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unlocked_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  skill_id TEXT NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id),
  UNIQUE(player_id, skill_id)
);
```

- [ ] **Step 2: schema.sql 파일 생성 후 DB 재생성 확인**

기존 DB 파일이 있다면 백업 후 새 스키마로 재생성.

---

## Task 2: 스킬 데이터 구성

**Files:**
- Create: `src/config/skills.js`

- [ ] **Step 1: 스킬 데이터 파일 작성**

```javascript
// src/config/skills.js
const SKILLS = [
  {
    id: 'prestige_start',
    tier: 1,
    name: '프레스티지 시작',
    icon: '🏠',
    cost: 10,
    autoUnlock: true,
    effect: { type: 'none' },
    description: '첫 프레스티지 후 자동 해금',
    requires: []
  },
  {
    id: 'click_boost_1',
    tier: 2,
    name: '클릭 강화 I',
    icon: '👆',
    cost: 15,
    effect: { type: 'click_percent', value: 10 },
    requires: ['prestige_start']
  },
  {
    id: 'cps_boost_1',
    tier: 2,
    name: '생산력 강화 I',
    icon: '📈',
    cost: 15,
    effect: { type: 'cps_percent', value: 10 },
    requires: ['prestige_start']
  },
  {
    id: 'cost_discount_1',
    tier: 2,
    name: '비용 할인 I',
    icon: '💰',
    cost: 15,
    effect: { type: 'cost_discount', value: 5 },
    requires: ['prestige_start']
  },
  {
    id: 'critical_click',
    tier: 3,
    name: '크리티컬 클릭',
    icon: '💥',
    cost: 25,
    effect: { type: 'critical', chance: 5, multiplier: 3 },
    requires: ['click_boost_1', 'cps_boost_1'],
    minRequired: 2
  },
  {
    id: 'cookie_interest',
    tier: 3,
    name: '쿠키 이자',
    icon: '🏦',
    cost: 25,
    effect: { type: 'interest', rate: 0.1 },
    requires: ['cps_boost_1', 'cost_discount_1'],
    minRequired: 2
  },
  {
    id: 'auto_click',
    tier: 3,
    name: '자동 클릭',
    icon: '🖱️',
    cost: 25,
    effect: { type: 'auto_click', rate: 1 },
    requires: ['click_boost_1', 'cost_discount_1'],
    minRequired: 2
  },
  // ... T4~T20 스킬 (docs/superpowers/specs/2026-03-30-prestige-skill-balance.md 참조)
];

const SKILL_TIERS = 20;
const SKILL_COUNT = 50;

module.exports = { SKILLS, SKILL_TIERS, SKILL_COUNT };
```

**참고:** 전체 50개 스킬은 `docs/superpowers/specs/2026-03-30-prestige-skill-balance.md`의 JSON 데이터 사용.

---

## Task 3: SkillRepository 구현

**Files:**
- Create: `src/repositories/skillRepository.js`

- [ ] **Step 1: SkillRepository 작성**

```javascript
// src/repositories/skillRepository.js
class SkillRepository {
  constructor(db, saveDB) {
    this.db = db;
    this.saveDB = saveDB;
  }

  getUnlockedSkills(playerId) {
    const stmt = this.db.prepare('SELECT skill_id FROM unlocked_skills WHERE player_id = ?');
    stmt.bind([playerId]);
    
    const skills = [];
    while (stmt.step()) {
      skills.push(stmt.getAsObject().skill_id);
    }
    stmt.free();
    return skills;
  }

  unlockSkill(playerId, skillId) {
    this.db.run(
      'INSERT INTO unlocked_skills (player_id, skill_id) VALUES (?, ?)',
      [playerId, skillId]
    );
    this.saveDB();
  }

  hasSkill(playerId, skillId) {
    const stmt = this.db.prepare('SELECT 1 FROM unlocked_skills WHERE player_id = ? AND skill_id = ?');
    stmt.bind([playerId, skillId]);
    
    const exists = stmt.step();
    stmt.free();
    return exists;
  }

  getPlayerPrestigeData(playerId) {
    const stmt = this.db.prepare('SELECT prestige_count, prestige_stars FROM players WHERE id = ?');
    stmt.bind([playerId]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return { prestige_count: 0, prestige_stars: 0 };
  }

  updatePrestigeData(playerId, prestigeCount, prestigeStars) {
    this.db.run(
      'UPDATE players SET prestige_count = ?, prestige_stars = ?, cookies = 0 WHERE id = ?',
      [prestigeCount, prestigeStars, playerId]
    );
    this.saveDB();
  }
}

module.exports = SkillRepository;
```

---

## Task 4: PrestigeCalculator 구현

**Files:**
- Create: `src/services/prestigeCalculator.js`

- [ ] **Step 1: PrestigeCalculator 작성**

```javascript
// src/services/prestigeCalculator.js
class PrestigeCalculator {
  calculateStarsEarned(totalEnhancementCount, unlockedSkills, SKILLS) {
    const baseStars = 10 * totalEnhancementCount;
    
    let multiplier = 1;
    
    const resetBonusSkill = SKILLS.find(s => s.id === 'reset_bonus');
    const demonContractSkill = SKILLS.find(s => s.id === 'demon_contract');
    
    if (unlockedSkills.includes('reset_bonus')) {
      multiplier *= 1.5;
    }
    if (unlockedSkills.includes('demon_contract')) {
      multiplier *= 2;
    }
    
    return Math.floor(baseStars * multiplier);
  }

  calculateExpectedStars(upgrades, SKILLS) {
    const totalEnhancementCount = upgrades.reduce((sum, u) => 
      sum + (u.enhancement_count || 0), 0);
    return this.calculateStarsEarned(totalEnhancementCount, [], SKILLS);
  }
}

module.exports = PrestigeCalculator;
```

---

## Task 5: SkillService 구현

**Files:**
- Create: `src/services/skillService.js`

- [ ] **Step 1: SkillService 작성**

```javascript
// src/services/skillService.js
const { SKILLS } = require('../config/skills');

class SkillService {
  constructor(skillRepository, prestigeCalculator) {
    this.skillRepository = skillRepository;
    this.prestigeCalculator = prestigeCalculator;
  }

  getSkillConfig(skillId) {
    return SKILLS.find(s => s.id === skillId);
  }

  getAllSkills() {
    return SKILLS;
  }

  getUnlockedSkills(playerId) {
    return this.skillRepository.getUnlockedSkills(playerId);
  }

  canUnlockSkill(playerId, skillId, currentStars) {
    const skill = this.getSkillConfig(skillId);
    
    if (!skill) {
      return { success: false, error: 'Skill not found' };
    }
    
    if (skill.autoUnlock) {
      return { success: true, autoUnlock: true };
    }
    
    if (currentStars < skill.cost) {
      return { success: false, error: 'Not enough stars' };
    }
    
    const unlockedSkills = this.getUnlockedSkills(playerId);
    
    if (unlockedSkills.includes(skillId)) {
      return { success: false, error: 'Already unlocked' };
    }
    
    const requiredCount = skill.minRequired || skill.requires.length;
    const unlockedRequired = skill.requires.filter(r => unlockedSkills.includes(r)).length;
    
    if (unlockedRequired < requiredCount) {
      return { success: false, error: 'Requirements not met' };
    }
    
    return { success: true };
  }

  unlockSkill(playerId, skillId, currentStars) {
    const check = this.canUnlockSkill(playerId, skillId, currentStars);
    
    if (!check.success) {
      return check;
    }
    
    if (!check.autoUnlock) {
      const skill = this.getSkillConfig(skillId);
      this.skillRepository.unlockSkill(playerId, skillId);
      return { success: true, newStars: currentStars - skill.cost };
    }
    
    this.skillRepository.unlockSkill(playerId, skillId);
    return { success: true, newStars: currentStars };
  }

  getSkillEffects(unlockedSkillIds) {
    const effects = {
      clickPercentBonus: 0,
      cpsPercentBonus: 0,
      costDiscount: 0,
      criticalChance: 0,
      criticalMultiplier: 3,
      interestRate: 0,
      autoClickRate: 0,
      luckBonus: 0,
      reinforceBonus: 0,
      startBonus: 0,
      specialReinforceDiscount: 0,
      burningClickBonus: 0,
      lightningChance: 0,
      allBonus: 0,
      starGainMultiplier: 1
    };
    
    for (const skillId of unlockedSkillIds) {
      const skill = this.getSkillConfig(skillId);
      if (!skill || !skill.effect) continue;
      
      const { type, value, chance, multiplier, rate } = skill.effect;
      
      switch (type) {
        case 'click_percent':
          effects.clickPercentBonus += value;
          break;
        case 'cps_percent':
          effects.cpsPercentBonus += value;
          break;
        case 'cost_discount':
          effects.costDiscount += value;
          break;
        case 'critical':
          effects.criticalChance += chance;
          effects.criticalMultiplier *= multiplier;
          break;
        case 'interest':
          effects.interestRate += rate;
          break;
        case 'auto_click':
          effects.autoClickRate += rate;
          break;
        case 'luck_bonus':
          effects.luckBonus += value;
          break;
        case 'all_bonus':
          effects.allBonus += value;
          break;
        case 'star_gain_multiplier':
          effects.starGainMultiplier *= (1 + value / 100);
          break;
      }
    }
    
    return effects;
  }
}

module.exports = SkillService;
```

---

## Task 6: Container 확장

**Files:**
- Modify: `src/container.js`

- [ ] **Step 1: SkillRepository, SkillService, PrestigeCalculator 추가**

```javascript
// src/container.js
const PlayerRepository = require('./repositories/playerRepository');
const UpgradeRepository = require('./repositories/upgradeRepository');
const SkillRepository = require('./repositories/skillRepository');
const StatsCalculator = require('./services/statsCalculator');
const PlayerService = require('./services/playerService');
const UpgradeService = require('./services/upgradeService');
const SkillService = require('./services/skillService');
const PrestigeCalculator = require('./services/prestigeCalculator');

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
  }

  getSkillService() {
    return this.skillService;
  }

  getPrestigeCalculator() {
    return this.prestigeCalculator;
  }
  
  // ... 기존 메서드 유지
}

module.exports = Container;
```

---

## Task 7: StatsCalculator에 스킬 효과 통합

**Files:**
- Modify: `src/services/statsCalculator.js`

- [ ] **Step 1: calculateStatsWithSkills 메서드 추가**

```javascript
// src/services/statsCalculator.js - 기존 코드에 추가

calculateStatsWithSkills(upgrades, playerCookies, skillEffects) {
  const baseStats = this.calculateStats(upgrades, playerCookies);
  
  let cookiesPerClick = baseStats.cookiesPerClick;
  let cookiesPerSecond = baseStats.cookiesPerSecond;
  
  cookiesPerClick *= (1 + skillEffects.clickPercentBonus / 100);
  cookiesPerClick *= (1 + skillEffects.allBonus / 100);
  
  cookiesPerSecond *= (1 + skillEffects.cpsPercentBonus / 100);
  cookiesPerSecond *= (1 + skillEffects.allBonus / 100);
  
  if (skillEffects.interestRate > 0 && playerCookies) {
    const interestGain = playerCookies * (skillEffects.interestRate / 100);
    const cappedInterest = Math.min(interestGain, cookiesPerSecond * 0.1);
    cookiesPerSecond += cappedInterest;
  }
  
  const hasDiscount = baseStats.effects.hasDiscount || skillEffects.costDiscount > 0;
  const discountMultiplier = hasDiscount ? 
    (1 - (skillEffects.costDiscount + (baseStats.effects.hasDiscount ? 10 : 0)) / 100) : 1;
  
  return {
    cookiesPerClick,
    cookiesPerSecond,
    effects: {
      ...baseStats.effects,
      skillCriticalChance: skillEffects.criticalChance,
      skillCriticalMultiplier: skillEffects.criticalMultiplier,
      autoClickRate: skillEffects.autoClickRate,
      luckBonus: skillEffects.luckBonus,
      hasDiscount,
      discountMultiplier
    }
  };
}
```

---

## Task 8: GameRoutes에 프레스티지/스킬 API 추가

**Files:**
- Modify: `src/routes/gameRoutes.js`

- [ ] **Step 1: 프레스티지 API 추가**

```javascript
// src/routes/gameRoutes.js - register 메서드에 추가

app.post('/api/prestige', (req, res) => {
  const player = req.player;
  const upgrades = this.upgradeService.getUpgradesForPlayer(player.id);
  
  const totalEnhancementCount = upgrades.reduce((sum, u) => 
    sum + (u.enhancement_count || 0), 0);
  
  if (totalEnhancementCount === 0) {
    return res.status(400).json({ error: 'No enhancements to prestige' });
  }
  
  const unlockedSkills = this.skillService.getUnlockedSkills(player.id);
  const starsEarned = this.prestigeCalculator.calculateStarsEarned(
    totalEnhancementCount, 
    unlockedSkills,
    SKILLS
  );
  
  const currentPrestige = player.prestige_count || 0;
  const currentStars = player.prestige_stars || 0;
  
  this.playerService.resetPlayer(player.id);
  this.skillRepository.updatePrestigeData(
    player.id, 
    currentPrestige + 1, 
    currentStars + starsEarned
  );
  
  const prestigeStartSkill = this.skillService.getSkillConfig('prestige_start');
  if (prestigeStartSkill && prestigeStartSkill.autoUnlock && currentPrestige === 0) {
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
  const expectedStars = this.prestigeCalculator.calculateStarsEarned(
    totalEnhancementCount,
    unlockedSkills,
    SKILLS
  );
  
  res.json({
    totalEnhancements: totalEnhancementCount,
    expectedStars
  });
});
```

---

## Task 9: Frontend - 스킬 트리 UI

**Files:**
- Create: `public/skillTree.js`

- [ ] **Step 1: 스킬 트리 UI 로직 작성**

```javascript
// public/skillTree.js
let skillTreeState = {
  prestigeCount: 0,
  prestigeStars: 0,
  unlockedSkills: [],
  allSkills: [],
  skillEffects: {}
};

async function loadSkillTree() {
  try {
    const response = await fetch('/api/skills');
    skillTreeState = await response.json();
    renderSkillTree();
    updateSkillTreeUI();
  } catch (error) {
    console.error('Failed to load skill tree:', error);
  }
}

function renderSkillTree() {
  const container = document.getElementById('skill-tree-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  const tiers = {};
  for (const skill of skillTreeState.allSkills) {
    if (!tiers[skill.tier]) tiers[skill.tier] = [];
    tiers[skill.tier].push(skill);
  }
  
  const legendHtml = `
    <div class="skill-legend">
      <span class="legend-item"><span class="legend-dot unlocked"></span> 해금</span>
      <span class="legend-item"><span class="legend-dot available"></span> 가능</span>
      <span class="legend-item"><span class="legend-dot locked"></span> 잠김</span>
    </div>
  `;
  
  container.innerHTML = legendHtml;
  
  for (let tier = 1; tier <= 20; tier++) {
    const skills = tiers[tier] || [];
    if (skills.length === 0) continue;
    
    const tierSection = document.createElement('div');
    tierSection.className = 'tier-section';
    
    const tierLabel = document.createElement('div');
    tierLabel.className = 'tier-label';
    tierLabel.textContent = `티어 ${tier}`;
    tierSection.appendChild(tierLabel);
    
    const tierRow = document.createElement('div');
    tierRow.className = 'tier-row';
    
    for (const skill of skills) {
      const isUnlocked = skillTreeState.unlockedSkills.includes(skill.id);
      const canUnlock = canUnlockSkill(skill);
      
      let nodeClass = 'locked';
      if (isUnlocked) nodeClass = 'unlocked';
      else if (canUnlock) nodeClass = 'available';
      if (skill.tier === 1) nodeClass = 'root';
      
      const skillNode = document.createElement('div');
      skillNode.className = `skill-node ${nodeClass}`;
      skillNode.innerHTML = `<span class="skill-icon">${skill.icon}</span>`;
      skillNode.dataset.skillId = skill.id;
      
      const tooltip = createSkillTooltip(skill, isUnlocked, canUnlock);
      skillNode.appendChild(tooltip);
      
      if (canUnlock && !isUnlocked) {
        skillNode.addEventListener('click', () => unlockSkillHandler(skill.id));
      }
      
      tierRow.appendChild(skillNode);
    }
    
    tierSection.appendChild(tierRow);
    container.appendChild(tierSection);
  }
}

function canUnlockSkill(skill) {
  if (skill.autoUnlock) return false;
  if (skillTreeState.unlockedSkills.includes(skill.id)) return false;
  
  const requiredCount = skill.minRequired || skill.requires.length;
  const unlockedRequired = skill.requires.filter(r => 
    skillTreeState.unlockedSkills.includes(r)).length;
  
  if (unlockedRequired < requiredCount) return false;
  
  return skillTreeState.prestigeStars >= skill.cost;
}

function createSkillTooltip(skill, isUnlocked, canUnlock) {
  const tooltip = document.createElement('div');
  tooltip.className = 'skill-tooltip';
  
  const effectText = formatSkillEffect(skill.effect);
  const reqText = skill.requires.length > 0 ? 
    `🔒 필요: ${skill.requires.join(', ')}` : '';
  
  tooltip.innerHTML = `
    <div class="tooltip-title">${skill.icon} ${skill.name}</div>
    <div class="tooltip-desc">${skill.description || ''}</div>
    <div class="tooltip-cost">비용: ${skill.cost}⭐</div>
    ${reqText ? `<div class="tooltip-req">${reqText}</div>` : ''}
    <div class="tooltip-effect">${effectText}</div>
    ${isUnlocked ? '<div class="tooltip-status">✅ 해금 완료</div>' : 
      canUnlock ? '<div class="tooltip-status clickable">클릭하여 해금</div>' : ''}
  `;
  
  return tooltip;
}

function formatSkillEffect(effect) {
  if (!effect) return '';
  
  switch (effect.type) {
    case 'click_percent': return `✨ 클릭 데미지 +${effect.value}%`;
    case 'cps_percent': return `✨ CPS +${effect.value}%`;
    case 'cost_discount': return `✨ 비용 -${effect.value}%`;
    case 'critical': return `✨ ${effect.chance}% 확률로 ${effect.multiplier}배`;
    case 'interest': return `✨ 이자율 +${effect.rate}%`;
    case 'auto_click': return `✨ 자동 클릭 ${effect.rate}회/초`;
    case 'luck_bonus': return `✨ 확률 효과 +${effect.value}%p`;
    case 'all_bonus': return `✨ 전체 +${effect.value}%`;
    default: return '';
  }
}

async function unlockSkillHandler(skillId) {
  try {
    const response = await fetch(`/api/skill/unlock/${skillId}`, { method: 'POST' });
    
    if (response.ok) {
      const result = await response.json();
      skillTreeState.unlockedSkills.push(skillId);
      skillTreeState.prestigeStars = result.remainingStars;
      renderSkillTree();
      updateSkillTreeUI();
      await loadGame();
    } else {
      const error = await response.json();
      alert(error.error);
    }
  } catch (error) {
    console.error('Unlock skill failed:', error);
  }
}

function updateSkillTreeUI() {
  document.getElementById('prestige-stars').textContent = skillTreeState.prestigeStars;
  document.getElementById('prestige-count').textContent = skillTreeState.prestigeCount;
}

module.exports = { loadSkillTree, skillTreeState };
```

---

## Task 10: Frontend - 프레스티지 버튼

**Files:**
- Modify: `public/game.js`

- [ ] **Step 1: 프레스티지 관련 함수 추가**

```javascript
// public/game.js - 추가

async function prestige() {
  try {
    const preview = await fetch('/api/prestige/preview').then(r => r.json());
    
    if (preview.totalEnhancements === 0) {
      alert('강화가 없어 프레스티지할 수 없습니다.');
      return;
    }
    
    const confirmed = confirm(
      `프레스티지하면:\n` +
      `- 모든 업그레이드 레벨/강화 리셋\n` +
      `- ${preview.expectedStars}⭐ 획득\n` +
      `\n진행하시겠습니까?`
    );
    
    if (!confirmed) return;
    
    const response = await fetch('/api/prestige', { method: 'POST' });
    
    if (response.ok) {
      const result = await response.json();
      alert(`프레스티지 완료!\n${result.starsEarned}⭐ 획득\n총 ${result.totalStars}⭐`);
      gameState.cookies = 0;
      await loadGame();
      await loadSkillTree();
    } else {
      const error = await response.json();
      alert(error.error);
    }
  } catch (error) {
    console.error('Prestige failed:', error);
  }
}

async function showPrestigePreview() {
  try {
    const response = await fetch('/api/prestige/preview');
    const preview = await response.json();
    
    const modal = document.getElementById('prestige-preview-modal');
    modal.querySelector('.preview-enhancements').textContent = preview.totalEnhancements;
    modal.querySelector('.preview-stars').textContent = preview.expectedStars;
    modal.style.display = 'flex';
  } catch (error) {
    console.error('Preview failed:', error);
  }
}
```

---

## Task 11: Frontend - HTML/CSS

**Files:**
- Modify: `public/index.html`
- Modify: `public/style.css`

- [ ] **Step 1: 스킬 트리 모달 HTML 추가**

```html
<!-- public/index.html - .controls 내부에 추가 -->
<button id="prestige-btn" class="control-btn">⭐ 프레스티지</button>
<button id="skill-tree-btn" class="control-btn">🌳 스킬 트리</button>

<!-- 스킬 트리 모달 -->
<div id="skill-tree-modal" class="modal">
  <div class="modal-content skill-tree-modal">
    <div class="modal-header">
      <h2>⭐ 스킬 트리</h2>
      <div class="stars-display">
        보유: <span id="prestige-stars">0</span>⭐ | 
        프레스티지: <span id="prestige-count">0</span>회
      </div>
      <button class="modal-close">&times;</button>
    </div>
    <div id="skill-tree-container" class="skill-tree-scroll"></div>
  </div>
</div>
```

- [ ] **Step 2: 스킬 트리 CSS 추가**

```css
/* public/style.css - 추가 */

.skill-tree-modal {
  width: 420px;
  max-height: 80vh;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}

.skill-tree-scroll {
  max-height: 60vh;
  overflow-y: auto;
  padding: 15px;
}

.skill-tree-scroll::-webkit-scrollbar {
  width: 5px;
}

.skill-legend {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 10px;
  font-size: 9px;
  color: #888;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot.unlocked { background: #28a745; }
.legend-dot.available { background: #0066cc; }
.legend-dot.locked { background: #444; border: 1px dashed #666; }

.tier-section {
  margin-bottom: 20px;
}

.tier-label {
  color: #666;
  font-size: 8px;
  text-align: center;
  margin-bottom: 4px;
}

.tier-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 380px;
  margin: 0 auto;
}

.skill-node {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.skill-node.unlocked {
  background: linear-gradient(135deg, #28a745, #20c997);
  box-shadow: 0 0 8px rgba(40, 167, 69, 0.4);
}

.skill-node.available {
  background: linear-gradient(135deg, #0066cc, #0099ff);
  box-shadow: 0 0 8px rgba(0, 102, 204, 0.3);
}

.skill-node.locked {
  background: rgba(60, 60, 60, 0.4);
  border: 1px dashed rgba(100, 100, 100, 0.3);
  cursor: not-allowed;
}

.skill-node.root {
  background: linear-gradient(135deg, #667eea, #764ba2);
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.4);
}

.skill-node:hover:not(.locked) {
  transform: scale(1.2);
  z-index: 100;
}

.skill-tooltip {
  position: absolute;
  top: 44px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 10, 20, 0.98);
  color: white;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 9px;
  width: 200px;
  text-align: left;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  border: 1px solid rgba(255,255,255,0.15);
  line-height: 1.5;
}

.skill-node:hover .skill-tooltip {
  opacity: 1;
}

.tooltip-title {
  font-weight: bold;
  font-size: 11px;
  color: #7bed9f;
  margin-bottom: 5px;
}

.tooltip-desc {
  color: #ccc;
  font-size: 9px;
  margin-bottom: 5px;
}

.tooltip-cost {
  color: gold;
  font-size: 9px;
}

.tooltip-req {
  color: #ff6b6b;
  font-size: 8px;
}

.tooltip-effect {
  color: #70a1ff;
  font-size: 9px;
  border-top: 1px solid #444;
  margin-top: 5px;
  padding-top: 5px;
}
```

---

## Task 12: main.js에 스킬 트리 초기화

**Files:**
- Modify: `server.js` (또는 main.js)

- [ ] **Step 1: DB 초기화 시 새 스키마 사용**

기존 `server.js`에서 DB 초기화 부분에 새 스키마 적용.

---

## Task 13: 통합 테스트

- [ ] **Step 1: 서버 시작 후 기본 기능 확인**

```bash
npm start
```

- [ ] **Step 2: 프레스티지 API 테스트**

```bash
curl http://localhost:3000/api/prestige/preview
curl -X POST http://localhost:3000/api/prestige
curl http://localhost:3000/api/skills
```

- [ ] **Step 3: 스킬 해금 API 테스트**

```bash
curl -X POST http://localhost:3000/api/skill/unlock/click_boost_1
```

---

## Estimated Effort

- **Task 1-7 (Backend):** ~2시간
- **Task 8 (API Routes):** ~30분
- **Task 9-11 (Frontend):** ~1.5시간
- **Task 12-13 (Integration):** ~30분

**Total:** ~4시간

---

**저장:** `docs/superpowers/plans/2026-03-30-prestige-skill-tree.md`