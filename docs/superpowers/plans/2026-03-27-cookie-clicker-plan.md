# 쿠키 클리커 게임 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Node.js + Express + SQLite로 쿠키 클리커 스타일 클릭 게임 구현

**Architecture:** Express 서버가 REST API를 제공하고, SQLite로 데이터를 저장하며, 프론트엔드에서 게임 로직을 처리합니다.

**Tech Stack:** Node.js, Express, SQLite (better-sqlite3), express-session, HTML/CSS/JavaScript

---

## 파일 구조

```
TestWebPage/
├── server.js           # Express 서버 진입점
├── package.json        # 의존성 관리
├── database/
│   ├── init.js         # DB 초기화 스크립트
│   └── game.db         # SQLite 데이터베이스 파일
├── public/             # 정적 파일 (Express가 서빙)
│   ├── index.html      # 메인 페이지
│   ├── style.css       # 스타일시트
│   └── game.js         # 프론트엔드 게임 로직
└── routes/
    └── game.js         # API 라우트
```

---

## Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json`

- [ ] **Step 1: package.json 생성**

```json
{
  "name": "cookie-clicker",
  "version": "1.0.0",
  "description": "Cookie clicker game with Node.js + Express + SQLite",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.2",
    "express-session": "^1.17.3"
  }
}
```

- [ ] **Step 2: 의존성 설치**

Run: `npm install`
Expected: dependencies installed successfully

---

## Task 2: 데이터베이스 초기화

**Files:**
- Create: `database/init.js`

- [ ] **Step 1: database 디렉토리 생성**

Run: `mkdir database`

- [ ] **Step 2: 데이터베이스 초기화 스크립트 작성**

```javascript
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'game.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    cookies INTEGER DEFAULT 0,
    cookies_per_click INTEGER DEFAULT 1,
    cookies_per_second REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS upgrades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    upgrade_type TEXT NOT NULL,
    level INTEGER DEFAULT 0,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(player_id, upgrade_type)
  );
`);

const upgradeTypes = ['click_boost', 'cursor', 'grandma', 'farm'];

module.exports = { db, upgradeTypes };
```

---

## Task 3: Express 서버 설정

**Files:**
- Create: `server.js`

- [ ] **Step 1: 서버 진입점 작성**

```javascript
const express = require('express');
const session = require('express-session');
const path = require('path');
const { db } = require('./database/init');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'cookie-clicker-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next) => {
  const sessionId = req.session.id;
  
  let player = db.prepare('SELECT * FROM players WHERE session_id = ?').get(sessionId);
  
  if (!player) {
    db.prepare('INSERT INTO players (session_id) VALUES (?)').run(sessionId);
    player = db.prepare('SELECT * FROM players WHERE session_id = ?').get(sessionId);
    
    const { upgradeTypes } = require('./database/init');
    const insertUpgrade = db.prepare('INSERT INTO upgrades (player_id, upgrade_type) VALUES (?, ?)');
    upgradeTypes.forEach(type => insertUpgrade.run(player.id, type));
  }
  
  req.player = player;
  next();
});

