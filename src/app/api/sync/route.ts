import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { syncCookies } from '@/lib/playerService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cookies: cookieValue } = body

    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    if (typeof cookieValue !== 'number') {
      return NextResponse.json({ error: 'Invalid cookies value' }, { status: 400 })
    }

    // 클라이언트 값을 그대로 저장하지 않는다. 서버가 허용 범위로 잘라낸다.
    const player = await syncCookies(sessionId, cookieValue)

    return NextResponse.json({ cookies: player.cookies })
  } catch (error) {
    console.error('Error in /api/sync:', error)
    return NextResponse.json(
      { error: 'Failed to sync cookies' },
      { status: 500 }
    )
  }
}
