import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getOrCreatePlayer } from '@/lib/playerService'
import { getSkillById, SKILLS } from '@/config/skills'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const { skillId } = await params
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('player_id')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const player = await getOrCreatePlayer(sessionId)
    const skill = getSkillById(skillId)

    if (!skill) {
      return NextResponse.json({ error: 'Invalid skill ID' }, { status: 400 })
    }

    // Check if player has enough prestige stars
    if (player.prestigeStars < skill.cost) {
      return NextResponse.json(
        { error: 'Not enough prestige stars' },
        { status: 400 }
      )
    }

    // Check if skill is already unlocked
    const existingSkill = await prisma.unlockedSkill.findUnique({
      where: {
        playerId_skillId: {
          playerId: player.id,
          skillId,
        },
      },
    })

    if (existingSkill) {
      return NextResponse.json({ error: 'Skill already unlocked' }, { status: 400 })
    }

    // Check prerequisites
    if (skill.requires) {
      const unlockedSkills = await prisma.unlockedSkill.findMany({
        where: { playerId: player.id },
      })
      const unlockedSkillIds = unlockedSkills.map((s) => s.skillId)

      const missingPrereqs = skill.requires.filter(
        (prereq) => !unlockedSkillIds.includes(prereq)
      )

      if (missingPrereqs.length > 0) {
        return NextResponse.json(
          { error: 'Missing prerequisites', missingPrereqs },
          { status: 400 }
        )
      }
    }

    // Unlock the skill
    await prisma.unlockedSkill.create({
      data: {
        playerId: player.id,
        skillId,
      },
    })

    // Deduct prestige stars
    await prisma.player.update({
      where: { id: player.id },
      data: {
        prestigeStars: player.prestigeStars - skill.cost,
      },
    })

    return NextResponse.json({
      success: true,
      skillId,
      remainingStars: player.prestigeStars - skill.cost,
    })
  } catch (error) {
    console.error('Error in /api/skill/unlock:', error)
    return NextResponse.json(
      { error: 'Failed to unlock skill' },
      { status: 500 }
    )
  }
}
