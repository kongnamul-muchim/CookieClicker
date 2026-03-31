const ACHIEVEMENTS = {
  first_click: {
    name: '첫 클릭',
    description: '처음으로 쿠키 클릭',
    icon: '👆',
    condition: (stats) => stats.total_clicks >= 1
  },
  click_100: {
    name: '클릭 초보',
    description: '100번 클릭',
    icon: '🖱️',
    condition: (stats) => stats.total_clicks >= 100
  },
  click_1000: {
    name: '클릭 장인',
    description: '1,000번 클릭',
    icon: '⚡',
    condition: (stats) => stats.total_clicks >= 1000
  },
  click_10000: {
    name: '클릭 마스터',
    description: '10,000번 클릭',
    icon: '🏆',
    condition: (stats) => stats.total_clicks >= 10000
  },
  cookies_1000: {
    name: '쿠키 수집가',
    description: '총 1,000 쿠키 획득',
    icon: '🍪',
    condition: (stats) => stats.total_cookies_earned >= 1000
  },
  cookies_1000000: {
    name: '쿠키 부자',
    description: '총 1,000,000 쿠키 획득',
    icon: '💰',
    condition: (stats) => stats.total_cookies_earned >= 1000000
  },
  cookies_1000000000: {
    name: '쿠키 대왕',
    description: '총 1,000,000,000 쿠키 획득',
    icon: '👑',
    condition: (stats) => stats.total_cookies_earned >= 1000000000
  },
  upgrade_10: {
    name: '업그레이드 시작',
    description: '10개 업그레이드 구매',
    icon: '⬆️',
    condition: (stats) => stats.total_upgrades_bought >= 10
  },
  upgrade_100: {
    name: '업그레이드 매니아',
    description: '100개 업그레이드 구매',
    icon: '📈',
    condition: (stats) => stats.total_upgrades_bought >= 100
  },
  enhance_1: {
    name: '강화 입문',
    description: '첫 강화',
    icon: '✨',
    condition: (stats) => stats.total_enhancements >= 1
  },
  enhance_10: {
    name: '강화 전문가',
    description: '10회 강화',
    icon: '💫',
    condition: (stats) => stats.total_enhancements >= 10
  },
  transcend_1: {
    name: '초월자',
    description: '첫 초월',
    icon: '⚡',
    condition: (stats) => stats.total_transcends >= 1
  },
  transcend_5: {
    name: '전설의 초월자',
    description: '5회 초월',
    icon: '🌟',
    condition: (stats) => stats.total_transcends >= 5
  },
  prestige_1: {
    name: '프레스티지',
    description: '첫 프레스티지',
    icon: '⭐',
    condition: (stats) => stats.prestige_count >= 1
  },
  prestige_5: {
    name: '프레스티지 마스터',
    description: '5회 프레스티지',
    icon: '🌠',
    condition: (stats) => stats.prestige_count >= 5
  }
};

const ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENTS);

module.exports = { ACHIEVEMENTS, ACHIEVEMENT_IDS };