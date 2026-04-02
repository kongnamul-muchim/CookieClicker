# Cookie Clicker Vercel 마이그레이션 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Express + SQLite 기반 Cookie Clicker 를 Vercel 서버리스 + Vercel KV (Redis) 로 마이그레이션

**Architecture:** 
- Express 서버 → Vercel API Routes (서버리스 함수)
- SQLite (파일 DB) → Vercel KV (Redis)
- express-session → Redis-based session (upstash/kv)
- 정적 파일은 Vercel 의 automatic static deployment 활용

**Tech Stack:** 
- Vercel (배포 플랫폼)
- Vercel KV (Redis 호환 데이터스토어)
- Next.js API Routes 호환 서버리스 함수

---

## 파일 구조 변경 요약

**생성:**
- `api/` - Vercel API Routes
- `vercel.json` - Vercel 설정
- `lib/kv.ts` - Vercel KV 래퍼
- `lib/session.ts` - 세션 관리

**수정:**
- `src/repositories/*.js` - SQLite → KV 변환
- `src/services/*.js` - 세션 ID 기반 조회 수정
- `public/index.html` - API 엔드포인트 상대 경로로 수정

**삭제:**
- `server.js` - Vercel 에서 불필요
- `database/init.js` - SQLite 초기화 코드

---

### Task 1: Vercel KV 설정 및 래퍼 작성

**Files:**
- Create: `lib/kv.js`
- Create: `.env.local` (로컬 개발용)

- [ ] **Step 1: Vercel KV 래퍼 작성**

```javascript
// lib/kv.js
import { kv } from '@vercel/kv';

export async function initKV() {
  // Vercel 환경에서는 자동 연결
  // 로컬에서는 REDIS_URL 필요
  return kv;
}

export async function getPlayer(sessionId) {
  const player = await kv.get(`player:${sessionId}`);
  return player ? JSON.parse(player) : null;
}

export async function setPlayer(sessionId, player) {
  await kv.set(`player:${sessionId}`, JSON.stringify(player));
}

export async function createPlayer(sessionId, initialData) {
  const player = {
    id: Date.now().toString(),
    session_id: sessionId,
    cookies: 0,
    cookies_per_click: 1,
    cookies_per_second: 0,
    prestige_count: 0,
    prestige_stars: 0,
    total_clicks: 0,
    total_cookies_earned: 0,
    total_upgrades_bought: 0,
    total_enhancements: 0,
    total_transcends: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...initialData
  };
  await setPlayer(sessionId, player);
  return player;
}

export async function updatePlayer(sessionId, updates) {
  const player = await getPlayer(sessionId);
  if (!player) throw new Error('Player not found');
  
  const updated = {
    ...player,
    ...updates,
    updated_at: new Date().toISOString()
  };
  await setPlayer(sessionId, updated);
  return updated;
}

export async function incrementStat(sessionId, stat, amount = 1) {
  const player = await getPlayer(sessionId);
  if (!player) throw new Error('Player not found');
  
  const current = player[stat] || 0;
  return await updatePlayer(sessionId, { [stat]: current + amount });
}
```

- [ ] **Step 2: package.json 에 Vercel KV 추가**

```bash
npm install @vercel/kv
```

```json
// package.json 수정
{
  "dependencies": {
    "@vercel/kv": "^1.0.0",
    "cookie-parser": "^1.4.7",
    "express": "^4.18.2",
    ...
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/kv.js package.json
git commit -m "feat: add Vercel KV wrapper for Redis operations"
```

---

### Task 2: PlayerRepository KV 변환

**Files:**
- Modify: `src/repositories/playerRepository.js`
- Create: `src/repositories/kvPlayerRepository.js`

- [ ] **Step 1: KV 기반 Repository 작성**

```javascript
// src/repositories/kvPlayerRepository.js
const { getPlayer, setPlayer, createPlayer, updatePlayer, incrementStat } = require('../../lib/kv');

class KVPlayerRepository {
  async findBySessionId(sessionId) {
    return await getPlayer(sessionId);
  }

  async findById(playerId) {
    // KV 에서는 sessionId 가 primary key
    // playerId 는 legacy 용도로만 사용
    const players = await this.getAllPlayers();
    return players.find(p => p.id === playerId) || null;
  }

  async create(sessionId) {
    return await createPlayer(sessionId, {});
  }

  async update(playerId, updates) {
    // playerId 대신 sessionId 사용 필요
    // 상위 service 에서 sessionId 전달받도록 수정
    const player = await this.findById(playerId);
    if (!player) throw new Error('Player not found');
    return await updatePlayer(player.session_id, updates);
  }

  async updateBySession(sessionId, updates) {
    return await updatePlayer(sessionId, updates);
  }

  async incrementStat(sessionId, stat, amount = 1) {
    return await incrementStat(sessionId, stat, amount);
  }

  async getStats(sessionId) {
    const player = await getPlayer(sessionId);
    if (!player) return null;
    
    return {
      total_clicks: player.total_clicks || 0,
      total_cookies_earned: player.total_cookies_earned || 0,
      total_upgrades_bought: player.total_upgrades_bought || 0,
      total_enhancements: player.total_enhancements || 0,
      total_transcends: player.total_transcends || 0,
      prestige_count: player.prestige_count || 0,
      prestige_stars: player.prestige_stars || 0
    };
  }

  async getAllPlayers() {
    const keys = await kv.keys('player:*');
    const players = [];
    for (const key of keys) {
      const data = await kv.get(key);
      if (data) players.push(JSON.parse(data));
    }
    return players;
  }
}

module.exports = KVPlayerRepository;
```

