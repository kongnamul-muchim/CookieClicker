import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getOrCreatePlayer } from '@/lib/playerService'
import { getUpgradesForPlayer } from '@/lib/upgradeService'
import { calculateStatsWithSkills, buildUpgradeState } from '@/lib/statsCalculator'
import { getAllSkills } from '@/config/skills'
import { calculateSkillEffects } from '@/config/skillEffects'

export async function GET() {
  try {
    const cookieStore = await cookies()
    let sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      sessionId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const headers = new Headers()
      headers.append('Set-Cookie', `player_id=${sessionId}; Path=/; HttpOnly; Max-Age=31536000; SameSite=Lax`)
      
      // Create player
      await getOrCreatePlayer(sessionId)
      
      return NextResponse.json({
        cookies: 0,
        cookiesPerClick: 1,
        cookiesPerSecond: 0,
        upgrades: buildUpgradeState([], {}),
        effects: {},
        clickBoostMultiplier: 1,
        prestigeCount: 0,
        prestigeStars: 0,
      }, { headers })
    }

    const player = await getOrCreatePlayer(sessionId)
    const upgrades = await getUpgradesForPlayer(sessionId)
    
    // Get unlocked skills
    const unlockedSkillsData = await prisma.unlockedSkill.findMany({
      where: { playerId: player.id },
    })
    const unlockedSkillIds = unlockedSkillsData.map((s) => s.skillId)
    const skillEffects = calculateSkillEffects(unlockedSkillIds)

    const { cookiesPerClick, cookiesPerSecond, effects, clickBoostMultiplier } =
      calculateStatsWithSkills(upgrades, player.cookies, skillEffects)

    const upgradeList = buildUpgradeState(upgrades, effects)

    return NextResponse.json({
      cookies: player.cookies,
      cookiesPerClick,
      cookiesPerSecond,
      upgrades: upgradeList,
      effects,
      clickBoostMultiplier,
      prestigeCount: player.prestigeCount,
      prestigeStars: player.prestigeStars,
    })
  } catch (error) {
    console.error('Error in /api/game:', error)
    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    )
  }
}
