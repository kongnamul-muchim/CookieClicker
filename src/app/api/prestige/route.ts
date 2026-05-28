import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getOrCreatePlayer, applyPrestige, getPrestigeData } from '@/lib/playerService'
import { checkAchievements } from '@/lib/achievementChecker'

/**
 * New prestige formula: stars = √(totalCookiesEarned / 1,000,000)
 * 
 * Examples:
 *   1M cookies  →  1⭐
 *  10M cookies  →  3⭐
 * 100M cookies  → 10⭐
 *   1B cookies  → 31⭐
 *  10B cookies  → 100⭐
 *   1T cookies  → 1,000⭐
 */
function calculateStarsEarned(totalCookiesEarned: number): number {
  return Math.floor(Math.sqrt(totalCookiesEarned / 1_000_000))
}

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const player = await getOrCreatePlayer(sessionId)

    if (player.totalCookiesEarned < 1_000_000) {
      return NextResponse.json(
        { error: 'Need at least 1M cookies earned to prestige' },
        { status: 400 }
      )
    }

    const starsEarned = calculateStarsEarned(player.totalCookiesEarned)

    // Past prestiges already gave stars — only earn the difference
    const newStars = Math.max(0, starsEarned)

    if (newStars <= 0) {
      return NextResponse.json(
        { error: 'No new stars to earn. Keep growing!' },
        { status: 400 }
      )
    }

    const result = await applyPrestige(sessionId, newStars)

    // Check achievements
    const newAchievements = await checkAchievements(sessionId)

    return NextResponse.json({ ...result, newAchievements })
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
