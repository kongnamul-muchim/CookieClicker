# 쿠키 클리커 UI 개선 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 쿠키 클리커 게임의 UI/UX 개선 (파티클, 다크모드, 반응형, 사운드)

**Architecture:** CSS 변수로 테마 관리, Web Audio API로 사운드, JavaScript로 파티클/애니메이션 제어

**Tech Stack:** CSS (변수, 미디어쿼리, 애니메이션), JavaScript (Web Audio API, localStorage)

---

## 파일 구조

**수정할 파일:**
- `public/style.css` - 다크모드 변수, 반응형, 애니메이션 스타일
- `public/game.js` - 파티클, 진행바, 다크모드 토글 로직
- `public/index.html` - 토글 버튼, 사운드 컨트롤 추가

**새 파일:**
- `public/sounds.js` - 사운드 관리 클래스

---

### Task 1: CSS 변수 및 다크모드 스타일

**Files:**
- Modify: `public/style.css`

- [ ] **Step 1: CSS 변수 정의 (라이트/다크)**

style.css 맨 위에 추가:
```css
:root {
  --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --card-bg: white;
  --card-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  --text-primary: #333;
  --text-secondary: #666;
  --accent: #764ba2;
  --accent-light: #a78bfa;
  --stats-bg: #f8f9fa;
  --upgrade-bg: #f8f9fa;
  --border-color: transparent;
}

[data-theme="dark"] {
  --bg-gradient: linear-gradient(135deg, #1a1825 0%, #211f2d 100%);
  --card-bg: #211f2d;
  --card-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  --text-primary: #c9bed8;
  --text-secondary: #a098b0;
  --accent: #b8a9c9;
  --accent-light: #c9bed8;
  --stats-bg: #252330;
  --upgrade-bg: #252330;
  --border-color: #2d2d5a;
}
```

- [ ] **Step 2: 기존 스타일을 변수로 변경**

body, .container, .stats, .upgrade-item 등의 하드코딩된 색상을 CSS 변수로 교체:
```css
body {
  background: var(--bg-gradient);
}

.container {
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}

.stats {
  background: var(--stats-bg);
}

.stats p {
  color: var(--text-primary);
}

.stats span {
  color: var(--accent);
}

.upgrade-item {
  background: var(--upgrade-bg);
  border: 1px solid var(--border-color);
}

.upgrade-name {
  color: var(--text-primary);
}

.upgrade-details {
  color: var(--text-secondary);
}
```

- [ ] **Step 3: 다크모드용 쿠키 버튼 스타일 추가**

```css
[data-theme="dark"] .cookie-button {
  background: linear-gradient(145deg, #3d3830, #2d2a25);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 30px rgba(184, 169, 201, 0.2);
}
```

- [ ] **Step 4: 변경사항 저장 후 브라우저에서 확인**

---

### Task 2: 모바일 반응형 스타일

**Files:**
- Modify: `public/style.css`

- [ ] **Step 1: 미디어 쿼리 추가 (모바일)**

style.css 맨 아래에 추가:
```css
@media (max-width: 600px) {
  body {
    padding: 10px;
  }
  
  .container {
    padding: 20px;
    border-radius: 15px;
  }
  
  header h1 {
    font-size: 1.8rem;
  }
  
  .cookie-button {
    width: 150px;
    height: 150px;
    font-size: 70px;
  }
  
  .stats p {
    font-size: 1rem;
  }
  
  .upgrade-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .upgrade-name {
    font-size: 1rem;
  }
  
  .buy-button {
    width: 100%;
    padding: 12px;
    font-size: 1.1rem;
  }
  
  .button-group {
    width: 100%;
    flex-direction: column;
  }
  
  .button-group .buy-button {
    width: 100%;
  }
}

@media (max-width: 400px) {
  .cookie-button {
    width: 120px;
    height: 120px;
    font-size: 55px;
  }
}
```

- [ ] **Step 2: 변경사항 저장 후 브라우저 리사이즈로 확인**

---

### Task 3: 업그레이드 카드 개선 (아이콘, 테두리, 호버)

**Files:**
- Modify: `public/style.css`
- Modify: `public/game.js`

- [ ] **Step 1: 업그레이드 카드 개선 스타일 추가**