const gameRoutes = require('./routes/game');
app.use('/api', gameRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

---

## Task 4: API 라우트 구현

**Files:**
- Create: `routes/game.js`

- [ ] **Step 1: routes 디렉토리 생성**

Run: `mkdir routes`

- [ ] **Step 2: 게임 API 라우트 작성**

```javascript
const express = require('express');
const router = express.Router();
const { db, upgradeTypes } = require('../database/init');

const upgradeConfig = {
  click_boost: { baseCost: 10, multiplier: 1.5, cpsBonus: 0, clickBonus: 1 },
  cursor: { baseCost: 15, multiplier: 1.15, cpsBonus: 0.1, clickBonus: 0 },
  grandma: { baseCost: 100, multiplier: 1.15, cpsBonus: 1, clickBonus: 0 },
  farm: { baseCost: 1100, multiplier: 1.15, cpsBonus: 8, clickBonus: 0 }
};

function calculateCost(type, level) {
  const config = upgradeConfig[type];
  return Math.floor(config.baseCost * Math.pow(config.multiplier, level));
}

function recalculateStats(playerId) {
  const upgrades = db.prepare('SELECT upgrade_type, level FROM upgrades WHERE player_id = ?').all(playerId);
  
  let clickBonus = 1;
  let cps = 0;
  
  upgrades.forEach(u => {
    const config = upgradeConfig[u.upgrade_type];
    clickBonus += config.clickBonus * u.level;
    cps += config.cpsBonus * u.level;
  });
  
  db.prepare('UPDATE players SET cookies_per_click = ?, cookies_per_second = ? WHERE id = ?')
    .run(clickBonus, cps, playerId);
  
  return { clickBonus, cps };
}

router.get('/game', (req, res) => {
  const player = req.player;
  const upgrades = db.prepare('SELECT upgrade_type, level FROM upgrades WHERE player_id = ?').all(player.id);
  
  const upgradeList = upgrades.map(u => ({
    type: u.upgrade_type,
    level: u.level,
    cost: calculateCost(u.upgrade_type, u.level)
  }));
  
  res.json({
    cookies: player.cookies,
    cookiesPerClick: player.cookies_per_click,
    cookiesPerSecond: player.cookies_per_second,
    upgrades: upgradeList
  });
});

router.post('/click', (req, res) => {
  const player = req.player;
  const newCookies = player.cookies + player.cookies_per_click;
  
  db.prepare('UPDATE players SET cookies = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newCookies, player.id);
  
  res.json({ cookies: newCookies, cookiesPerClick: player.cookies_per_click });
});

router.post('/upgrade/:type', (req, res) => {
  const player = req.player;
  const type = req.params.type;
  
  if (!upgradeConfig[type]) {
    return res.status(400).json({ error: 'Invalid upgrade type' });
  }
  
  const upgrade = db.prepare('SELECT level FROM upgrades WHERE player_id = ? AND upgrade_type = ?')
    .get(player.id, type);
  
  if (!upgrade) {
    return res.status(404).json({ error: 'Upgrade not found' });
  }
  
  const cost = calculateCost(type, upgrade.level);
  
  if (player.cookies < cost) {
    return res.status(400).json({ error: 'Not enough cookies', cookies: player.cookies, cost });
  }
  
  const newCookies = player.cookies - cost;
  const newLevel = upgrade.level + 1;
  
  db.prepare('UPDATE players SET cookies = ? WHERE id = ?').run(newCookies, player.id);
  db.prepare('UPDATE upgrades SET level = ? WHERE player_id = ? AND upgrade_type = ?')
    .run(newLevel, player.id, type);
  
  const { clickBonus, cps } = recalculateStats(player.id);
  
  res.json({
    cookies: newCookies,
    upgrade: { type, level: newLevel, cost: calculateCost(type, newLevel) },
    cookiesPerClick: clickBonus,
    cookiesPerSecond: cps
  });
});

router.post('/game/reset', (req, res) => {
  const player = req.player;
  
  db.prepare('UPDATE players SET cookies = 0, cookies_per_click = 1, cookies_per_second = 0 WHERE id = ?')
    .run(player.id);
  db.prepare('UPDATE upgrades SET level = 0 WHERE player_id = ?').run(player.id);
  
  res.json({ message: 'Game reset successfully' });
});

router.post('/sync', (req, res) => {
  const player = req.player;
  const { cookies } = req.body;
  
  if (typeof cookies !== 'number') {
    return res.status(400).json({ error: 'Invalid cookies value' });
  }
  
  db.prepare('UPDATE players SET cookies = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(cookies, player.id);
  
  res.json({ cookies });
});

module.exports = router;
```

---

## Task 5: 프론트엔드 HTML

**Files:**
- Create: `public/index.html`

- [ ] **Step 1: public 디렉토리 생성**

Run: `mkdir public`

- [ ] **Step 2: HTML 파일 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>쿠키 클리커</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>쿠키 클리커</h1>
    </header>
    
    <main>
      <section class="game-area">
        <div class="cookie-display">
          <button id="cookie-btn" class="cookie-button">🍪</button>
          <div class="stats">
            <p>쿠키: <span id="cookie-count">0</span>개</p>
            <p>클릭당: <span id="cookies-per-click">1</span>개</p>
            <p>초당: <span id="cookies-per-second">0</span>개</p>
          </div>
        </div>
      </section>
      
      <section class="shop-area">
        <h2>업그레이드 상점</h2>
        <div id="upgrade-list"></div>
      </section>
      
      <section class="actions">
        <button id="reset-btn" class="reset-button">게임 리셋</button>
      </section>
    </main>
  </div>
  
  <script src="game.js"></script>
</body>
</html>
```

---

## Task 6: 프론트엔드 CSS

**Files:**
- Create: `public/style.css`

- [ ] **Step 1: 스타일시트 작성**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.container {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
}

header {
  text-align: center;
  margin-bottom: 20px;
}

h1 {
  color: #333;
  font-size: 2rem;
}

h2 {
  color: #555;
  font-size: 1.2rem;
  margin-bottom: 15px;
}

.game-area {
  text-align: center;
  margin-bottom: 30px;
}

.cookie-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.cookie-button {
  font-size: 80px;
  width: 150px;
  height: 150px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(145deg, #f0f0f0, #d4d4d4);
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.cookie-button:hover {
  transform: scale(1.05);
}

.cookie-button:active {
  transform: scale(0.95);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.stats {
  font-size: 1.1rem;
  color: #333;
}

.stats p {
  margin: 5px 0;
}

.shop-area {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
}

.upgrade-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.upgrade-item:last-child {
  margin-bottom: 0;
}

.upgrade-info {
  flex: 1;
}

.upgrade-name {
  font-weight: bold;
  color: #333;
}

.upgrade-level {
  font-size: 0.85rem;
  color: #666;
}

.upgrade-effect {
  font-size: 0.85rem;
  color: #888;
}

.buy-button {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.buy-button:hover {
  background: #45a049;
}

.buy-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.actions {
  text-align: center;
}

.reset-button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #f44336;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.reset-button:hover {
  background: #da190b;
}

@keyframes cookie-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.cookie-pop {
  animation: cookie-pop 0.15s ease-out;
}
```

---

## Task 7: 프론트엔드 게임 로직

**Files:**
- Create: `public/game.js`

- [ ] **Step 1: 게임 로직 작성**

```javascript
const upgradeNames = {
  click_boost: '클릭 강화',
  cursor: '커서',
  grandma: '할머니',
  farm: '농장'
};

const upgradeEffects = {
  click_boost: '클릭당 +1 쿠키',
  cursor: '초당 +0.1 쿠키',
  grandma: '초당 +1 쿠키',
  farm: '초당 +8 쿠키'
};

let gameState = {
  cookies: 0,
  cookiesPerClick: 1,
  cookiesPerSecond: 0,
  upgrades: []
};

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API Error');
  }
  
  return response.json();
}

async function loadGame() {
  try {
    const data = await fetchAPI('/game');
    gameState = data;
    updateUI();
  } catch (error) {
    console.error('Failed to load game:', error);
  }
}

function updateUI() {
  document.getElementById('cookie-count').textContent = formatNumber(Math.floor(gameState.cookies));
  document.getElementById('cookies-per-click').textContent = gameState.cookiesPerClick;
  document.getElementById('cookies-per-second').textContent = gameState.cookiesPerSecond.toFixed(1);
  
  const upgradeList = document.getElementById('upgrade-list');
  upgradeList.innerHTML = '';
  
  gameState.upgrades.forEach(upgrade => {
    const canAfford = gameState.cookies >= upgrade.cost;
    const item = document.createElement('div');
    item.className = 'upgrade-item';
    item.innerHTML = `
      <div class="upgrade-info">
        <div class="upgrade-name">${upgradeNames[upgrade.type]} Lv.${upgrade.level}</div>
        <div class="upgrade-effect">${upgradeEffects[upgrade.type]}</div>
      </div>
      <button class="buy-button" data-type="${upgrade.type}" ${canAfford ? '' : 'disabled'}>
        구매: ${formatNumber(upgrade.cost)}개
      </button>
    `;
    upgradeList.appendChild(item);
  });
  
  document.querySelectorAll('.buy-button').forEach(btn => {
    btn.addEventListener('click', () => buyUpgrade(btn.dataset.type));
  });
}

function formatNumber(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + '조';
  if (num >= 1e8) return (num / 1e8).toFixed(1) + '억';
  if (num >= 1e4) return (num / 1e4).toFixed(1) + '만';
  return num.toString();
}

async function handleClick() {
  try {
    const cookieBtn = document.getElementById('cookie-btn');
    cookieBtn.classList.remove('cookie-pop');
    void cookieBtn.offsetWidth;
    cookieBtn.classList.add('cookie-pop');
    
    gameState.cookies += gameState.cookiesPerClick;
    updateUI();
    
    await fetchAPI('/click');
  } catch (error) {
    console.error('Click error:', error);
  }
}

async function buyUpgrade(type) {
  try {
    const data = await fetchAPI(`/upgrade/${type}`, { method: 'POST' });
    gameState.cookies = data.cookies;
    gameState.cookiesPerClick = data.cookiesPerClick;
    gameState.cookiesPerSecond = data.cookiesPerSecond;
    
    const upgradeIndex = gameState.upgrades.findIndex(u => u.type === type);
    if (upgradeIndex !== -1) {
      gameState.upgrades[upgradeIndex] = data.upgrade;
    }
    
    updateUI();
  } catch (error) {
    console.error('Upgrade error:', error);
    alert(error.message);
  }
}

async function resetGame() {
  if (!confirm('정말 게임을 리셋하시겠습니까? 모든 진행 상황이 삭제됩니다.')) {
    return;
  }
  
  try {
    await fetchAPI('/game/reset', { method: 'POST' });
    await loadGame();
  } catch (error) {
    console.error('Reset error:', error);
  }
}

function startAutoProduction() {
  setInterval(() => {
    if (gameState.cookiesPerSecond > 0) {
      gameState.cookies += gameState.cookiesPerSecond / 10;
      updateUI();
    }
  }, 100);
}

async function syncWithServer() {
  setInterval(async () => {
    try {
      await fetchAPI('/sync', {
        method: 'POST',
        body: JSON.stringify({ cookies: gameState.cookies })
      });
    } catch (error) {
      console.error('Sync error:', error);
    }
  }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cookie-btn').addEventListener('click', handleClick);
  document.getElementById('reset-btn').addEventListener('click', resetGame);
  
  loadGame();
  startAutoProduction();
  syncWithServer();
});
```

---

## Task 8: 실행 및 테스트

- [ ] **Step 1: 서버 실행**

Run: `npm start`
Expected: Server running at http://localhost:3000

- [ ] **Step 2: 브라우저에서 테스트**

Open: http://localhost:3000
Expected: 쿠키 클리커 게임이 정상 작동

- [ ] **Step 3: 기능 테스트**

- 쿠키 클릭 → 쿠키 증가
- 업그레이드 구매 → 쿠키 차감, 능력치 증가
- 새로고침 → 데이터 유지
- 리셋 버튼 → 게임 초기화