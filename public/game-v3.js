function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
window.showToast = showToast;

let gameState = {
  cookies: 0,
  cookiesPerClick: 1,
  cookiesPerSecond: 0,
  upgrades: [],
  effects: {}
};

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

const upgradeNames = {
  click_boost: '클릭 강화',
  cursor: '커서',
  grandma: '할머니',
  farm: '농장',
  mine: '광산',
  factory: '공장',
  bank: '은행',
  temple: '사원',
  wizard_tower: '마법사 탑',
  portal: '포털'
};

const upgradeDescriptions = {
  click_boost: '클릭당 +1 쿠키',
  cursor: '초당 +0.1 쿠키',
  grandma: '초당 +1 쿠키',
  farm: '초당 +8 쿠키',
  mine: '초당 +47 쿠키',
  factory: '초당 +260 쿠키',
  bank: '초당 +1,400 쿠키',
  temple: '초당 +7,800 쿠키',
  wizard_tower: '초당 +44,000 쿠키',
  portal: '초당 +260,000 쿠키'
};

function formatNumber(num) {
  if (num >= 1e12) {
    return (num / 1e12).toFixed(2) + '조';
  }
  if (num >= 1e8) {
    return (num / 1e8).toFixed(2) + '억';
  }
  if (num >= 1e4) {
    return (num / 1e4).toFixed(2) + '만';
  }
  return Math.floor(num).toLocaleString();
}

function calculateProgress(current, target) {
  if (target <= 0) return 100;
  return Math.min(100, Math.floor((current / target) * 100));
}

function updateUI() {
  document.getElementById('cookie-count').textContent = formatNumber(gameState.cookies);
  document.getElementById('cookies-per-click').textContent = formatNumber(gameState.cookiesPerClick);
  document.getElementById('cookies-per-second').textContent = formatNumber(gameState.cookiesPerSecond);
}

function updateUpgradeButtons() {
  const items = document.querySelectorAll('.upgrade-item');
  items.forEach(item => {
    const type = item.dataset.type;
    const upgrade = gameState.upgrades.find(u => u.type === type);
    if (!upgrade) return;

    const canAfford = gameState.cookies >= upgrade.cost;
    const canAffordBatch = upgrade.batchCost && gameState.cookies >= upgrade.batchCost;

    item.classList.remove('can-afford-single', 'can-afford-batch');
    if (canAffordBatch) {
      item.classList.add('can-afford-batch');
    } else if (canAfford) {
      item.classList.add('can-afford-single');
    }

    const buyBtn = item.querySelector('[data-action="buy"]');
    if (buyBtn) {
      buyBtn.disabled = !canAfford;
      buyBtn.textContent = '+1';
    }

    const batchBtn = item.querySelector('[data-action="buy-batch"]');
    if (batchBtn) {
      batchBtn.disabled = !canAffordBatch;
      const nextMilestone = Math.ceil((upgrade.level + 1) / 10) * 10;
      const levelsToBuy = nextMilestone - upgrade.level;
      batchBtn.textContent = `+${levelsToBuy < 10 ? levelsToBuy : 10}`;
    }

    // Progress bar - 2-stage: green fills toward +1, then blue overflows toward +10
    const fillGreen = item.querySelector('.progress-fill-green');
    const fillBlue = item.querySelector('.progress-fill-blue');
    const progressText = item.querySelector('.progress-text');
    if (fillGreen && fillBlue && progressText) {
      const cost = upgrade.cost;
      const batchCost = upgrade.batchCost;
      const cookies = gameState.cookies;
      const canAffordOne = cookies >= cost;

      // Green: 0-100% toward +1 cost
      const greenPct = Math.min(100, (cookies / cost) * 100);
      fillGreen.style.width = greenPct + '%';
      fillGreen.classList.toggle('full', canAffordOne);

      // Blue: overflow from +1 cost toward +10 cost
      if (canAffordOne && batchCost > cost) {
        const overflow = cookies - cost;
        const overflowTotal = batchCost - cost;
        const bluePct = Math.min(100, (overflow / overflowTotal) * 100);
        fillBlue.style.width = bluePct + '%';
      } else {
        fillBlue.style.width = '0%';
      }

      // Text
      const canAffordTen = canAffordOne && cookies >= batchCost;
      let text;
      if (canAffordTen) {
        text = `<span class="p-ready">✅ +10 가능!</span><span>${formatNumber(cookies)} / ${formatNumber(batchCost)}</span>`;
      } else if (canAffordOne) {
        text = `<span class="p-ready">✅ +1 가능</span><span>${formatNumber(cookies)} / ${formatNumber(batchCost)}</span><span>${Math.floor(((cookies - cost) / (batchCost - cost)) * 100)}%</span>`;
      } else {
        text = `<span>${formatNumber(cookies)} / ${formatNumber(cost)}</span><span>${Math.floor((cookies / cost) * 100)}%</span>`;
      }
      progressText.innerHTML = text;
    }
  });
}

