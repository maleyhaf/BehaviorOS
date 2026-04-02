import type { Shape, GameModifiers } from '../types'

const BASE_LIFETIME = 4000   // ms
const BASE_GROWTH = 22        // px/sec
const MIN_RADIUS = 10
const MAX_RADIUS = 200

let _idCounter = 0
const uid = () => `s${++_idCounter}`

// ─── Spawn ───────────────────────────────────────────────────────────────────

export function spawnShape(
  canvasW: number,
  canvasH: number,
  modifiers: GameModifiers
): Shape {
  const isDecoy = Math.random() < modifiers.decoyProbability
  const maxRadius = isDecoy
    ? MIN_RADIUS + Math.random() * 30  // decoys look enticing but are medium
    : MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS)

  const margin = MAX_RADIUS + 20
  return {
    id: uid(),
    x: margin + Math.random() * (canvasW - margin * 2),
    y: margin + Math.random() * (canvasH - margin * 2),
    radius: MIN_RADIUS,
    maxRadius,
    growthRate: BASE_GROWTH * modifiers.growthSpeed,
    lifetime: BASE_LIFETIME * modifiers.decaySpeed,
    spawnTime: Date.now(),
    isDecoy,
    rewardValue: isDecoy ? -10 : 0,  // computed on click
    riskValue: 0,
    opacity: 1,
    pulsePhase: Math.random() * Math.PI * 2,
  }
}

// ─── Update ──────────────────────────────────────────────────────────────────

export function updateShape(shape: Shape, dtMs: number): Shape | null {
  const age = Date.now() - shape.spawnTime
  if (age >= shape.lifetime) return null   // expired

  const progress = age / shape.lifetime
  const radius = Math.min(
    shape.radius + shape.growthRate * (dtMs / 1000),
    shape.maxRadius
  )

  // fade out in final 30% of life
  const opacity = progress > 0.7
    ? 1 - (progress - 0.7) / 0.3
    : 1

  return {
    ...shape,
    radius,
    opacity,
    riskValue: progress,   // 0 = fresh, 1 = about to expire
  }
}

// ─── Reward calculation ───────────────────────────────────────────────────────

export function calcReward(shape: Shape, modifiers: GameModifiers): number {
  if (shape.isDecoy) return -Math.round(10 * modifiers.rewardScaling)

  const age = Date.now() - shape.spawnTime
  const progress = age / shape.lifetime
  const sizeFactor = shape.radius / shape.maxRadius

  // Sweet spot: reward peaks at ~60% growth, falls off early AND late
  const timingBonus = Math.sin(progress * Math.PI) * 15
  const base = Math.round(sizeFactor * 30 + timingBonus)

  return Math.max(1, Math.round(base * modifiers.rewardScaling))
}

// ─── Hit test ────────────────────────────────────────────────────────────────

export function hitTest(shape: Shape, x: number, y: number): boolean {
  const dx = shape.x - x
  const dy = shape.y - y
  return Math.sqrt(dx * dx + dy * dy) <= shape.radius
}
