import { cookies } from 'next/headers'

export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get('player_id')?.value

  if (!sessionId) {
    sessionId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  return sessionId
}

export async function setSessionCookie(sessionId: string) {
  const cookieStore = await cookies()
  cookieStore.set('player_id', sessionId, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  })
}
