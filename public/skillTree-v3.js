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
  
  const requires = skill.requires || [];
  const requiredCount = skill.minRequired || requires.length;
  const unlockedRequired = requires.filter(r => 
    skillTreeState.unlockedSkills.includes(r)).length;
  
  if (unlockedRequired < requiredCount) return false;
  
  return skillTreeState.prestigeStars >= skill.cost;
}

function createSkillTooltip(skill, isUnlocked, canUnlock) {
  const tooltip = document.createElement('div');
  tooltip.className = 'skill-tooltip';
  
  const effectText = formatSkillEffect(skill.effect);
  const reqText = skill.requires && skill.requires.length > 0 ? 
    `필요: ${skill.requires.join(', ')}` : '';
  
  tooltip.innerHTML = `
    <div class="tooltip-title">${skill.icon} ${skill.name}</div>
    <div class="tooltip-desc">${skill.description || ''}</div>
    <div class="tooltip-cost">비용: ${skill.cost}</div>
    ${reqText ? `<div class="tooltip-req">${reqText}</div>` : ''}
    <div class="tooltip-effect">${effectText}</div>
  `;
  
  return tooltip;
}

function formatSkillEffect(effect) {
  if (!effect) return '';
  
  const typeTexts = {
    click_percent: `클릭 데미지 +${effect.value}%`,
    cps_percent: `CPS +${effect.value}%`,
    cost_discount: `비용 -${effect.value}%`,
    critical: `${effect.chance}% 확률로 ${effect.multiplier}배`,
    interest: `이자율 +${effect.rate}%`,
    auto_click: `자동 클릭 ${effect.rate}회/초`,
    luck_bonus: `확률 효과 +${effect.value}%p`,
    all_bonus: `전체 +${effect.value}%`,
    reinforce_bonus: `강화 효과 +${effect.value}%`,
    start_bonus: `시작 시 ${effect.cookies} 쿠키`,
    star_gain_multiplier: `획득 +${effect.value}%`,
    lightning: `${effect.chance}% 확률로 ${effect.multiplier}배`,
    jackpot: `${effect.chance}% 확률로 ${effect.multiplier}배`,
    double_chance: `${effect.chance}% 확률로 2배`,
    burning_click: `연속 클릭당 +${effect.stackBonus}%`,
    cps_flat: `기본 CPS +${effect.value}`,
    building_cps_bonus: `건물당 CPS +${effect.value}%`
  };
  
  return typeTexts[effect.type] || effect.type;
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
      if (typeof loadGame === 'function') await loadGame();
    } else {
      const error = await response.json();
      alert(error.error);
    }
  } catch (error) {
    console.error('Unlock skill failed:', error);
  }
}

function updateSkillTreeUI() {
  const starsEl = document.getElementById('prestige-stars');
  const countEl = document.getElementById('prestige-count');
  if (starsEl) starsEl.textContent = skillTreeState.prestigeStars;
  if (countEl) countEl.textContent = skillTreeState.prestigeCount;
}

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
      if (typeof gameState !== 'undefined') {
        gameState.cookies = 0;
        gameState.cookiesPerClick = 1;
        gameState.cookiesPerSecond = 0;
        gameState.upgrades = result.upgrades;
        gameState.effects = {};
      }
      if (typeof updateUI === 'function') updateUI();
      loadSkillTree();
      if (typeof syncGame === 'function') syncGame();
    }
  } catch (error) {
    console.error('Rebirth failed:', error);
    showToast('환생 실패', 'error');
  }
}

window.loadSkillTree = loadSkillTree;
window.skillTreeState = skillTreeState;

document.addEventListener('DOMContentLoaded', function() {
  const rebirthBtn = document.getElementById('rebirth-btn');
  if (rebirthBtn) {
    rebirthBtn.addEventListener('click', async function() {
      await rebirth();
    });
  }
});