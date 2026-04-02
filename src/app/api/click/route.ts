import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getOrCreatePlayer, updateCookies, incrementStat } from '@/lib/playerService'
import { getUpgradesForPlayer } from '@/lib/upgradeService'
import { calculateStats } from '@/lib/statsCalculator'
import { calculateSkillEffects } from '@/config/skillEffects'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const player = await getOrCreatePlayer(sessionId)
    const upgrades = await getUpgradesForPlayer(sessionId)

    // Get skill effects
    const unlockedSkillsData = await prisma.unlockedSkill.findMany({
      where: { playerId: player.id },
    })
    const unlockedSkillIds = unlockedSkillsData.map((s) => s.skillId)
    const skillEffects = calculateSkillEffects(unlockedSkillIds)

    const { cookiesPerClick, effects } = calculateStats(upgrades, player.cookies, skillEffects)

    let earned = cookiesPerClick

    // Click CPS bonus effect
    if (effects.clickCpsBonus && player.cookiesPerSecond) {
      earned += Math.floor(player.cookiesPerSecond * 0.01)
    }

    // Critical click
    let isCrit = false
    if (effects.clickCritChance) {
      const critChance = effects.clickCritChance + (effects.luckBonus || 0)
      if (Math.random() * 100 < critChance) {
        isCrit = true
        earned *= effects.clickCritMultiplier || 2
      }
    }

    const newCookies = player.cookies + earned

    await updateCookies(sessionId, newCookies)
    await incrementStat(sessionId, 'totalClicks', 1)
    await incrementStat(sessionId, 'totalCookiesEarned', earned)

    return NextResponse.json({
      cookies: newCookies,
      earned,
      isCrit,
      clickCritChance: effects.clickCritChance,
      clickCritMultiplier: effects.clickCritMultiplier,
      newAchievements: [],
    })
  } catch (error) {
    console.error('Error in /api/click:', error)
    return NextResponse.json(
      { error: 'Failed to process click' },
      { status: 500 }
    )
  }
}
