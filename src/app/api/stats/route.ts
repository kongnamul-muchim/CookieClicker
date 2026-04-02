import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getOrCreatePlayer } from '@/lib/playerService'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const player = await getOrCreatePlayer(sessionId)

    return NextResponse.json({
      totalClicks: player.totalClicks,
      totalCookiesEarned: player.totalCookiesEarned,
      totalUpgradesBought: player.totalUpgradesBought,
      totalEnhancements: player.totalEnhancements,
      totalTranscends: player.totalTranscends,
      prestigeCount: player.prestigeCount,
      prestigeStars: player.prestigeStars,
    })
  } catch (error) {
    console.error('Error in /api/stats:', error)
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}