style.css에 추가:
```css
.upgrade-item {
  background: var(--upgrade-bg);
  border-radius: 12px;
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 2px solid transparent;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.upgrade-item.can-buy {
  border-color: #28a745;
  box-shadow: 0 0 15px rgba(40,167,69,0.3);
}

.upgrade-item.can-buy::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(40,167,69,0.1), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.upgrade-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.12);
}

.upgrade-item.just-bought {
  animation: levelUp 0.5s ease;
}

@keyframes levelUp {
  0% { transform: scale(1); }
  30% { transform: scale(1.05); box-shadow: 0 0 30px rgba(40,167,69,0.6); }
  100% { transform: scale(1); }
}

.upgrade-icon {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  margin-right: 12px;
}

.upgrade-content {
  flex: 1;
}

.upgrade-header {
  display: flex;
  align-items: center;
}
```

- [ ] **Step 2: game.js에 업그레이드 아이콘 매핑 추가**

game.js 상단에 추가:
```javascript
const upgradeIcons = {
  click_boost: '🖱️',
  cursor: '👆',
  grandma: '👵',
  farm: '🚜',
  mine: '⛏️',
  factory: '🏭',
  bank: '🏦',
  temple: '🛕',
  wizard_tower: '🧙',
  portal: '🌀'
};
```

- [ ] **Step 3: renderUpgrades 함수 수정 - 아이콘 추가, can-buy 클래스**

renderUpgrades 함수의 item.innerHTML 부분 수정:
```javascript
const canBuy = gameState.cookies >= upgrade.cost;
const canBuyBatch = upgrade.batchCost && gameState.cookies >= upgrade.batchCost;

item.className = 'upgrade-item' + (canBuy ? ' can-buy' : '');

item.innerHTML = `
  <div class="upgrade-header">
    <div class="upgrade-icon">${upgradeIcons[upgrade.type] || '🍪'}</div>
    <div class="upgrade-content">
      <div class="upgrade-info">
        <div class="upgrade-name">${name} (${levelText})${enhancementText}</div>
        <div class="upgrade-details">
          <span>${description}</span>
          ${specialDesc ? `<span class="special-effect">${specialDesc}</span>` : ''}
          <span class="upgrade-cost">${costText}</span>
        </div>
      </div>
    </div>
  </div>
  ${buttonHtml}
`;
```

- [ ] **Step 4: 레벨업 애니메이션 함수 추가**

```javascript
function playLevelUpAnimation(type) {
  const items = document.querySelectorAll('.upgrade-item');
  items.forEach(item => {
    const btn = item.querySelector(`[data-type="${type}"]`);
    if (btn) {
      item.classList.add('just-bought');
      
      const rect = item.getBoundingClientRect();
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const p = document.createElement('div');
          p.className = 'levelup-particle';
          p.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: gold;
            border-radius: 50%;
            left: ${rect.left + Math.random() * rect.width}px;
            top: ${rect.top}px;
            pointer-events: none;
            z-index: 1000;
          `;
          document.body.appendChild(p);
          
          p.animate([
            { transform: 'translateY(0) scale(1)', opacity: 1 },
            { transform: 'translateY(-30px) scale(0)', opacity: 0 }
          ], { duration: 400, easing: 'ease-out', fill: 'forwards' });
          
          setTimeout(() => p.remove(), 400);
        }, i * 40);
      }
      
      setTimeout(() => item.classList.remove('just-bought'), 500);
    }
  });
}
```

- [ ] **Step 5: buyUpgrade, buyUpgradeBatch 함수에 애니메이션 호출 추가**

buyUpgrade 함수의 response.ok 블록에 추가:
```javascript
if (response.ok) {
  gameState = await response.json();
  playLevelUpAnimation(type);
  renderUpgrades();
  updateUI();
}
```

---

### Task 4: 쿠키 클릭 파티클 효과

**Files:**
- Modify: `public/game.js`
- Modify: `public/style.css`

- [ ] **Step 1: 파티클 스타일 추가**

style.css에 추가:
```css
.cookie-particle {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1000;
}