- [ ] **Step 2: Commit**

```bash
git add src/repositories/kvPlayerRepository.js
git commit -m "feat: add KV-based player repository"
```

---

### Task 3: UpgradeRepository KV 변환

**Files:**
- Create: `src/repositories/kvUpgradeRepository.js`

- [ ] **Step 1: KV 기반 Upgrade Repository 작성**

```javascript
// src/repositories/kvUpgradeRepository.js
const { kv } = require('@vercel/kv');

class KVUpgradeRepository {
  async getPlayerUpgrades(sessionId) {
    const data = await kv.get(`upgrades:${sessionId}`);
    return data ? JSON.parse(data) : [];
  }

  async upsertUpgrade(sessionId, upgradeData) {
    const upgrades = await this.getPlayerUpgrades(sessionId);
    const existingIndex = upgrades.findIndex(u => u.upgrade_type === upgradeData.upgrade_type);
    
    if (existingIndex >= 0) {
      upgrades[existingIndex] = { ...upgrades[existingIndex], ...upgradeData };
    } else {
      upgrades.push(upgradeData);
    }
    
    await kv.set(`upgrades:${sessionId}`, JSON.stringify(upgrades));
    return upgrades;
  }

  async getUpgrade(sessionId, upgradeType) {
    const upgrades = await this.getPlayerUpgrades(sessionId);
    return upgrades.find(u => u.upgrade_type === upgradeType) || null;
  }

  async resetSpecialEnhancement(sessionId, upgradeType) {
    const upgrades = await this.getPlayerUpgrades(sessionId);
    const upgrade = upgrades.find(u => u.upgrade_type === upgradeType);
    if (upgrade) {
      upgrade.special_enhancement = 0;
      await kv.set(`upgrades:${sessionId}`, JSON.stringify(upgrades));
    }
    return upgrade;
  }
}

module.exports = KVUpgradeRepository;
```

- [ ] **Step 2: Commit**

```bash
git add src/repositories/kvUpgradeRepository.js
git commit -m "feat: add KV-based upgrade repository"
```

---

### Task 4: SkillRepository KV 변환

**Files:**
- Create: `src/repositories/kvSkillRepository.js`

- [ ] **Step 1: KV 기반 Skill Repository 작성**

```javascript
// src/repositories/kvSkillRepository.js
const { kv } = require('@vercel/kv');

class KVSkillRepository {
  async getUnlockedSkills(sessionId) {
    const data = await kv.get(`skills:${sessionId}`);
    return data ? JSON.parse(data) : [];
  }

  async unlockSkill(sessionId, skillId) {
    const skills = await this.getUnlockedSkills(sessionId);
    if (!skills.find(s => s.skill_id === skillId)) {
      skills.push({ skill_id: skillId, unlocked_at: new Date().toISOString() });
      await kv.set(`skills:${sessionId}`, JSON.stringify(skills));
    }
    return skills;
  }

  async updatePrestigeData(sessionId, prestigeCount, prestigeStars) {
    // Player KV 업데이트는 playerRepository 에서 처리
    // Skill 은 unlock 기록만 관리
    return await this.getUnlockedSkills(sessionId);
  }

  async updatePrestigeStars(sessionId, stars) {
    // Player KV 업데이트 필요
    const { updatePlayer } = require('../../lib/kv');
    return await updatePlayer(sessionId, { prestige_stars: stars });
  }
}

module.exports = KVSkillRepository;
```

- [ ] **Step 2: Commit**

```bash
git add src/repositories/kvSkillRepository.js
git commit -m "feat: add KV-based skill repository"
```

---

### Task 5: AchievementRepository KV 변환

**Files:**
- Create: `src/repositories/kvAchievementRepository.js`

- [ ] **Step 1: KV 기반 Achievement Repository 작성**

