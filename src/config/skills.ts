export interface Skill {
  id: string
  tier: number
  name: string
  icon: string
  cost: number
  requires?: string[]
  minRequired?: number
  effect: {
    type: string
    value?: number
    chance?: number
    multiplier?: number
    rate?: number
  }
  autoUnlock?: boolean
  description: string
}

export const SKILLS: Skill[] = [
  {
    id: 'prestige_start',
    tier: 1,
    name: '프레스티지 시작',
    icon: '🏠',
    cost: 10,
    effect: { type: 'none' },
    autoUnlock: true,
    description: '모든 프레스티지 여정의 시작점입니다.',
  },
  {
    id: 'click_boost_1',
    tier: 2,
    name: '클릭 강화 I',
    icon: '👆',
    cost: 15,
    requires: ['prestige_start'],
    effect: { type: 'click_percent', value: 10 },
    description: '클릭으로 얻는 모든 쿠키가 영구적으로 10% 증가합니다.',
  },
  {
    id: 'cps_boost_1',
    tier: 2,
    name: '생산력 강화 I',
    icon: '📈',
    cost: 15,
    requires: ['prestige_start'],
    effect: { type: 'cps_percent', value: 10 },
    description: '초당 자동 생산량 (CPS) 이 영구적으로 10% 증가합니다.',
  },
  {
    id: 'cost_discount_1',
    tier: 2,
    name: '비용 할인 I',
    icon: '💰',
    cost: 15,
    requires: ['prestige_start'],
    effect: { type: 'cost_discount', value: 5 },
    description: '모든 업그레이드의 구매 비용이 5% 감소합니다.',
  },
  {
    id: 'critical_click',
    tier: 3,
    name: '크리티컬 클릭',
    icon: '💥',
    cost: 25,
    requires: ['click_boost_1', 'cps_boost_1'],
    minRequired: 2,
    effect: { type: 'critical', chance: 5, multiplier: 3 },
    description: '클릭 시 5% 확률로 크리티컬이 발동합니다.',
  },
  {
    id: 'cookie_interest',
    tier: 3,
    name: '쿠키 이자',
    icon: '🏦',
    cost: 25,
    requires: ['cps_boost_1', 'cost_discount_1'],
    minRequired: 2,
    effect: { type: 'interest', rate: 0.1 },
    description: '현재 보유한 쿠키의 0.1% 를 매초 추가로 획득합니다.',
  },
]

export function getAllSkills(): Skill[] {
  return SKILLS
}

export function getSkillById(id: string): Skill | undefined {
  return SKILLS.find((s) => s.id === id)
}