.cookie-sparkle {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1001;
  box-shadow: 0 0 8px gold;
}
```

- [ ] **Step 2: handleClick 함수에 파티클 효과 추가**

handleClick 함수 수정:
```javascript
async function handleClick(event) {
  const btn = document.getElementById('cookie-btn');
  btn.classList.add('clicked');
  setTimeout(() => btn.classList.remove('clicked'), 150);
  
  const effects = gameState.effects || {};
  let earned = gameState.cookiesPerClick;
  let isCritical = false;
  let critMultiplier = 1;
  
  if (effects.clickCpsBonus) {
    earned += Math.floor(gameState.cookiesPerSecond * 0.01);
  }
  
  const totalCritChance = effects.clickCritChance || 0;
  const critMulti = effects.clickCritMultiplier || 1;
  
  critMultiplier = tryCritical(totalCritChance, critMulti);
  if (critMultiplier > 1) {
    isCritical = true;
    earned = Math.floor(earned * critMultiplier);
  }
  
  gameState.cookies += earned;
  updateUI();
  
  createFloatingCookie(event, earned, isCritical);
  playClickParticles(event, isCritical);
  playClickSound();
  
  try {
    await fetch('/api/click', { method: 'POST' });
  } catch (error) {
    console.error('Click sync failed:', error);
  }
}
```

- [ ] **Step 3: 파티클 생성 함수 추가**

```javascript
function playClickParticles(e, isCritical) {
  const colors = ['#d4a574', '#c9956a', '#b8845a', '#deb887', '#f5deb3'];
  const sparkleColors = ['gold', '#ffd700', '#ffec8b'];
  const x = e.clientX;
  const y = e.clientY;
  
  const particleCount = isCritical ? 18 : 10;
  const sparkleCount = isCritical ? 8 : 4;
  
  for (let i = 0; i < particleCount; i++) {
    setTimeout(() => {
      const crumb = document.createElement('div');
      crumb.className = 'cookie-particle';
      const size = 6 + Math.random() * 8;
      crumb.style.width = size + 'px';
      crumb.style.height = size + 'px';
      crumb.style.background = colors[Math.floor(Math.random() * colors.length)];
      crumb.style.left = x + 'px';
      crumb.style.top = y + 'px';
      document.body.appendChild(crumb);
      
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 60;
      
      crumb.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist + 20}px)) scale(0.1)`, opacity: 0 }
      ], { duration: 300, easing: 'ease-out', fill: 'forwards' });
      
      setTimeout(() => crumb.remove(), 300);
    }, i * 4);
  }
  
  for (let i = 0; i < sparkleCount; i++) {
    setTimeout(() => {
      const sp = document.createElement('div');
      sp.className = 'cookie-sparkle';
      const size = 4 + Math.random() * 4;
      sp.style.width = size + 'px';
      sp.style.height = size + 'px';
      sp.style.background = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
      sp.style.left = x + 'px';
      sp.style.top = y + 'px';
      document.body.appendChild(sp);
      
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 40;
      
      sp.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(0)`, opacity: 0 }
      ], { duration: 250, easing: 'ease-out', fill: 'forwards' });
      
      setTimeout(() => sp.remove(), 250);
    }, i * 5);
  }
}
```

---

### Task 5: 진행바 시스템

**Files:**
- Modify: `public/style.css`
- Modify: `public/game.js`

- [ ] **Step 1: 진행바 스타일 추가**

style.css에 추가:
```css
.progress-container {
  margin-top: 8px;
}

.progress-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

[data-theme="dark"] .progress-bar {
  background: #2d2d5a;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
  background: linear-gradient(90deg, #28a745, #20c997);
}

.progress-fill.high {
  background: linear-gradient(90deg, #ffc107, #ffdb4d);
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 2px;
}
```

- [ ] **Step 2: renderUpgrades 함수에 진행바 추가**

upgrade-details 안에 진행바 HTML 추가:
```javascript
<div class="progress-container">
  <div class="progress-bar">
    <div class="progress-fill ${progressPercent >= 90 ? 'high' : ''}" style="width: ${progressPercent}%"></div>
  </div>
  <div class="progress-text">
    <span>${formatNumber(gameState.cookies)} / ${formatNumber(upgrade.cost)}</span>
    <span>${progressPercent}%</span>
  </div>
</div>
```

- [ ] **Step 3: 진행률 계산 로직 추가**

renderUpgrades 함수 시작 부분에:
```javascript
function calculateProgress(current, target) {
  if (target <= 0) return 100;
  return Math.min(100, Math.floor((current / target) * 100));
}
```

---

### Task 6: 다크모드 토글

**Files:**
- Modify: `public/index.html`
- Modify: `public/game.js`

- [ ] **Step 1: 토글 버튼 HTML 추가**

index.html header 안에 추가:
```html
<header>
  <h1>쿠키 클리커</h1>
  <button id="theme-toggle" class="theme-toggle" title="테마 전환">
    🌙
  </button>
</header>
```

- [ ] **Step 2: 토글 버튼 스타일 추가**

style.css에 추가:
```css
.theme-toggle {
  position: absolute;
  top: 30px;
  right: 30px;
  background: rgba(255,255,255,0.2);
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 10px;
  transition: all 0.3s;
}

.theme-toggle:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.1);
}

