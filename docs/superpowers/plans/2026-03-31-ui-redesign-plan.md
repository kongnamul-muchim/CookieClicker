# UI 개편 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인 화면을 쿠키 중심으로 단순화하고 설정/상점/스킬트리 모달로 분리

**Architecture:** 
- HTML: 메인 화면 구조 변경 (쿠키 중심), 새 모달 추가 (설정, 상점)
- CSS: Flex/Grid 레이아웃으로 쿠키 중앙 배치, 탭 모달 스타일
- JS: 모달 관리, 탭 전환, 버튼 이벤트 수정

**Tech Stack:** Vanilla JS, CSS, HTML (기존 프레임워크 없음)

---

## 파일 구조

### 수정 파일
- `public/index.html:12-126` - 메인 화면 HTML 구조 변경, 새 모달 추가
- `public/style.css:1-1121` - 새 레이아웃 스타일, 탭 모달 스타일
- `public/game-v3.js:1-849` - 모달 관리, 버튼 이벤트 수정, 용어 변경
- `public/skillTree-v3.js:1-172` - 환생 버튼 추가, rebirth 함수 추가
- `public/sounds-v3.js` - 변경 없음 (soundManager는 game-v3.js에서 사용)
- `src/routes/gameRoutes.js` - 백엔드 응답 용어 변경
- `src/services/prestigeCalculator.js` - 주석 용어 변경

---

## Task 1: HTML 구조 변경

**Files:**
- Modify: `public/index.html:12-126`

### Step 1: 메인 화면 HTML 변경

- [ ] **메인 화면 구조 변경 - 기존 요소 삭제**

현재 index.html에서 다음 요소 삭제:
- `<section class="shop-area">` (line 31-34) 삭제 → 상점 모달로 이동
- `<section class="actions">` (line 36-58) 삭제 → 설정 모달 + 하단 버튼으로 변경
- `<div id="stats-modal">` (line 64-97) 삭제 → 설정 모달 탭으로 이동
- `<div id="achievements-modal">` (line 99-107) 삭제 → 설정 모달 탭으로 이동

- [ ] **새 메인 화면 HTML 추가**

```html
<main>
  <section class="game-area">
    <div class="cookie-display">
      <div class="cookie-count-header">
        <span id="cookie-count">0</span> 쿠키
      </div>
      <button id="cookie-btn" class="cookie-button">🍪</button>
      <div class="stats-corner">
        <span>클릭당: <span id="cookies-per-click">1</span></span>
        <span>초당: <span id="cookies-per-second">0</span></span>
      </div>
    </div>
  </section>
  
  <section class="action-buttons">
    <button id="shop-btn" class="action-btn">🛒 상점</button>
    <button id="skill-tree-btn" class="action-btn">🌳 스킬</button>
  </section>
</main>
```

- [ ] **헤더 설정 버튼 추가**

```html
<header>
  <h1>쿠키 클리커</h1>
  <div class="header-controls">
    <button id="theme-toggle" class="theme-toggle" title="테마 전환">🌙</button>
    <button id="settings-btn" class="settings-btn" title="설정">⚙️</button>
  </div>
</header>
```

- [ ] **기존 모달 삭제 및 새 모달 추가**

기존 `stats-modal`, `achievements-modal` 삭제. 새 모달 추가:

