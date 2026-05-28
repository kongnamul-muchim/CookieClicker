import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getOrCreatePlayer } from '@/lib/playerService'

/**
 * Preview stars that would be earned from prestige.
 * Stars = √(totalCookiesEarned / 1,000,000)
 */
function calculateStarsEarned(totalCookiesEarned: number): number {
  return Math.floor(Math.sqrt(totalCookiesEarned / 1_000_000))
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const player = await getOrCreatePlayer(sessionId)

    const expectedStars = calculateStarsEarned(player.totalCookiesEarned)

    return NextResponse.json({
      totalCookiesEarned: player.totalCookiesEarned,
      expectedStars,
      prestigeCount: player.prestigeCount,
      prestigeStars: player.prestigeStars,
    })
  } catch (error) {
    console.error('Error in /api/prestige/preview:', error)
    return NextResponse.json(
      { error: 'Failed to get prestige preview' },
      { status: 500 }
    )
  }
}
