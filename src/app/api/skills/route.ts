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

    // 첫 방문자는 아직 player_id 쿠키가 없다. 401을 던지면 스킬 패널이
    // 빈 채로 깨져 보이므로, 게스트 기본값을 200으로 내려 화면이 그려지게 한다.
    if (!sessionId) {
      return NextResponse.json({
        prestigeCount: 0,
        prestigeStars: 0,
        unlockedSkills: [],
        allSkills: getAllSkills(),
        skillEffects: calculateSkillEffects([]),
      })
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