```html
<div id="settings-modal" class="modal">
  <div class="modal-content settings-modal-content">
    <div class="modal-header">
      <h2>⚙️ 설정</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="tabs">
      <button class="tab-btn active" data-tab="sound">사운드</button>
      <button class="tab-btn" data-tab="stats">통계</button>
      <button class="tab-btn" data-tab="achievements">업적</button>
    </div>
    <div class="tab-content">
      <div id="sound-tab" class="tab-panel active">
        <div class="sound-toggle-row">
          <button id="sound-toggle" class="sound-btn active">🔊 사운드 ON</button>
          <button id="bgm-toggle" class="sound-btn">🎵 BGM OFF</button>
        </div>
        <div class="volume-controls">
          <label>
            <span>🔊 효과음</span>
            <input type="range" id="sfx-volume" min="0" max="100" value="50">
          </label>
          <label>
            <span>🎵 배경음</span>
            <input type="range" id="bgm-volume" min="0" max="100" value="30">
          </label>
        </div>
      </div>
      <div id="stats-tab" class="tab-panel">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">총 클릭</span>
            <span id="stat-total-clicks" class="stat-value">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">총 획득 쿠키</span>
            <span id="stat-total-cookies" class="stat-value">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">업그레이드 구매</span>
            <span id="stat-total-upgrades" class="stat-value">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">강화 횟수</span>
            <span id="stat-total-enhancements" class="stat-value">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">초월 횟수</span>
            <span id="stat-total-transcends" class="stat-value">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">환생</span>
            <span id="stat-prestige-count" class="stat-value">0</span>
          </div>
        </div>
      </div>
      <div id="achievements-tab" class="tab-panel">
        <div id="achievements-container" class="achievements-grid"></div>
      </div>
    </div>
  </div>
</div>

<div id="shop-modal" class="modal">
  <div class="modal-content shop-modal-content">
    <div class="modal-header">
      <h2>🛒 업그레이드 상점</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="tabs">
      <button class="tab-btn active" data-tab="click">클릭</button>
      <button class="tab-btn" data-tab="auto">자동</button>
      <button class="tab-btn" data-tab="special">특수</button>
    </div>
    <div class="tab-content">
      <div id="click-tab" class="tab-panel active">
        <div id="click-upgrade-list" class="upgrade-list"></div>
      </div>
      <div id="auto-tab" class="tab-panel">
        <div id="auto-upgrade-list" class="upgrade-list"></div>
      </div>
      <div id="special-tab" class="tab-panel">
        <div id="special-upgrade-list" class="upgrade-list"></div>
      </div>
    </div>
  </div>
</div>
```

- [ ] **skill-tree-modal에 환생 버튼 추가**

skill-tree-modal 헤더 아래에 환생 버튼 추가:

```html
<div id="skill-tree-modal" class="modal">
  <div class="modal-content skill-tree-modal">
    <div class="modal-header">
      <h2>🌳 스킬 트리</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="stars-display">
      보유: <span id="prestige-stars">0</span>⭐ | 
      환생: <span id="prestige-count">0</span>회
    </div>
    <button id="rebirth-btn" class="rebirth-button">🔄 환생하기</button>
    <div id="skill-tree-container" class="skill-tree-scroll"></div>
  </div>
</div>
```

- [ ] **리셋 버튼 삭제**

`<button id="reset-btn" class="reset-button">게임 리셋</button>` 삭제 (설정 모달로 이동 가능, 또는 완전 삭제)

---

## Task 2: CSS 스타일 변경

**Files:**
- Modify: `public/style.css:1-1121`

### Step 2: CSS 스타일 변경

- [ ] **메인 화면 레이아웃 CSS**

```css
.game-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.cookie-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.cookie-count-header {
  font-size: 2rem;
  color: var(--accent);
  margin-bottom: 20px;
}

.cookie-count-header span {
  font-weight: bold;
}

.cookie-button {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(145deg, #f5e6d3, #d4a574);
  font-size: 90px;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.15s ease;
  margin: 20px 0;
}

.stats-corner {
  display: flex;
  gap: 20px;
  justify-content: center;
  padding: 10px 20px;
  background: var(--stats-bg);
  border-radius: 10px;
  margin-top: 20px;
}

.stats-corner span {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.stats-corner span span {
  font-weight: bold;
  color: var(--accent);
}

.header-controls {
  display: flex;
  gap: 10px;
}

.settings-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.3s;
}

.settings-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.1);
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.action-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s;
}

.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
```

- [ ] **탭 모달 CSS**

```css
.tabs {
  display: flex;
  gap: 5px;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 5px;
  margin-bottom: 15px;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.2s;
  border-radius: 8px 8px 0 0;
}

.tab-btn:hover {
  background: rgba(0,0,0,0.1);
}

.tab-btn.active {
  color: var(--accent);
  background: rgba(0,0,0,0.1);
  border-bottom: 2px solid var(--accent);
  margin-bottom: -7px;
}

.tab-panel {
  display: none;
}

.tab-panel.active {
  display: block;
}

.settings-modal-content {
  width: 400px;
}

.shop-modal-content {
  width: 500px;
  max-height: 80vh;
}

.upgrade-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 60vh;
  overflow-y: auto;
}
```

- [ ] **환생 버튼 CSS**

```css
.rebirth-button {
  background: linear-gradient(135deg, #ff6b6b, #ffd93d);
  color: #333;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  margin: 10px auto;
  display: block;
  transition: all 0.2s;
}

.rebirth-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.4);
}
```

- [ ] **기존 shop-area, actions 섹션 CSS 삭제**

`.shop-area`, `.actions`, `.control-buttons`, `.volume-controls` (기존) CSS 삭제 또는 수정

---

## Task 3: JavaScript 이벤트 변경

**Files:**
- Modify: `public/game-v3.js:1-849`

