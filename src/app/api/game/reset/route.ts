import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { resetPlayer } from '@/lib/playerService'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    await resetPlayer(sessionId)

    return NextResponse.json({
      success: true,
      message: 'Game reset successfully',
    })
  } catch (error) {
    console.error('Error in /api/game/reset:', error)
    return NextResponse.json(
      { error: 'Failed to reset game' },
      { status: 500 }
    )
  }
}
