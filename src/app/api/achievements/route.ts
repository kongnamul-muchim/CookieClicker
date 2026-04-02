import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getOrCreatePlayer } from '@/lib/playerService'

const ACHIEVEMENTS = {
  first_click: { name: '첫 클릭', description: '처음으로 쿠키 클릭', icon: '👆' },
  click_100: { name: '클릭 초보', description: '100 번 클릭', icon: '🖱️' },
  click_1000: { name: '클릭 장인', description: '1,000 번 클릭', icon: '⚡' },
  click_10000: { name: '클릭 마스터', description: '10,000 번 클릭', icon: '🏆' },
  cookies_1000: { name: '쿠키 수집가', description: '총 1,000 쿠키 획득', icon: '🍪' },
  cookies_1000000: { name: '쿠키 부자', description: '총 1,000,000 쿠키 획득', icon: '💰' },
  upgrade_10: { name: '업그레이드 시작', description: '10 개 업그레이드 구매', icon: '⬆️' },
  enhance_1: { name: '강화 입문', description: '첫 강화', icon: '✨' },
  transcend_1: { name: '초월자', description: '첫 초월', icon: '⚡' },
  prestige_1: { name: '프레스티지', description: '첫 프레스티지', icon: '⭐' },
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const player = await getOrCreatePlayer(sessionId)

    const unlockedAchievements = await prisma.achievement.findMany({
      where: { playerId: player.id },
    })
    const unlockedAchievementIds = unlockedAchievements.map((a) => a.achievementId)

    const allAchievements = Object.entries(ACHIEVEMENTS).map(([id, data]) => ({
      id,
      ...data,
      unlocked: unlockedAchievementIds.includes(id),
      unlockedAt: unlockedAchievements.find((a) => a.achievementId === id)?.unlockedAt,
    }))

    return NextResponse.json(allAchievements)
  } catch (error) {
    console.error('Error in /api/achievements:', error)
    return NextResponse.json(
      { error: 'Failed to get achievements' },
      { status: 500 }
    )
  }
}