### Step 3: JavaScript 이벤트 리스너 변경

- [ ] **기존 이벤트 리스너 삭제 (line 629, 653, 726, 764, 785)**

다음 이벤트 리스너 삭제:
```javascript
// 삭제: line 629 - reset-btn (리셋 버튼 삭제됨)
// 삭제: line 653 - prestige-btn (prestige-btn 삭제됨, 환생 버튼은 skillTree-v3.js)
// 삭제: line 726-739 - stats-btn 및 stats-modal 관련 이벤트
// 삭제: line 764-777 - achievements-btn 및 achievements-modal 관련 이벤트
// 삭제: line 785-849 - prestige() 함수 및 관련 이벤트 → skillTree-v3.js로 이동
```

- [ ] **업그레이드 클릭 이벤트 수정 (line 613)**

기존 `upgrade-list` 이벤트 리스너를 세 개의 컨테이너에 적용:
```javascript
// line 613: upgrade-list → 각 탭 컨테이너에 이벤트 리스너 추가
document.getElementById('click-upgrade-list').addEventListener('click', handleUpgradeClick);
document.getElementById('auto-upgrade-list').addEventListener('click', handleUpgradeClick);
document.getElementById('special-upgrade-list').addEventListener('click', handleUpgradeClick);

function handleUpgradeClick(e) {
  if (e.target.classList.contains('buy-button') && !e.target.disabled) {
    const action = e.target.dataset.action;
    const type = e.target.dataset.type;
    if (action === 'enhance') {
      enhanceUpgrade(type);
    } else if (action === 'special-enhance') {
      specialEnhanceUpgrade(type);
    } else if (action === 'buy-batch') {
      buyUpgradeBatch(type);
    } else {
      buyUpgrade(type);
    }
  }
}
```

- [ ] **설정 모달 탭 전환 이벤트 추가**

```javascript
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const modal = this.closest('.modal-content');
    const tabName = this.dataset.tab;
    
    modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    
    modal.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    modal.querySelector(`#${tabName}-tab`).classList.add('active');
  });
});
```

- [ ] **설정 버튼 이벤트**

```javascript
document.getElementById('settings-btn').addEventListener('click', function() {
  document.getElementById('settings-modal').classList.add('active');
  loadStats();
  loadAchievements();
});
```

- [ ] **상점 버튼 이벤트**

```javascript
document.getElementById('shop-btn').addEventListener('click', function() {
  document.getElementById('shop-modal').classList.add('active');
});
```

- [ ] **업그레이드 리스트 분리**

업그레이드를 카테고리별로 분리:
- click_boost → click-tab
- cursor, grandma, farm, mine, factory, bank → auto-tab
- temple, wizard_tower, portal → special-tab

```javascript
function categorizeUpgrades(upgrades) {
  const clickUpgrades = upgrades.filter(u => u.id === 'click_boost');
  const autoUpgrades = upgrades.filter(u => ['cursor', 'grandma', 'farm', 'mine', 'factory', 'bank'].includes(u.id));
  const specialUpgrades = upgrades.filter(u => ['temple', 'wizard_tower', 'portal'].includes(u.id));
  
  return { clickUpgrades, autoUpgrades, specialUpgrades };
}

function renderUpgradeList(upgrades, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  upgrades.forEach(upgrade => {
    const item = createUpgradeItem(upgrade);
    container.appendChild(item);
  });
}
```

- [ ] **사운드/볼륨 컨트롤 이벤트**

설정 모달의 사운드 탭에서 볼륨 컨트롤 이벤트:
```javascript
document.getElementById('sound-toggle').addEventListener('click', function() {
  soundManager.enabled = !soundManager.enabled;
  this.classList.toggle('active', soundManager.enabled);
  this.textContent = soundManager.enabled ? '🔊 사운드 ON' : '🔇 사운드 OFF';
});

document.getElementById('bgm-toggle').addEventListener('click', function() {
  const enabled = soundManager.toggleBGM();
  this.classList.toggle('active', enabled);
  this.textContent = enabled ? '🎵 BGM ON' : '🎵 BGM OFF';
});

document.getElementById('sfx-volume').addEventListener('input', function() {
  soundManager.setSFXVolume(this.value / 100);
  localStorage.setItem('sfx-volume', this.value);
});

document.getElementById('bgm-volume').addEventListener('input', function() {
  soundManager.setBGMVolume(this.value / 100);
  localStorage.setItem('bgm-volume', this.value);
});

const savedSfxVol = localStorage.getItem('sfx-volume');
if (savedSfxVol) {
  document.getElementById('sfx-volume').value = savedSfxVol;
  soundManager.setSFXVolume(savedSfxVol / 100);
}