```javascript
// src/repositories/kvAchievementRepository.js
const { kv } = require('@vercel/kv');

class KVAchievementRepository {
  async getPlayerAchievements(sessionId) {
    const data = await kv.get(`achievements:${sessionId}`);
    return data ? JSON.parse(data) : [];
  }

  async unlockAchievement(sessionId, achievementId) {
    const achievements = await this.getPlayerAchievements(sessionId);
    if (!achievements.find(a => a.achievement_id === achievementId)) {
      achievements.push({ achievement_id: achievementId, unlocked_at: new Date().toISOString() });
      await kv.set(`achievements:${sessionId}`, JSON.stringify(achievements));
      return true;
    }
    return false;
  }
}

module.exports = KVAchievementRepository;
```

- [ ] **Step 2: Commit**

```bash
git add src/repositories/kvAchievementRepository.js
git commit -m "feat: add KV-based achievement repository"
```

---

### Task 6: Container KV 전환

**Files:**
- Modify: `src/container.js`

- [ ] **Step 1: Container KV 사용하도록 수정**

```javascript
// src/container.js
const KVPlayerRepository = require('./repositories/kvPlayerRepository');
const KVUpgradeRepository = require('./repositories/kvUpgradeRepository');
const KVSkillRepository = require('./repositories/kvSkillRepository');
const KVAchievementRepository = require('./repositories/kvAchievementRepository');

const PlayerService = require('./services/playerService');
const UpgradeService = require('./services/upgradeService');
const SkillService = require('./services/skillService');
const StatsCalculator = require('./services/statsCalculator');
const PrestigeCalculator = require('./services/prestigeCalculator');
const AchievementService = require('./services/achievementService');

class Container {
  constructor() {
    this.playerRepository = new KVPlayerRepository();
    this.upgradeRepository = new KVUpgradeRepository();
    this.skillRepository = new KVSkillRepository();
    this.achievementRepository = new KVAchievementRepository();
    
    this.playerService = new PlayerService(this.playerRepository);
    this.upgradeService = new UpgradeService(this.playerRepository, this.upgradeRepository);
    this.skillService = new SkillService(this.skillRepository, this.playerRepository);
    this.statsCalculator = new StatsCalculator();
    this.prestigeCalculator = new PrestigeCalculator();
    this.achievementService = new AchievementService(this.achievementRepository);
  }

  getPlayerService() { return this.playerService; }
  getUpgradeService() { return this.upgradeService; }
  getSkillService() { return this.skillService; }
  getStatsCalculator() { return this.statsCalculator; }
  getPrestigeCalculator() { return this.prestigeCalculator; }
  getAchievementService() { return this.achievementService; }
  getSkillRepository() { return this.skillRepository; }
}

module.exports = Container;
```

- [ ] **Step 2: Commit**

```bash
git add src/container.js
git commit -m "refactor: switch container to use KV repositories"
```

---

### Task 7: Vercel API Routes 생성

**Files:**
- Create: `api/game/index.js`
- Create: `api/click/index.js`
- Create: `api/upgrade/[type]/index.js`
- Create: `api/game/reset/index.js`
- Create: `api/prestige/index.js`
- Create: `api/skill/unlock/[skillId]/index.js`
- Create: `api/skills/index.js`
- Create: `api/player/index.js`
- Create: `api/stats/index.js`
- Create: `api/sync/index.js`
- Create: `api/achievements/index.js`

- [ ] **Step 1: 게임 상태 API 작성**

```javascript
// api/game/index.js
import { kv } from '@vercel/kv';
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  let sessionId = cookies.player_id;

  if (!sessionId) {
    sessionId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('Set-Cookie', cookie.serialize('player_id', sessionId, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      path: '/',
    }));
  }

  const Container = require('../../src/container');
  const container = new Container();
  const playerService = container.getPlayerService();
  const upgradeService = container.getUpgradeService();
  const statsCalculator = container.getStatsCalculator();
  const skillService = container.getSkillService();

  let player = await playerService.playerRepository.findBySessionId(sessionId);
  if (!player) {
    player = await playerService.playerRepository.create(sessionId);
  }

  const upgrades = await upgradeService.getUpgradesForPlayer(sessionId);
  const unlockedSkills = await skillService.getUnlockedSkills(sessionId);
  const skillEffects = skillService.getSkillEffects(unlockedSkills);
  
  const { cookiesPerClick, cookiesPerSecond, effects, clickBoostMultiplier } = 
    statsCalculator.calculateStatsWithSkills(upgrades, player.cookies, skillEffects);
  
  const upgradeList = upgradeService.buildUpgradeState(upgrades, effects);
  
  res.status(200).json({
    cookies: player.cookies,
    cookiesPerClick,
    cookiesPerSecond,
    upgrades: upgradeList,
    effects,
    clickBoostMultiplier,
    prestigeCount: player.prestige_count || 0,
    prestigeStars: player.prestige_stars || 0
  });
}
```

- [ ] **Step 2: 클릭 API 작성**

