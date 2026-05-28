import { prisma } from './prisma'
import { getUpgradeConfig, calculateUpgradeCost } from '../config/upgrades'

export interface UpgradeData {
  id: number
  playerId: number
  upgradeType: string
  level: number
}

export async function getUpgradesForPlayer(sessionId: string): Promise<UpgradeData[]> {
  const player = await prisma.player.findUnique({
    where: { sessionId },
    include: { upgrades: true },
  })

  if (!player) return []
  return player.upgrades
}

export async function getUpgradeForPlayer(
  sessionId: string,
  upgradeType: string
): Promise<UpgradeData | null> {
  const player = await prisma.player.findUnique({
    where: { sessionId },
    include: {
      upgrades: {
        where: { upgradeType },
      },
    },
  })

  if (!player || player.upgrades.length === 0) return null
  return player.upgrades[0]
}

export async function buyUpgrade(
  sessionId: string,
  upgradeType: string,
  currentCookies: number
): Promise<{
  success: boolean
  error?: string
  newCookies?: number
  upgrade?: UpgradeData
}> {
  const player = await prisma.player.findUnique({
    where: { sessionId },
    include: { upgrades: true },
  })

  if (!player) {
    return { success: false, error: 'Player not found' }
  }

  const config = getUpgradeConfig(upgradeType)
  if (!config) {
    return { success: false, error: 'Invalid upgrade type' }
  }

  let upgrade = player.upgrades.find((u) => u.upgradeType === upgradeType)
  const level = upgrade?.level || 0
  const cost = calculateUpgradeCost(config.baseCost, level)

  if (currentCookies < cost) {
    return { success: false, error: 'Not enough cookies' }
  }

  upgrade = await prisma.upgrade.upsert({
    where: {
      playerId_upgradeType: {
        playerId: player.id,
        upgradeType,
      },
    },
    update: {
      level: level + 1,
    },
    create: {
      playerId: player.id,
      upgradeType,
      level: 1,
    },
  })

  await prisma.player.update({
    where: { sessionId },
    data: {
      cookies: currentCookies - cost,
      totalUpgradesBought: { increment: 1 },
    },
  })

  return {
    success: true,
    newCookies: currentCookies - cost,
    upgrade,
  }
}

export async function buyUpgradeBatch(
  sessionId: string,
  upgradeType: string,
  currentCookies: number,
  count: number = 10
): Promise<{
  success: boolean
  error?: string
  newCookies?: number
  levelsBought?: number
}> {
  const player = await prisma.player.findUnique({
    where: { sessionId },
    include: { upgrades: true },
  })

  if (!player) {
    return { success: false, error: 'Player not found' }
  }

  const config = getUpgradeConfig(upgradeType)
  if (!config) {
    return { success: false, error: 'Invalid upgrade type' }
  }

  let upgrade = player.upgrades.find((u) => u.upgradeType === upgradeType)
  const startLevel = upgrade?.level || 0

  // Calculate total cost for `count` levels
  let totalCost = 0
  for (let i = 0; i < count; i++) {
    totalCost += calculateUpgradeCost(config.baseCost, startLevel + i)
  }

  if (currentCookies < totalCost) {
    return { success: false, error: 'Not enough cookies' }
  }

  const newLevel = startLevel + count

  upgrade = await prisma.upgrade.upsert({
    where: {
      playerId_upgradeType: {
        playerId: player.id,
        upgradeType,
      },
    },
    update: {
      level: newLevel,
    },
    create: {
      playerId: player.id,
      upgradeType,
      level: count,
    },
  })

  await prisma.player.update({
    where: { sessionId },
    data: {
      cookies: currentCookies - totalCost,
      totalUpgradesBought: { increment: count },
    },
  })

  return {
    success: true,
    newCookies: currentCookies - totalCost,
    levelsBought: count,
  }
}
