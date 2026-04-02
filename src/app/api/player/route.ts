import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getOrCreatePlayer } from '@/lib/playerService'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const player = await getOrCreatePlayer(sessionId)

    return NextResponse.json(player)
  } catch (error) {
    console.error('Error in /api/player:', error)
    return NextResponse.json(
      { error: 'Failed to get player data' },
      { status: 500 }
    )
  }
}
