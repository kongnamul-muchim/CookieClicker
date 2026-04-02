import { prisma } from './prisma'

export interface PlayerData {
  id: number
  sessionId: string
  cookies: number
  cookiesPerClick: number
  cookiesPerSecond: number
  prestigeCount: number
  prestigeStars: number
  totalClicks: number
  totalCookiesEarned: number
  totalUpgradesBought: number
  totalEnhancements: number
  totalTranscends: number
}

export async function getOrCreatePlayer(sessionId: string): Promise<PlayerData> {
  let player = await prisma.player.findUnique({
    where: { sessionId },
  })

  if (!player) {
    player = await prisma.player.create({
      data: {
        sessionId,
        cookies: 0,
        cookiesPerClick: 1,
        cookiesPerSecond: 0,
      },
    })
  }

  return player
}

export async function updateCookies(sessionId: string, cookies: number): Promise<PlayerData> {
  return await prisma.player.update({
    where: { sessionId },
    data: { cookies },
  })
}

export async function incrementStat(
  sessionId: string,
  stat: keyof PlayerData,
  amount: number = 1
): Promise<PlayerData> {
  return await prisma.player.update({
    where: { sessionId },
    data: {
      [stat]: { increment: amount },
    },
  })
}

export async function resetPlayer(sessionId: string): Promise<PlayerData> {
  // Get current prestige data
  const player = await getOrCreatePlayer(sessionId)
  
  await prisma.$transaction([
    prisma.player.update({
      where: { sessionId },
      data: {
        cookies: 0,
        cookiesPerClick: 1,
        cookiesPerSecond: 0,
      },
    }),
    prisma.upgrade.deleteMany({
      where: { playerId: player.id },
    }),
    // Keep skills and achievements for prestige
  ])

  return await getOrCreatePlayer(sessionId)
}

export async function getPrestigeData(sessionId: string) {
  const player = await getOrCreatePlayer(sessionId)
  const upgrades = await prisma.upgrade.findMany({
    where: { playerId: player.id },
  })

  const totalEnhancementCount = upgrades.reduce(
    (sum, u) => sum + (u.enhancementCount || 0),
    0
  )

  return {
    totalEnhancements: totalEnhancementCount,
    prestigeCount: player.prestigeCount,
    prestigeStars: player.prestigeStars,
  }
}

export async function applyPrestige(sessionId: string, starsEarned: number): Promise<{
  prestigeCount: number
  starsEarned: number
  totalStars: number
}> {
  const player = await getOrCreatePlayer(sessionId)
  const currentPrestige = player.prestigeCount
  const currentStars = player.prestigeStars

  await resetPlayer(sessionId)

  const updatedPlayer = await prisma.player.update({
    where: { sessionId },
    data: {
      prestigeCount: currentPrestige + 1,
      prestigeStars: currentStars + starsEarned,
    },
  })

  // Unlock prestige_start skill if first prestige
  if (currentPrestige === 0) {
    await prisma.unlockedSkill.upsert({
      where: {
        playerId_skillId: {
          playerId: updatedPlayer.id,
          skillId: 'prestige_start',
        },
      },
      update: {},
      create: {
        playerId: updatedPlayer.id,
        skillId: 'prestige_start',
      },
    })
  }

  return {
    prestigeCount: currentPrestige + 1,
    starsEarned,
    totalStars: currentStars + starsEarned,
  }
}
