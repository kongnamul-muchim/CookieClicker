import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getOrCreatePlayer, applyPrestige, getPrestigeData } from '@/lib/playerService'
import { getUpgradesForPlayer } from '@/lib/upgradeService'

// Calculate stars earned based on total enhancements
function calculateStarsEarned(upgrades: Array<{ enhancementCount: number }>): number {
  const totalEnhancements = upgrades.reduce((sum, u) => sum + (u.enhancementCount || 0), 0)
  return Math.floor(totalEnhancements / 10) // 1 star per 10 enhancements
}

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const player = await getOrCreatePlayer(sessionId)
    const upgrades = await getUpgradesForPlayer(sessionId)

    const totalEnhancements = upgrades.reduce(
      (sum, u) => sum + (u.enhancementCount || 0),
      0
    )

    if (totalEnhancements === 0) {
      return NextResponse.json(
        { error: 'No enhancements to prestige' },
        { status: 400 }
      )
    }

    const starsEarned = calculateStarsEarned(upgrades)
    const result = await applyPrestige(sessionId, starsEarned)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in /api/prestige:', error)
    return NextResponse.json(
      { error: 'Failed to prestige' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const prestigeData = await getPrestigeData(sessionId)

    return NextResponse.json(prestigeData)
  } catch (error) {
    console.error('Error in /api/prestige:', error)
    return NextResponse.json(
      { error: 'Failed to get prestige data' },
      { status: 500 }
    )
  }
}
