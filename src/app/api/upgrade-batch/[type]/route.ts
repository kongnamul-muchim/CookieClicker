import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getOrCreatePlayer, updateCookies } from '@/lib/playerService'
import { getUpgradesForPlayer, buyUpgrade } from '@/lib/upgradeService'
import { calculateStats, buildUpgradeState } from '@/lib/statsCalculator'
import { calculateSkillEffects } from '@/config/skillEffects'

// Buy 10 upgrades at once
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

    let player = await getOrCreatePlayer(sessionId)
    let upgrades = await getUpgradesForPlayer(sessionId)
    
    const upgrade = upgrades.find((u) => u.upgradeType === type)
    const level = upgrade?.level || 0
    
    // Calculate cost for 10 levels
    let totalCost = 0
    let currentLevel = level
    for (let i = 0; i < 10; i++) {
      const cost = Math.floor(15 * Math.pow(1.15, currentLevel)) // Base cost for cursor as example
      if (player.cookies < totalCost + cost) {
        if (i === 0) {
          return NextResponse.json({ error: 'Not enough cookies' }, { status: 400 })
        }
        break
      }
      totalCost += cost
      currentLevel++
    }

    if (totalCost === 0) {
      return NextResponse.json({ error: 'Cannot afford any upgrades' }, { status: 400 })
    }

    // Update upgrade level
    await prisma.upgrade.upsert({
      where: {
        playerId_upgradeType: {
          playerId: player.id,
          upgradeType: type,
        },
      },
      update: {
        level: currentLevel,
      },
      create: {
        playerId: player.id,
        upgradeType: type,
        level: 10,
      },
    })

    await updateCookies(sessionId, player.cookies - totalCost)

    // Get updated state
    upgrades = await getUpgradesForPlayer(sessionId)
    const unlockedSkillsData = await prisma.unlockedSkill.findMany({
      where: { playerId: player.id },
    })
    const unlockedSkillIds = unlockedSkillsData.map((s) => s.skillId)
    const skillEffects = calculateSkillEffects(unlockedSkillIds)

    const { cookiesPerClick, cookiesPerSecond, effects, clickBoostMultiplier } =
      calculateStats(upgrades, player.cookies - totalCost, skillEffects)

    const upgradeList = buildUpgradeState(upgrades, effects)

    return NextResponse.json({
      cookies: player.cookies - totalCost,
      cookiesPerClick,
      cookiesPerSecond,
      upgrades: upgradeList,
      effects,
      clickBoostMultiplier,
      prestigeCount: player.prestigeCount,
      prestigeStars: player.prestigeStars,
    })
  } catch (error) {
    console.error('Error in /api/upgrade-batch:', error)
    return NextResponse.json(
      { error: 'Failed to buy batch upgrade' },
      { status: 500 }
    )
  }
}
