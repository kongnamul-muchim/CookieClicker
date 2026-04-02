import { Skill, SKILLS } from './skills'

export interface SkillEffect {
  clickPercent?: number
  cpsPercent?: number
  costDiscount?: number
  clickCritChance?: number
  clickCritMultiplier?: number
  interestRate?: number
  autoClickRate?: number
  luckBonus?: number
  reinforceBonus?: number
  startBonus?: number
  transcendBoost?: number
  prestigeBonus?: number
  clickCpsBonus?: number
  burningClickStack?: number
  burningClickMaxStack?: number
  lightningChance?: number
  lightningMultiplier?: number
  allBonus?: number
  starGainMultiplier?: number
  doubleChance?: number
  doubleChanceMultiplier?: number
  randomMultiplierMin?: number
  randomMultiplierMax?: number
  specialReinforceDiscount?: number
}

export function calculateSkillEffects(unlockedSkills: string[]): SkillEffect {
  const effects: SkillEffect = {}

  for (const skillId of unlockedSkills) {
    const skill = SKILLS.find((s) => s.id === skillId)
    if (!skill) continue

    switch (skill.effect.type) {
      case 'click_percent':
        effects.clickPercent = (effects.clickPercent || 0) + (skill.effect.value || 0)
        break
      case 'cps_percent':
        effects.cpsPercent = (effects.cpsPercent || 0) + (skill.effect.value || 0)
        break
      case 'cost_discount':
        effects.costDiscount = (effects.costDiscount || 0) + (skill.effect.value || 0)
        break
      case 'critical':
        effects.clickCritChance = (effects.clickCritChance || 0) + (skill.effect.chance || 0)
        effects.clickCritMultiplier = (effects.clickCritMultiplier || 0) + (skill.effect.multiplier || 0)
        break
      case 'interest':
        effects.interestRate = (effects.interestRate || 0) + (skill.effect.rate || 0)
        break
      case 'luck_bonus':
        effects.luckBonus = (effects.luckBonus || 0) + (skill.effect.value || 0)
        break
      case 'reinforce_bonus':
        effects.reinforceBonus = (effects.reinforceBonus || 0) + (skill.effect.value || 0)
        break
      case 'start_bonus':
        effects.startBonus = skill.effect.cookies || 0
        break
      case 'special_reinforce_discount':
        effects.specialReinforceDiscount = (effects.specialReinforceDiscount || 0) + (skill.effect.value || 0)
        break
      case 'burning_click':
        effects.burningClickStack = skill.effect.maxStack || 10
        effects.burningClickMaxStack = skill.effect.maxStack || 10
        break
      case 'lightning':
        effects.lightningChance = (effects.lightningChance || 0) + (skill.effect.chance || 0)
        effects.lightningMultiplier = skill.effect.multiplier || 10
        break
      case 'all_bonus':
        effects.allBonus = (effects.allBonus || 0) + (skill.effect.value || 0)
        break
      case 'star_gain_multiplier':
        effects.starGainMultiplier = (effects.starGainMultiplier || 0) + (skill.effect.value || 0)
        break
    }
  }

  return effects
}

export function getSkillEffectDescription(effect: SkillEffect): string[] {
  const descriptions: string[] = []

  if (effect.clickPercent) descriptions.push(`클릭 +${effect.clickPercent}%`)
  if (effect.cpsPercent) descriptions.push(`CPS +${effect.cpsPercent}%`)
  if (effect.costDiscount) descriptions.push(`비용 -${effect.costDiscount}%`)
  if (effect.clickCritChance) descriptions.push(`크리티컬 ${effect.clickCritChance}%`)

  return descriptions
}

// Re-export SKILLS for convenience
export { SKILLS } from './skills'
