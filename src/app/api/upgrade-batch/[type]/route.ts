import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getOrCreatePlayer } from '@/lib/playerService'
import { buyUpgradeBatch, getUpgradesForPlayer } from '@/lib/upgradeService'
import { calculateStats, buildUpgradeState } from '@/lib/statsCalculator'
import { calculateSkillEffects } from '@/config/skillEffects'
import { checkAchievements } from '@/lib/achievementChecker'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const player = await getOrCreatePlayer(sessionId)

    // Support both single buy (count=1) and batch buy (default 10)
    const body = await request.json().catch(() => ({}))
    const count = body.count || 10

    const result = await buyUpgradeBatch(sessionId, type, player.cookies, count)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Check achievements
    const newAchievements = await checkAchievements(sessionId)

    // Get updated state
    const upgrades = await getUpgradesForPlayer(sessionId)
    const unlockedSkillsData = await prisma.unlockedSkill.findMany({
      where: { playerId: player.id },
    })
    const unlockedSkillIds = unlockedSkillsData.map((s) => s.skillId)
    const skillEffects = calculateSkillEffects(unlockedSkillIds)

    const { cookiesPerClick, cookiesPerSecond, effects, clickBoostMultiplier } =
      calculateStats(upgrades, result.newCookies || 0, skillEffects)

    const upgradeList = buildUpgradeState(upgrades, effects)

    return NextResponse.json({
      cookies: result.newCookies,
      cookiesPerClick,
      cookiesPerSecond,
      upgrades: upgradeList,
      effects,
      clickBoostMultiplier,
      prestigeCount: player.prestigeCount,
      prestigeStars: player.prestigeStars,
      newAchievements,
    })
  } catch (error) {
    console.error('Error in /api/upgrade-batch:', error)
    return NextResponse.json(
      { error: 'Failed to buy upgrade batch' },
      { status: 500 }
    )
  }
}
