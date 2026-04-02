import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getOrCreatePlayer, updateCookies } from '@/lib/playerService'
import { buyUpgrade, getUpgradesForPlayer } from '@/lib/upgradeService'
import { calculateStats, buildUpgradeState } from '@/lib/statsCalculator'
import { calculateSkillEffects } from '@/config/skillEffects'

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

    const result = await buyUpgrade(sessionId, type, player.cookies)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

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
    })
  } catch (error) {
    console.error('Error in /api/upgrade:', error)
    return NextResponse.json(
      { error: 'Failed to buy upgrade' },
      { status: 500 }
    )
  }
}
