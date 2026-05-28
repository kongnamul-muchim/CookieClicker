import { prisma } from './prisma'
import { getOrCreatePlayer } from './playerService'

type PlayerStats = {
  totalClicks: number
  totalCookiesEarned: number
  totalUpgradesBought: number
  totalEnhancements: number
  totalTranscends: number
  prestigeCount: number
}

const ACHIEVEMENT_CONDITIONS: Record<string, (stats: PlayerStats) => boolean> = {
  first_click: (s) => s.totalClicks >= 1,
  click_100: (s) => s.totalClicks >= 100,
  click_1000: (s) => s.totalClicks >= 1000,
  click_10000: (s) => s.totalClicks >= 10000,
  cookies_1000: (s) => s.totalCookiesEarned >= 1000,
  cookies_1000000: (s) => s.totalCookiesEarned >= 1000000,
  cookies_1000000000: (s) => s.totalCookiesEarned >= 1000000000,
  upgrade_10: (s) => s.totalUpgradesBought >= 10,
  upgrade_100: (s) => s.totalUpgradesBought >= 100,
  enhance_1: (s) => s.totalEnhancements >= 1,
  enhance_10: (s) => s.totalEnhancements >= 10,
  transcend_1: (s) => s.totalTranscends >= 1,
  transcend_5: (s) => s.totalTranscends >= 5,
  prestige_1: (s) => s.prestigeCount >= 1,
  prestige_5: (s) => s.prestigeCount >= 5,
}

const ACHIEVEMENT_NAMES: Record<string, { name: string; description: string; icon: string }> = {
  first_click: { name: '첫 클릭', description: '처음으로 쿠키 클릭', icon: '👆' },
  click_100: { name: '클릭 초보', description: '100번 클릭', icon: '🖱️' },
  click_1000: { name: '클릭 장인', description: '1,000번 클릭', icon: '⚡' },
  click_10000: { name: '클릭 마스터', description: '10,000번 클릭', icon: '🏆' },
  cookies_1000: { name: '쿠키 수집가', description: '총 1,000 쿠키 획득', icon: '🍪' },
  cookies_1000000: { name: '쿠키 부자', description: '총 1,000,000 쿠키 획득', icon: '💰' },
  cookies_1000000000: { name: '쿠키 대왕', description: '총 1,000,000,000 쿠키 획득', icon: '👑' },
  upgrade_10: { name: '업그레이드 시작', description: '10개 업그레이드 구매', icon: '⬆️' },
  upgrade_100: { name: '업그레이드 매니아', description: '100개 업그레이드 구매', icon: '📈' },
  enhance_1: { name: '강화 입문', description: '첫 강화', icon: '✨' },
  enhance_10: { name: '강화 전문가', description: '10회 강화', icon: '💫' },
  transcend_1: { name: '초월자', description: '첫 초월', icon: '⚡' },
  transcend_5: { name: '전설의 초월자', description: '5회 초월', icon: '🌟' },
  prestige_1: { name: '프레스티지', description: '첫 프레스티지', icon: '⭐' },
  prestige_5: { name: '프레스티지 마스터', description: '5회 프레스티지', icon: '🌠' },
}

/**
 * Check and unlock any new achievements for the given player.
 * Returns the list of newly unlocked achievements.
 */
export async function checkAchievements(sessionId: string): Promise<Array<{ id: string; name: string; description: string; icon: string }>> {
  const player = await getOrCreatePlayer(sessionId)

  const stats: PlayerStats = {
    totalClicks: player.totalClicks,
    totalCookiesEarned: player.totalCookiesEarned,
    totalUpgradesBought: player.totalUpgradesBought,
    totalEnhancements: player.totalEnhancements,
    totalTranscends: player.totalTranscends,
    prestigeCount: player.prestigeCount,
  }

  // Get already unlocked achievements
  const unlockedRecords = await prisma.achievement.findMany({
    where: { playerId: player.id },
  })
  const unlockedIds = new Set(unlockedRecords.map((r: { achievementId: string }) => r.achievementId))

  const newAchievements: Array<{ id: string; name: string; description: string; icon: string }> = []

  for (const [id, condition] of Object.entries(ACHIEVEMENT_CONDITIONS)) {
    if (unlockedIds.has(id)) continue // already unlocked

    if (condition(stats)) {
      // Unlock it
      await prisma.achievement.create({
        data: {
          playerId: player.id,
          achievementId: id,
        },
      })
      const info = ACHIEVEMENT_NAMES[id]
      newAchievements.push({ id, ...info })
    }
  }

  return newAchievements
}
