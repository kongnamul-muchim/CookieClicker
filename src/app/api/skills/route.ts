import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getOrCreatePlayer } from '@/lib/playerService'
import { getAllSkills, SKILLS } from '@/config/skills'
import { calculateSkillEffects } from '@/config/skillEffects'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const player = await getOrCreatePlayer(sessionId)

    const unlockedSkillsData = await prisma.unlockedSkill.findMany({
      where: { playerId: player.id },
    })
    const unlockedSkillIds = unlockedSkillsData.map((s) => s.skillId)
    const skillEffects = calculateSkillEffects(unlockedSkillIds)

    return NextResponse.json({
      prestigeCount: player.prestigeCount,
      prestigeStars: player.prestigeStars,
      unlockedSkills: unlockedSkillsData.map((s) => ({ skill_id: s.skillId })),
      allSkills: getAllSkills(),
      skillEffects,
    })
  } catch (error) {
    console.error('Error in /api/skills:', error)
    return NextResponse.json(
      { error: 'Failed to get skills' },
      { status: 500 }
    )
  }
}
