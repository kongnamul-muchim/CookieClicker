import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getOrCreatePlayer, updateCookies, incrementStat } from '@/lib/playerService'
import { getUpgradesForPlayer } from '@/lib/upgradeService'
import { getUpgradeConfig, calculateSpecialEnhancementCost } from '@/config/upgrades'

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
    const config = getUpgradeConfig(type)

    if (!config) {
      return NextResponse.json({ error: 'Invalid upgrade type' }, { status: 400 })
    }

    const upgrades = await getUpgradesForPlayer(sessionId)
    const upgrade = upgrades.find((u) => u.upgradeType === type)

    if (!upgrade || upgrade.level === 0) {
      return NextResponse.json({ error: 'Upgrade not purchased' }, { status: 400 })
    }

    const cost = calculateSpecialEnhancementCost(config.baseCost)
    if (player.cookies < cost) {
      return NextResponse.json({ error: 'Not enough cookies' }, { status: 400 })
    }

    await prisma.upgrade.update({
      where: { id: upgrade.id },
      data: {
        specialEnhancement: 1,
      },
    })

    await updateCookies(sessionId, player.cookies - cost)
    await incrementStat(sessionId, 'totalTranscends', 1)

    return NextResponse.json({
      success: true,
      cookies: player.cookies - cost,
      specialEnhancement: 1,
    })
  } catch (error) {
    console.error('Error in /api/special-enhance:', error)
    return NextResponse.json(
      { error: 'Failed to special enhance' },
      { status: 500 }
    )
  }
}