const savedBgmVol = localStorage.getItem('bgm-volume');
if (savedBgmVol) {
  document.getElementById('bgm-volume').value = savedBgmVol;
  soundManager.setBGMVolume(savedBgmVol / 100);
}
```

- [ ] **모달 닫기 이벤트**

```javascript
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', function() {
    this.closest('.modal').classList.remove('active');
  });
});

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.remove('active');
    }
  });
});
```

- [ ] **용어 변경 (프레스티지 → 환생)**

game-v3.js에서:
- `prestige()` 함수 → `rebirth()` 함수명 변경
- "프레스티지" → "환생" 텍스트 변경
- `/api/prestige` API 경로는 백엔드에서 변경하지 않음 (API는 유지)

---

## Task 4: 스킬트리 변경

**Files:**
- Modify: `public/skillTree-v3.js:1-172`
- Modify: `public/game-v3.js:785-849` (prestige 함수 이동)

### Step 4: 스킬트리 환생 버튼

- [ ] **showToast export 추가 (game-v3.js)**

game-v3.js line 1에 showToast를 window에 export:
```javascript
// line 11 이후에 추가
window.showToast = showToast;
```

- [ ] **prestige 함수를 skillTree-v3.js로 이동**

game-v3.js line 785-849의 `prestige()` 함수를 skillTree-v3.js로 이동하고 이름 변경:
```javascript
// skillTree-v3.js에 추가
async function rebirth() {
  try {
    const preview = await fetch('/api/prestige/preview').then(r => r.json());
    
    if (preview.totalEnhancements === 0) {
      showToast('강화가 없어 환생할 수 없습니다', 'warning');
      return;
    }
    
    const confirmed = confirm(
      `환생하면:\n` +
      `- 모든 업그레이드 레벨/강화 리셋\n` +
      `- ${preview.stars} ⭐ 획득\n\n` +
      `확인을 누르면 환생합니다.`
    );
    
    if (!confirmed) {
      return;
    }
    
    const response = await fetch('/api/prestige', { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      showToast(`환생 완료! ${result.stars} ⭐ 획득`, 'success');
      gameState.cookies = 0;
      gameState.cookiesPerClick = 1;
      gameState.cookiesPerSecond = 0;
      gameState.upgrades = result.upgrades;
      gameState.effects = {};
      
      updateUI();
      loadSkillTree();
      
      syncEnabled = true;
      syncGame();
    }
  } catch (error) {
    console.error('Rebirth failed:', error);
    syncEnabled = true;
    showToast('환생 실패', 'error');
  }
}
```

- [ ] **환생 버튼 이벤트**

```javascript
document.getElementById('rebirth-btn').addEventListener('click', async function() {
  if (typeof rebirth === 'function') {
    await rebirth();
    await loadSkillTree();
  }
});
```

- [ ] **용어 변경**

skillTree-v3.js에서:
- `prestigeCount` → `rebirthCount` (UI 텍스트만, 변수명은 유지)
- "프레스티지" → "환생" 텍스트 변경

---

## Task 5: 백엔드 용어 변경

**Files:**
- Modify: `src/routes/gameRoutes.js`
- Modify: `src/services/prestigeCalculator.js`

### Step 5: 백엔드 용어 변경

- [ ] **gameRoutes.js 응답 메시지 변경**

"프레스티지" → "환생" 텍스트 변경 (API 경로는 유지)

- [ ] **prestigeCalculator.js 주석 변경**

주석 및 로그 메시지에서 "프레스티지" → "환생" 변경

---

## Task 6: 검증 및 커밋

### Step 6: 검증

- [ ] **서버 실행 확인**

Run: `cd C:\Users\admin\Desktop\HI\TestWebPage && node server.js`
Expected: 서버 시작, http://localhost:3000 접속 가능

- [ ] **UI 확인**

- 메인 화면: 쿠키 중앙, 통계 구석, 버튼 2개
- 설정 모달: 탭 전환 가능 (사운드/통계/업적)
- 상점 모달: 탭 전환 가능 (클릭/자동/특수)
- 스킬트리 모달: 환생 버튼 표시
- 용어: 모든 UI에서 "환생" 표시

- [ ] **커밋**

```bash
git add public/index.html public/style.css public/game-v3.js public/skillTree-v3.js src/routes/gameRoutes.js src/services/prestigeCalculator.js
git commit -m "feat: UI 개편 - 쿠키 중심 메인 화면, 모달 분리, 환생 용어 변경"
```