[data-theme="dark"] .theme-toggle {
  background: rgba(255,255,255,0.1);
}
```

container에 position: relative 추가:
```css
.container {
  position: relative;
  /* 기존 스타일 유지 */
}
```

- [ ] **Step 3: 테마 토글 함수 추가**

game.js에 추가:
```javascript
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('theme-toggle').textContent = '☀️';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const btn = document.getElementById('theme-toggle');
  
  if (current === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    btn.textContent = '🌙';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    btn.textContent = '☀️';
  }
}

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
```

- [ ] **Step 4: loadGame 호출 전 initTheme 호출**

```javascript
initTheme();
loadGame();
startAutoProduction();
startSync();
```

---

### Task 7: 사운드 시스템

**Files:**
- Create: `public/sounds.js`
- Modify: `public/index.html`
- Modify: `public/game.js`

- [ ] **Step 1: sounds.js 파일 생성**

```javascript
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.bgmEnabled = false;
    this.volume = 0.5;
    this.bgmGain = null;
    this.bgmOscillator = null;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.05);
    
    gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.1);
  }

  startBGM() {
    if (this.bgmOscillator) return;
    this.init();
    
    this.bgmGain = this.audioContext.createGain();
    this.bgmGain.connect(this.audioContext.destination);
    this.bgmGain.gain.setValueAtTime(this.volume * 0.1, this.audioContext.currentTime);
    
    this.playBGMLoop();
  }

  playBGMLoop() {
    if (!this.bgmEnabled) return;
    
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00];
    const note = notes[Math.floor(Math.random() * notes.length)];
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note, this.audioContext.currentTime);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(this.volume * 0.08, this.audioContext.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.8);
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.8);
    
    this.bgmTimeout = setTimeout(() => this.playBGMLoop(), 1000 + Math.random() * 2000);
  }

  stopBGM() {
    this.bgmEnabled = false;
    if (this.bgmTimeout) {
      clearTimeout(this.bgmTimeout);
    }
  }

  toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
    return this.bgmEnabled;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
  }
}

const soundManager = new SoundManager();
```

- [ ] **Step 2: index.html에 sounds.js 로드**

```html
<script src="sounds.js"></script>
<script src="game.js"></script>
```

- [ ] **Step 3: 사운드 컨트롤 UI 추가**

index.html의 actions 섹션에 추가:
```html
<section class="actions">
  <div class="sound-controls">
    <button id="sound-toggle" class="sound-btn">🔊 사운드</button>
    <button id="bgm-toggle" class="sound-btn">🎵 BGM</button>
  </div>
  <button id="reset-btn" class="reset-button">게임 리셋</button>
</section>
```

- [ ] **Step 4: 사운드 컨트롤 스타일 추가**

```css
.sound-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 15px;
}

.sound-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.sound-btn:hover {
  background: rgba(255,255,255,0.3);
}

.sound-btn.active {
  background: #28a745;
  color: white;
}
```

- [ ] **Step 5: game.js에 사운드 연결**

```javascript
function playClickSound() {
  soundManager.playClick();
}

document.getElementById('sound-toggle').addEventListener('click', function() {
  soundManager.enabled = !soundManager.enabled;
  this.classList.toggle('active', soundManager.enabled);
  this.textContent = soundManager.enabled ? '🔊 사운드' : '🔇 사운드';
});

document.getElementById('bgm-toggle').addEventListener('click', function() {
  const enabled = soundManager.toggleBGM();
  this.classList.toggle('active', enabled);
  this.textContent = enabled ? '🎵 BGM' : '🎵 BGM';
});
```

---

### Task 8: 최종 테스트 및 정리

- [ ] **Step 1: 모든 기능 브라우저에서 테스트**

테스트 항목:
- [ ] 다크모드 토글 작동
- [ ] 모바일 크기에서 레이아웃 확인
- [ ] 쿠키 클릭 파티클 작동
- [ ] 업그레이드 카드 아이콘 표시
- [ ] 구매 가능한 카드 테두리 효과
- [ ] 레벨업 애니메이션
- [ ] 진행바 표시
- [ ] 사운드 ON/OFF 작동
- [ ] BGM 작동

- [ ] **Step 2: 변경사항 커밋**

```bash
git add public/style.css public/game.js public/index.html public/sounds.js
git commit -m "feat: UI 개선 - 다크모드, 파티클, 반응형, 사운드"
```