import type { Shape, GameModifiers } from '../types'

// base lifetime for shapes in milliseconds
const BASE_LIFETIME = 4000
// base growth rate for shapes per second
const BASE_GROWTH = 22
// minimum radius for shapes
const MIN_RADIUS = 10
// maximum radius for shapes
const MAX_RADIUS = 60

export const MAX_HP = 100
const PERFECT_CLICK_THRESHOLD = 0.75  // size ratio to qualify for HP regen

let _idCounter = 0
// generate unique shape IDs
const uid = () => `s${++_idCounter}`

// generate random velocity vector for shape movement
function randVelocity(speed: number): { vx: number; vy: number } {
  const angle = Math.random() * Math.PI * 2
  const mag = speed * (0.4 + Math.random() * 0.8)
  return { vx: Math.cos(angle) * mag, vy: Math.sin(angle) * mag }
}

// create a new shape with random properties based on game modifiers
export function spawnShape(
  canvasW: number,
  canvasH: number,
  modifiers: GameModifiers
): Shape {
  // determine if this shape should be a decoy based on probability
  const isDecoy = Math.random() < modifiers.decoyProbability
  // decoys have smaller maximum size than regular shapes
  const maxRadius = isDecoy
    ? MIN_RADIUS + Math.random() * 30
    : MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS)

  const margin = MAX_RADIUS + 20
  const { vx, vy } = randVelocity(modifiers.driftSpeed)

  return {
    id: uid(),
    x: margin + Math.random() * (canvasW - margin * 2),
    y: margin + Math.random() * (canvasH - margin * 2),
    vx, vy,
    radius: MIN_RADIUS,
    maxRadius,
    growthRate: BASE_GROWTH * modifiers.growthSpeed,
    lifetime: BASE_LIFETIME * modifiers.decaySpeed,
    spawnTime: Date.now(),
    isDecoy,
    rewardValue: isDecoy ? -10 : 0,
    riskValue: 0,
    opacity: 1,
    pulsePhase: Math.random() * Math.PI * 2,
  }
}

// update shape position, size, and properties over time
export function updateShape(
  shape: Shape,
  dtMs: number,
  canvasW: number,
  canvasH: number
): Shape | null {
  const age = Date.now() - shape.spawnTime
  // remove shape if it has exceeded its lifetime
  if (age >= shape.lifetime) return null

  const progress = age / shape.lifetime
  const dt = dtMs / 1000

  // grow the shape radius based on growth rate and time
  const radius = Math.min(
    shape.radius + shape.growthRate * dt,
    shape.maxRadius
  )

  // update position based on velocity
  let x = shape.x + shape.vx * dt
  let y = shape.y + shape.vy * dt
  let { vx, vy } = shape

  // bounce off canvas edges
  const margin = radius
  if (x - margin < 0) { x = margin; vx = Math.abs(vx) }
  if (x + margin > canvasW) { x = canvasW - margin; vx = -Math.abs(vx) }
  if (y - margin < 0) { y = margin; vy = Math.abs(vy) }
  if (y + margin > canvasH) { y = canvasH - margin; vy = -Math.abs(vy) }

  // add some random movement variation
  vx += (Math.random() - 0.5) * 2
  vy += (Math.random() - 0.5) * 2
  // limit maximum speed to prevent shapes from moving too fast
  const speed = Math.sqrt(vx * vx + vy * vy)
  const maxSpeed = Math.sqrt(shape.vx ** 2 + shape.vy ** 2) * 1.4 + 1
  if (speed > maxSpeed) { vx = (vx / speed) * maxSpeed; vy = (vy / speed) * maxSpeed }

  // fade out shapes near the end of their lifetime
  const opacity = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1

  return { ...shape, x, y, vx, vy, radius, opacity, riskValue: progress }
}

// calculate score reward for clicking a shape
export function calcReward(shape: Shape, modifiers: GameModifiers): number {
  // decoys give negative score
  if (shape.isDecoy) return -Math.round(10 * modifiers.rewardScaling)

  const age = Date.now() - shape.spawnTime
  const progress = age / shape.lifetime
  const sizeFactor = shape.radius / shape.maxRadius
  // timing bonus based on when the shape was clicked during its lifetime
  const timingBonus = Math.sin(progress * Math.PI) * 15
  const base = Math.round(sizeFactor * 30 + timingBonus)

  return Math.max(1, Math.round(base * modifiers.rewardScaling))
}

// HP delta for clicking a shape (positive = heal, negative = damage)
export function calcClickHpDelta(shape: Shape, modifiers: GameModifiers): number {
  if (shape.isDecoy) {
    // Decoys: flat -20 scaled by modifier, always hurts
    return -Math.round(20 * modifiers.decoyDamageMultiplier)
  }

  const sizeFactor = shape.radius / shape.maxRadius
  if (sizeFactor >= PERFECT_CLICK_THRESHOLD) {
    // Perfect click — clicked at 75%+ growth, heal up to +8 HP
    return Math.round((sizeFactor - PERFECT_CLICK_THRESHOLD) / (1 - PERFECT_CLICK_THRESHOLD) * 8)
  }

  return 0  // normal click, no HP change
}

// HP delta for a shape expiring without being clicked
export function calcMissHpDelta(shape: Shape, modifiers: GameModifiers): number {
  if (shape.isDecoy) return 0  // missing a decoy is correct — no penalty

  // Scale damage by how big the shape got: small miss = -2, large miss = -12
  const sizeFactor = shape.radius / shape.maxRadius
  return -Math.round(2 + sizeFactor * 10 * modifiers.missDamageMultiplier)
}

// check if a point is inside a shape (circular hit test)
export function hitTest(shape: Shape, x: number, y: number): boolean {
  const dx = shape.x - x
  const dy = shape.y - y
  return Math.sqrt(dx * dx + dy * dy) <= shape.radius
}