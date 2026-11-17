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
  updatedAt: Date
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

/**
 * 클라이언트가 보낸 쿠키 값을 서버 기준으로 검증해 반영한다.
 * 클라이언트는 신뢰할 수 없으므로 "지난 동기화 이후 초당 생산량 × 경과 시간" 만큼만
 * 증가를 허용하고, 그보다 큰 값은 잘라낸다. 감소는 서버 상태를 유지한다(구매는 서버가 처리).
 */
export async function syncCookies(sessionId: string, clientValue: number): Promise<PlayerData> {
  const player = await getOrCreatePlayer(sessionId)

  const elapsedSec = Math.min(
    Math.max((Date.now() - new Date(player.updatedAt).getTime()) / 1000, 0),
    60 * 60 * 24, // 최대 24시간치만 인정
  )
  const allowance = Math.floor(player.cookiesPerSecond * elapsedSec) + 30 // 클릭 여유분
  const capped = Math.max(player.cookies, Math.min(clientValue, player.cookies + allowance))

  if (clientValue - player.cookies > allowance + 1) {
    console.warn(
      `[sync] 비정상 증가 차단 session=${sessionId.slice(0, 8)} 요청=${clientValue} 허용=${player.cookies + allowance}`,
    )
  }

  if (capped === player.cookies) return player
  return await prisma.player.update({
    where: { sessionId },
    data: { cookies: capped },
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
