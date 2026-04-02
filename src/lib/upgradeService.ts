import { prisma } from './prisma'
import { getUpgradeConfig, calculateUpgradeCost } from '../config/upgrades'

export interface UpgradeData {
  id: number
  playerId: number
  upgradeType: string
  level: number
  enhancementCount: number
  specialEnhancement: number
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

  // Calculate new CPS
  const newCookiesPerSecond = player.cookiesPerSecond + config.cpsBonus

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
      cookiesPerSecond: newCookiesPerSecond,
      totalUpgradesBought: { increment: 1 },
    },
  })

  return {
    success: true,
    newCookies: currentCookies - cost,
    upgrade,
  }
}

export async function enhance(
  sessionId: string,
  upgradeType: string,
  currentCookies: number
): Promise<{
  success: boolean
  error?: string
  newCookies?: number
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
  if (!upgrade || upgrade.level === 0) {
    return { success: false, error: 'Upgrade not purchased' }
  }

  const cost = config.baseCost * 100 // Enhancement cost
  if (currentCookies < cost) {
    return { success: false, error: 'Not enough cookies' }
  }

  await prisma.upgrade.update({
    where: { id: upgrade.id },
    data: {
      enhancementCount: { increment: 1 },
    },
  })

  await prisma.player.update({
    where: { sessionId },
    data: {
      cookies: currentCookies - cost,
      totalEnhancements: { increment: 1 },
    },
  })

  return {
    success: true,
    newCookies: currentCookies - cost,
  }
}

export async function specialEnhance(
  sessionId: string,
  upgradeType: string,
  currentCookies: number
): Promise<{
  success: boolean
  error?: string
  newCookies?: number
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
  if (!upgrade || upgrade.level === 0) {
    return { success: false, error: 'Upgrade not purchased' }
  }

  const cost = config.baseCost * 1000 // Special enhancement cost
  if (currentCookies < cost) {
    return { success: false, error: 'Not enough cookies' }
  }

  await prisma.upgrade.update({
    where: { id: upgrade.id },
    data: {
      specialEnhancement: 1,
    },
  })

  await prisma.player.update({
    where: { sessionId },
    data: {
      cookies: currentCookies - cost,
      totalTranscends: { increment: 1 },
    },
  })

  return {
    success: true,
    newCookies: currentCookies - cost,
  }
}