function createUpgradeItem(upgrade) {
  const name = upgradeNames[upgrade.type] || upgrade.type;
  const description = upgradeDescriptions[upgrade.type] || '';
  const canAfford = gameState.cookies >= upgrade.cost;
  const canAffordBatch = upgrade.batchCost && gameState.cookies >= upgrade.batchCost;
  const canBuy = canAfford || canAffordBatch;

  const item = document.createElement('div');
  let itemClass = 'upgrade-item';
  if (canAffordBatch) {
    itemClass += ' can-afford-batch';
  } else if (canAfford) {
    itemClass += ' can-afford-single';
  }
  item.className = itemClass;
  item.dataset.type = upgrade.type;
  const icon = upgradeIcons[upgrade.type] || '🍪';

  // Level display with milestone indicator
  const milestoneNum = upgrade.milestoneMultiplier;
  const levelDisplay = milestoneNum > 1
    ? `Lv.${upgrade.level} <span class="milestone-star">✦×${milestoneNum}</span>`
    : `Lv.${upgrade.level}`;

  // Calculate initial progress values
  const cost = upgrade.cost;
  const batchCost = upgrade.batchCost;
  const cookies = gameState.cookies;
  const canAffordOne = cookies >= cost;
  const greenPct = Math.min(100, (cookies / cost) * 100);
  const bluePct = canAffordOne && batchCost > cost
    ? Math.min(100, ((cookies - cost) / (batchCost - cost)) * 100) : 0;
  const canAffordTen = canAffordOne && cookies >= batchCost;

  item.innerHTML = `
    <div class="upgrade-header">
      <div class="upgrade-icon">${icon}</div>
      <div class="upgrade-content">
        <div class="upgrade-name">${name} (${levelDisplay})</div>
        <div class="upgrade-details">
          <span>${description} | Lv.당 ${upgrade.cpsBonus > 0 ? `+${upgrade.cpsBonus} CPS` : `+${upgrade.clickBonus} 클릭`}</span>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill-green ${canAffordOne ? 'full' : ''}" style="width: ${greenPct}%"></div>
              <div class="progress-fill-blue" style="width: ${canAffordOne ? bluePct : 0}%"></div>
            </div>
            <div class="progress-text">
              ${canAffordTen
                ? `<span class="p-ready">✅ +10 가능!</span><span>${formatNumber(cookies)} / ${formatNumber(batchCost)}</span>`
                : canAffordOne
                  ? `<span class="p-ready">✅ +1 가능</span><span>${formatNumber(cookies)} / ${formatNumber(batchCost)}</span><span>${Math.floor(((cookies - cost) / (batchCost - cost)) * 100)}%</span>`
                  : `<span>${formatNumber(cookies)} / ${formatNumber(cost)}</span><span>${Math.floor((cookies / cost) * 100)}%</span>`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';

  const group = document.createElement('div');
  group.className = 'button-group';

  const btn1 = document.createElement('button');
  btn1.className = 'buy-button';
  btn1.dataset.type = upgrade.type;
  btn1.dataset.action = 'buy';
  btn1.disabled = !canAfford;
  btn1.textContent = '+1';

  const btn2 = document.createElement('button');
  btn2.className = 'buy-button batch-button';
  btn2.dataset.type = upgrade.type;
  btn2.dataset.action = 'buy-batch';
  btn2.disabled = !canAffordBatch;

  const nextMilestone2 = Math.ceil((upgrade.level + 1) / 10) * 10;
  const levelsToBuy2 = nextMilestone2 - upgrade.level;
  btn2.textContent = `+${levelsToBuy2 < 10 ? levelsToBuy2 : 10}`;

  group.appendChild(btn1);
  group.appendChild(btn2);
  buttonContainer.appendChild(group);

  item.appendChild(buttonContainer);
  return item;
}

function renderUpgrades() {
  const container = document.getElementById('upgrade-list');
  if (!container) return;
  container.innerHTML = '';
  
  gameState.upgrades.forEach(upgrade => {
    const item = createUpgradeItem(upgrade);
    container.appendChild(item);
  });
}

async function loadGame() {
  try {
    const response = await fetch('/api/game');
    gameState = await response.json();
    renderUpgrades();
    updateUI();
  } catch (error) {
    console.error('Failed to load game:', error);
  }
}

function tryCritical(chance, multiplier) {
  if (Math.random() < chance) {
    return multiplier;
  }
  return 1;
}

async function handleClick(event) {
  const btn = document.getElementById('cookie-btn');
  btn.classList.add('clicked');
  setTimeout(() => btn.classList.remove('clicked'), 150);
  
  const effects = gameState.effects || {};
  let earned = gameState.cookiesPerClick;
  let isCritical = false;
  
  if (effects.clickCpsBonus) {
    earned += Math.floor(gameState.cookiesPerSecond * 0.01);
  }
  
  const totalCritChance = effects.clickCritChance || 0;
  const critMulti = effects.clickCritMultiplier || 1;
  
  const critMultiplier = tryCritical(totalCritChance, critMulti);
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

function createFloatingCookie(event, amount, isCritical) {
  const cookie = document.createElement('div');
  cookie.className = 'cookie-float' + (isCritical ? ' critical' : '');
  cookie.textContent = (isCritical ? '💥 ' : '+') + formatNumber(amount);
  cookie.style.left = event.clientX + 'px';
  cookie.style.top = event.clientY + 'px';
  document.body.appendChild(cookie);
  
  setTimeout(() => cookie.remove(), 1000);
}

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
      crumb.style.cssText = `width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${x}px;top:${y}px;`;
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
      sp.style.cssText = `width:${size}px;height:${size}px;background:${sparkleColors[Math.floor(Math.random()*sparkleColors.length)]};left:${x}px;top:${y}px;`;
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

async function syncGame() {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookies: gameState.cookies })
    });
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

async function buyUpgrade(type) {
  try {
    await syncGame();
    const response = await fetch(`/api/upgrade/${type}`, { method: 'POST' });
    
    if (response.ok) {
      gameState = await response.json();
      renderUpgrades();
      updateUI();
      const name = upgradeNames[type] || type;
      showToast(`${name} 구매 완료!`, 'success');
    } else {
      const error = await response.json();
      showToast(error.error, 'error');
    }
  } catch (error) {
    console.error('Upgrade failed:', error);
    showToast('구매 실패', 'error');
  }
}

async function buyUpgradeBatch(type) {
  try {
    await syncGame();
    const response = await fetch(`/api/upgrade-batch/${type}`, { method: 'POST' });
    
    if (response.ok) {
      gameState = await response.json();
      renderUpgrades();
      updateUI();
      const name = upgradeNames[type] || type;
      showToast(`${name} 대량 구매 완료!`, 'success');
    } else {
      const error = await response.json();
      showToast(error.error, 'error');
    }
  } catch (error) {
    console.error('Batch upgrade failed:', error);
    showToast('대량 구매 실패', 'error');
  }
}

function startAutoProduction() {
  setInterval(() => {
    if (gameState.cookiesPerSecond > 0) {
      const effects = gameState.effects || {};
      let earned = gameState.cookiesPerSecond / 10;
      
      const totalCritChance = effects.autoCritChance || 0;
      const critMulti = effects.autoCritMultiplier || 1;
      
      if (Math.random() < totalCritChance) {
        earned = Math.floor(earned * critMulti);
        showAutoCrit(earned);
      }
      
      gameState.cookies += earned;
      updateUI();
    }
  }, 100);
}

function showAutoCrit(amount) {
  const container = document.querySelector('.game-area');
  if (!container) return;
  
  const crit = document.createElement('div');
  crit.className = 'auto-crit';
  crit.textContent = '💥 크리티컬! +' + formatNumber(amount);
  container.appendChild(crit);
  
  setTimeout(() => crit.remove(), 500);
}

function startUIUpdate() {
  setInterval(() => {
    updateUpgradeButtons();
  }, 1000);
}

document.getElementById('cookie-btn').addEventListener('click', handleClick);

function handleUpgradeClick(e) {
  if (e.target.classList.contains('buy-button') && !e.target.disabled) {
    const action = e.target.dataset.action;
    const type = e.target.dataset.type;
    if (action === 'buy-batch') {
      buyUpgradeBatch(type);
    } else {
      buyUpgrade(type);
    }
  }
}

document.getElementById('upgrade-list').addEventListener('click', handleUpgradeClick);

document.getElementById('settings-btn').addEventListener('click', function() {
  document.getElementById('settings-modal').classList.add('active');
  loadStats();
  loadAchievements();
});

document.getElementById('shop-btn').addEventListener('click', function() {
  document.getElementById('shop-modal').classList.add('active');
});

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

document.getElementById('skill-tree-btn').addEventListener('click', function() {
  document.getElementById('skill-tree-modal').classList.add('active');
  loadSkillTree();
});

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
initTheme();

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
});

async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    const stats = await response.json();
    
    document.getElementById('stat-total-clicks').textContent = formatNumber(stats.totalClicks || 0);
    document.getElementById('stat-total-cookies').textContent = formatNumber(Math.floor(stats.totalCookiesEarned || 0));
    document.getElementById('stat-total-upgrades').textContent = formatNumber(stats.totalUpgradesBought || 0);
    document.getElementById('stat-total-enhancements').textContent = formatNumber(0);
    document.getElementById('stat-total-transcends').textContent = formatNumber(0);
    document.getElementById('stat-prestige-count').textContent = formatNumber(stats.prestigeCount || 0);
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

async function loadAchievements() {
  try {
    const response = await fetch('/api/achievements');
    const achievements = await response.json();
    
    const container = document.getElementById('achievements-container');
    container.innerHTML = '';
    
    achievements.forEach(achievement => {
      const item = document.createElement('div');
      item.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
      item.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-desc">${achievement.description}</div>
      `;
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Failed to load achievements:', error);
  }
}

function startSync() {
  setInterval(syncGame, 5000);
}

loadGame();
loadSkillTree();
startAutoProduction();
startSync();
startUIUpdate();
