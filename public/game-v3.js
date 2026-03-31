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
  click_boost: '클릭당 +2 쿠키',
  cursor: '초당 +0.1 쿠키',
  grandma: '초당 +1 쿠키',
  farm: '초당 +15 쿠키',
  mine: '초당 +150 쿠키',
  factory: '초당 +1,200 쿠키',
  bank: '초당 +12,000 쿠키',
  temple: '초당 +100,000 쿠키',
  wizard_tower: '초당 +800,000 쿠키',
  portal: '초당 +5,000,000 쿠키'
};

const specialEffectDescriptions = {
  click_crit_5pct_5x: '만렙: 클릭 크리티컬 5%, 5배',
  auto_crit_5pct_5x: '만렙: 자동 생산 크리티컬 5%, 5배',
  crit_chance_15pct: '만렙: 크리티컬 확률 +15%',
  production_1_2x: '만렙: 모든 생산량 1.2배',
  production_1_5x: '만렙: 모든 생산량 1.5배',
  production_2x: '만렙: 모든 생산량 2배',
  cost_10pct_discount: '만렙: 비용 10% 할인',
  interest_0_1pct: '만렙: 쿠키의 0.1% 매초 획득',
  click_cps_1pct: '만렙: 클릭당 초당 쿠키의 1% 추가'
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
  
  updateUpgradeButtons();
}

function updateUpgradeButtons() {
  const buttons = document.querySelectorAll('.buy-button');
  buttons.forEach(btn => {
    const type = btn.dataset.type;
    const upgrade = gameState.upgrades.find(u => u.type === type);
    if (upgrade) {
      if (upgrade.canEnhance && !btn.classList.contains('enhance-button')) {
        updateEnhanceButton(btn, upgrade);
      } else if (!upgrade.canEnhance && btn.classList.contains('enhance-button')) {
        updateNormalButton(btn, upgrade);
      }
      
      if (upgrade.isMaxLevel && !upgrade.canEnhance && !upgrade.canSpecialEnhance) {
        btn.disabled = true;
        btn.textContent = 'MAX';
        btn.classList.add('max-level');
      } else if (upgrade.canSpecialEnhance) {
        btn.disabled = gameState.cookies < upgrade.specialEnhanceCost;
      } else {
        btn.disabled = gameState.cookies < (upgrade.canEnhance ? upgrade.enhanceCost : upgrade.cost);
      }
    }
  });
}

function updateEnhanceButton(btn, upgrade) {
  btn.textContent = '강화';
  btn.classList.add('enhance-button');
  btn.dataset.action = 'enhance';
  const costSpan = btn.parentElement.querySelector('.upgrade-cost');
  if (costSpan) {
    costSpan.textContent = '강화 비용: ' + formatNumber(upgrade.enhanceCost) + '개';
  }
}

function updateNormalButton(btn, upgrade) {
  btn.textContent = '구매';
  btn.classList.remove('enhance-button');
  btn.dataset.action = 'buy';
  const costSpan = btn.parentElement.querySelector('.upgrade-cost');
  if (costSpan) {
    costSpan.textContent = '비용: ' + formatNumber(upgrade.cost) + '개';
  }
}

function categorizeUpgrades(upgrades) {
  const clickUpgrades = upgrades.filter(u => u.type === 'click_boost');
  const autoUpgrades = upgrades.filter(u => ['cursor', 'grandma', 'farm', 'mine', 'factory', 'bank'].includes(u.type));
  const specialUpgrades = upgrades.filter(u => ['temple', 'wizard_tower', 'portal'].includes(u.type));
  
  return { clickUpgrades, autoUpgrades, specialUpgrades };
}