```javascript
// api/click/index.js
import { kv } from '@vercel/kv';
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const sessionId = cookies.player_id;

  if (!sessionId) {
    return res.status(401).json({ error: 'No session' });
  }

  const Container = require('../../src/container');
  const container = new Container();
  const playerService = container.getPlayerService();
  const upgradeService = container.getUpgradeService();
  const statsCalculator = container.getStatsCalculator();
  const achievementService = container.getAchievementService();

  let player = await playerService.playerRepository.findBySessionId(sessionId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const upgrades = await upgradeService.getUpgradesForPlayer(sessionId);
  const { cookiesPerClick, effects } = statsCalculator.calculateStats(upgrades, player.cookies);
  
  let earned = cookiesPerClick;
  
  if (effects.clickCpsBonus) {
    const { cookiesPerSecond } = statsCalculator.calculateStats(upgrades, player.cookies);
    earned += Math.floor(cookiesPerSecond * 0.01);
  }
  
  const newCookies = player.cookies + earned;
  await playerService.updateCookies(sessionId, newCookies);
  await playerService.playerRepository.incrementStat(sessionId, 'total_clicks', 1);
  await playerService.playerRepository.incrementStat(sessionId, 'total_cookies_earned', earned);
  
  const stats = await playerService.playerRepository.getStats(sessionId);
  const newAchievements = await achievementService.checkAndUnlockAchievements(sessionId, stats);
  
  res.status(200).json({ 
    cookies: newCookies, 
    earned,
    clickCritChance: effects.clickCritChance,
    clickCritMultiplier: effects.clickCritMultiplier,
    newAchievements
  });
}
```

- [ ] **Step 3: 나머지 API 라우트 작성** (upgrade, prestige, skill, etc.)

- [ ] **Step 4: Commit**

```bash
git add api/
git commit -m "feat: add Vercel API routes"
```

---

### Task 8: Vercel 설정 파일 생성

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: vercel.json 작성**

```json
{
  "version": 2,
  "buildCommand": "npm install",
  "outputDirectory": "public",
  "devCommand": "npm install",
  "framework": null,
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

- [ ] **Step 2: .gitignore 업데이트**

```
# Vercel
.vercel

# Environment
.env.local
```

- [ ] **Step 3: Commit**

```bash
git add vercel.json .gitignore
git commit -m "chore: add Vercel configuration"
```

---

### Task 9: package.json 스크립트 수정

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 스크립트 추가**

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "vercel dev",
    "build": "echo 'No build step needed'",
    "deploy": "vercel --prod"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add Vercel deployment scripts"
```

---

### Task 10: public/index.html API 경로 수정

**Files:**
- Modify: `public/index.html` (또는 game.js)

- [ ] **Step 1: API 호출 경로 확인 및 수정**

```javascript
// game.js 내 fetch 호출 확인
// 예: fetch('/api/game') → 그대로 사용 (Vercel 에서 지원)
```

- [ ] **Step 2: Commit**

```bash
git add public/
git commit -m "fix: ensure API paths are Vercel-compatible"
```

---

### Task 11: Vercel 배포 및 테스트

- [ ] **Step 1: Vercel CLI 설치**

```bash
npm install -g vercel
```

- [ ] **Step 2: Vercel 로그인**

```bash
vercel login
```

- [ ] **Step 3: 프로젝트 연결**

```bash
vercel link
```

- [ ] **Step 4: Vercel KV 생성**

Vercel 대시보드에서:
1. Storage → Create Database → KV
2. 프로젝트 연결

- [ ] **Step 5: 환경 변수 설정**

Vercel 대시보드 → Settings → Environment Variables:
- `KV_URL` (자동 생성)
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

- [ ] **Step 6: 배포**

```bash
vercel --prod
```

- [ ] **Step 7: 테스트**

배포된 URL 에서:
- 게임 로딩 확인
- 쿠키 클릭 작동 확인
- 업그레이드 구매 확인
- 세션 유지 확인 (새로고침 후 데이터 유지)

---

### Task 12: 포트폴리오 링크 업데이트

**Files:**
- Modify: `C:\Users\admin\Desktop\HI\Projects\portfolio\src\content\projects\cookie-clicker.md`

- [ ] **Step 1: demo URL 변경**

```markdown
---
title: Cookie Clicker
type: web
demo: https://cookie-clicker-xxxx.vercel.app
github: https://github.com/kongnamul-muchim/CookieClicker
---
```

- [ ] **Step 2: 포트폴리오 빌드 및 배포**

```bash
cd ../portfolio
npm run build
git add .
git commit -m "docs: update Cookie Clicker demo link to Vercel"
git push
```

---

## 완료 조건

- [ ] Vercel 에서 게임 정상 작동
- [ ] 세션 데이터 유지 확인
- [ ] 모든 업그레이드/스킬/프리스티지 작동
- [ ] 포트폴리오 링크 업데이트 완료
