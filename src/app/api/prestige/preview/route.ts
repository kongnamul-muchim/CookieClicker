import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getOrCreatePlayer, getPrestigeData } from '@/lib/playerService'
import { getUpgradesForPlayer } from '@/lib/upgradeService'

// Calculate stars earned based on total enhancements
function calculateStarsEarned(upgrades: Array<{ enhancementCount: number }>): number {
  const totalEnhancements = upgrades.reduce((sum, u) => sum + (u.enhancementCount || 0), 0)
  return Math.floor(totalEnhancements / 10) // 1 star per 10 enhancements
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const upgrades = await getUpgradesForPlayer(sessionId)
    const totalEnhancements = upgrades.reduce(
      (sum, u) => sum + (u.enhancementCount || 0),
      0
    )

    const expectedStars = calculateStarsEarned(upgrades)

    return NextResponse.json({
      totalEnhancements,
      expectedStars,
    })
  } catch (error) {
    console.error('Error in /api/prestige/preview:', error)
    return NextResponse.json(
      { error: 'Failed to get prestige preview' },
      { status: 500 }
    )
  }
}