function createUpgradeItem(upgrade) {
  const name = upgradeNames[upgrade.type] || upgrade.type;
  const description = upgradeDescriptions[upgrade.type] || '';
  const specialDesc = specialEffectDescriptions[upgrade.specialEffect] || '';
  const isMaxLevelEffectActive = upgrade.isMaxLevel && upgrade.specialEffect;
  const specialEnhanceCost = upgrade.specialEnhanceCost || 0;
  const canAffordSpecial = upgrade.canSpecialEnhance && specialEnhanceCost > 0 && gameState.cookies >= specialEnhanceCost;
  const canAffordEnhance = upgrade.canEnhance && !upgrade.canSpecialEnhance && gameState.cookies >= upgrade.enhanceCost;
  const canAfford = !upgrade.canEnhance && !upgrade.canSpecialEnhance && gameState.cookies >= upgrade.cost;
  const canAffordBatch = !upgrade.canEnhance && !upgrade.canSpecialEnhance && upgrade.batchCost && gameState.cookies >= upgrade.batchCost;
  const canBuy = canAfford || canAffordBatch || canAffordSpecial || canAffordEnhance;
  const item = document.createElement('div');
  let itemClass = 'upgrade-item';
  if (canAffordBatch || canAffordSpecial || canAffordEnhance) {
    itemClass += ' can-afford-batch';
  } else if (canAfford) {
    itemClass += ' can-afford-single';
  }
  item.className = itemClass;
  item.dataset.type = upgrade.type;
  const icon = upgradeIcons[upgrade.type] || '🍪';
  
  let enhancementText = '';
  if (upgrade.enhancementCount > 0) {
    enhancementText = ` (강화 x${upgrade.enhancementCount})`;
  }
  
  if (upgrade.specialEnhancement) {
    enhancementText += ' ⭐';
  }
  
  let levelText = upgrade.maxLevel 
    ? `Lv.${upgrade.level}/${upgrade.maxLevel}` 
    : `Lv.${upgrade.level}`;
  
  let costText = '';
  let targetCost = 0;
  
  if (upgrade.canSpecialEnhance) {
    costText = `초월: ${formatNumber(specialEnhanceCost)}개 (클릭강화 2배)`;
    targetCost = specialEnhanceCost;
  } else if (upgrade.isMaxLevel) {
    costText = '최대 레벨 달성';
    targetCost = 0;
  } else if (upgrade.canEnhance) {
    costText = `강화 비용: ${formatNumber(upgrade.enhanceCost)}개`;
    targetCost = upgrade.enhanceCost;
  } else {
    costText = `비용: ${formatNumber(upgrade.cost)}개`;
    targetCost = upgrade.batchCost || upgrade.cost;
  }
  
  const progressPercent = calculateProgress(gameState.cookies, targetCost);
  
  item.innerHTML = `
    <div class="upgrade-header">
      <div class="upgrade-icon">${icon}</div>
      <div class="upgrade-content">
        <div class="upgrade-name">${name} (${levelText})${enhancementText}</div>
        <div class="upgrade-details">
          <span>${description}</span>
          ${specialDesc ? `<span class="special-effect${isMaxLevelEffectActive ? ' active' : ''}">${specialDesc}${isMaxLevelEffectActive ? ' ✅' : ''}</span>` : ''}
          <span class="upgrade-cost">${costText}</span>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill ${progressPercent >= 90 ? 'high' : ''}" style="width: ${progressPercent}%"></div>
            </div>
            <div class="progress-text">
              <span>${formatNumber(gameState.cookies)} / ${formatNumber(targetCost)}</span>
              <span>${progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';
  
  if (upgrade.canSpecialEnhance) {
    const btn = document.createElement('button');
    btn.className = 'buy-button special-enhance-button';
    btn.dataset.type = upgrade.type;
    btn.dataset.action = 'special-enhance';
    btn.dataset.cost = specialEnhanceCost;
    btn.disabled = !canAffordSpecial;
    btn.textContent = '⚡초월⚡';
    buttonContainer.appendChild(btn);
  } else if (upgrade.isMaxLevel) {
    const btn = document.createElement('button');
    btn.className = 'buy-button max-level';
    btn.disabled = true;
    btn.textContent = upgrade.specialEnhancement ? '✨초월✨' : 'MAX';
    buttonContainer.appendChild(btn);
  } else if (upgrade.canEnhance) {
    const btn = document.createElement('button');
    btn.className = 'buy-button enhance-button';
    btn.dataset.type = upgrade.type;
    btn.dataset.action = 'enhance';
    btn.disabled = !canAfford;
    btn.textContent = '강화';
    buttonContainer.appendChild(btn);
  } else {
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
    const targetLevel2 = upgrade.maxLevel ? Math.min(nextMilestone2, upgrade.maxLevel) : nextMilestone2;
    const levelsToBuy2 = targetLevel2 - upgrade.level;
    btn2.textContent = levelsToBuy2 < 10 ? `+${levelsToBuy2}` : '+10';
    
    group.appendChild(btn1);
    group.appendChild(btn2);
    buttonContainer.appendChild(group);
  }
  
  item.appendChild(buttonContainer);
  return item;
}

function renderUpgradeList(upgrades, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  
  upgrades.forEach(upgrade => {
    const item = createUpgradeItem(upgrade);
    container.appendChild(item);
  });
}

function renderUpgrades() {
  const { clickUpgrades, autoUpgrades, specialUpgrades } = categorizeUpgrades(gameState.upgrades);
  
  renderUpgradeList(clickUpgrades, 'click-upgrade-list');
  renderUpgradeList(autoUpgrades, 'auto-upgrade-list');
  renderUpgradeList(specialUpgrades, 'special-upgrade-list');
}

function updateUpgrades() {
  gameState.upgrades.forEach(upgrade => {
    const item = document.querySelector(`.upgrade-item[data-type="${upgrade.type}"]`);
    if (!item) return;
    
    const specialEnhanceCost = upgrade.specialEnhanceCost || 0;
    const canAffordSpecial = upgrade.canSpecialEnhance && specialEnhanceCost > 0 && gameState.cookies >= specialEnhanceCost;
    const canAffordEnhance = upgrade.canEnhance && !upgrade.canSpecialEnhance && gameState.cookies >= upgrade.enhanceCost;
    const canAfford = !upgrade.canEnhance && !upgrade.canSpecialEnhance && gameState.cookies >= upgrade.cost;
    const canAffordBatch = !upgrade.canEnhance && !upgrade.canSpecialEnhance && upgrade.batchCost && gameState.cookies >= upgrade.batchCost;
    
    item.classList.remove('can-afford-single', 'can-afford-batch');
    if (canAffordBatch) {
      item.classList.add('can-afford-batch');
    } else if (canAffordSpecial || canAffordEnhance) {
      item.classList.add('can-afford-single');
    } else if (canAfford) {
      item.classList.add('can-afford-single');
    }
    
    const specialBtn = item.querySelector('[data-action="special-enhance"]');
    if (specialBtn) {
      specialBtn.disabled = !canAffordSpecial;
    }
    
    const enhanceBtn = item.querySelector('[data-action="enhance"]');
    if (enhanceBtn) {
      enhanceBtn.disabled = !canAffordEnhance;
    }
    
    const buyBtn = item.querySelector('[data-action="buy"]');
    if (buyBtn) {
      buyBtn.disabled = !canAfford;
    }
    
    const batchBtn = item.querySelector('[data-action="buy-batch"]');
    if (batchBtn) {
      batchBtn.disabled = !canAffordBatch;
    }
    
    const progressFill = item.querySelector('.progress-fill');
    const progressText = item.querySelector('.progress-text');
    if (progressFill && progressText) {
      let targetCost;
      if (upgrade.canSpecialEnhance && specialEnhanceCost > 0) {
        targetCost = specialEnhanceCost;
      } else if (upgrade.canEnhance) {
        targetCost = upgrade.enhanceCost;
      } else {
        targetCost = upgrade.batchCost || upgrade.cost;
      }
      const progressPercent = calculateProgress(gameState.cookies, targetCost);
      progressFill.style.width = progressPercent + '%';
      progressFill.classList.toggle('high', progressPercent >= 90);
      progressText.innerHTML = `<span>${formatNumber(gameState.cookies)} / ${formatNumber(targetCost)}</span><span>${progressPercent}%</span>`;
    }
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

async function enhanceUpgrade(type) {
  try {
    await syncGame();
    
    const response = await fetch(`/api/enhance/${type}`, { method: 'POST' });
    
    if (response.ok) {
      gameState = await response.json();
      renderUpgrades();
      updateUI();
      const name = upgradeNames[type] || type;
      showToast(`${name} 강화 완료!`, 'success');
    } else {
      const error = await response.json();
      showToast(error.error, 'error');
    }
  } catch (error) {
    console.error('Enhance failed:', error);
    showToast('강화 실패', 'error');
  }
}

async function specialEnhanceUpgrade(type) {
  try {
    await syncGame();
    
    const response = await fetch(`/api/special-enhance/${type}`, { method: 'POST' });
    
    if (response.ok) {
      gameState = await response.json();
      renderUpgrades();
      updateUI();
      showToast('⚡초월 완료! 클릭 강화 2배!', 'success');
    } else {
      const error = await response.json();
      showToast(error.error, 'error');
    }
  } catch (error) {
    console.error('Special enhance failed:', error);
    showToast('초월 실패', 'error');
  }
}

let syncEnabled = true;

async function syncGame() {
  if (!syncEnabled) return;
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

function startSync() {
  setInterval(syncGame, 5000);
}

document.getElementById('cookie-btn').addEventListener('click', handleClick);

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

document.getElementById('click-upgrade-list').addEventListener('click', handleUpgradeClick);
document.getElementById('auto-upgrade-list').addEventListener('click', handleUpgradeClick);
document.getElementById('special-upgrade-list').addEventListener('click', handleUpgradeClick);

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
    
    document.getElementById('stat-total-clicks').textContent = formatNumber(stats.total_clicks || 0);
    document.getElementById('stat-total-cookies').textContent = formatNumber(Math.floor(stats.total_cookies_earned || 0));
    document.getElementById('stat-total-upgrades').textContent = formatNumber(stats.total_upgrades_bought || 0);
    document.getElementById('stat-total-enhancements').textContent = formatNumber(stats.total_enhancements || 0);
    document.getElementById('stat-total-transcends').textContent = formatNumber(stats.total_transcends || 0);
    document.getElementById('stat-prestige-count').textContent = formatNumber(stats.prestige_count || 0);
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

function startUIUpdate() {
  setInterval(() => {
    updateUpgrades();
  }, 1000);
}

loadGame();
loadSkillTree();
startAutoProduction();
startSync();
startUIUpdate();