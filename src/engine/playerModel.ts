import type { GameEvent, PlayerState, ClickEvent } from '../types'

const DEFAULT_STATE: PlayerState = {
  riskTolerance: 0.5,
  impulsivity: 0.5,
  patience: 0.5,
  consistency: 0.5,
  totalClicks: 0,
  totalMisses: 0,
  sessionStart: Date.now(),
}

// ─── Rolling window ───────────────────────────────────────────────────────────

const WINDOW = 8   // use last N events for trait calc

function lerp(current: number, target: number, alpha: number) {
  return current + (target - current) * alpha
}

// ─── Update player model ──────────────────────────────────────────────────────

export function updatePlayerModel(
  events: GameEvent[],
  current: PlayerState
): PlayerState {
  if (events.length === 0) return current

  const clicks = events
    .filter((e): e is ClickEvent => !e.missed)
    .slice(-WINDOW)

  const misses = events.filter(e => e.missed).length

  if (clicks.length === 0) {
    return {
      ...current,
      totalMisses: misses,
      patience: lerp(current.patience, 0.8, 0.1),   // not clicking = more patient
      impulsivity: lerp(current.impulsivity, 0.2, 0.1),
    }
  }

  // --- Impulsivity: how early are they clicking? ---
  const avgReactionRatio = clicks.reduce((s, e) => s + e.reactionTime, 0)
    / clicks.length / 4000   // normalized to max lifetime
  const impulsivity = lerp(current.impulsivity, 1 - avgReactionRatio, 0.25)

  // --- Risk tolerance: how large are the shapes they click? ---
  const avgSize = clicks.reduce((s, e) => s + e.shapeSizeAtClick, 0) / clicks.length
  const riskTolerance = lerp(current.riskTolerance, avgSize, 0.25)

  // --- Patience: inverse of impulsivity, weighted by misses ---
  const patience = lerp(current.patience, avgReactionRatio, 0.25)

  // --- Consistency: how stable is the reaction time? ---
  let consistency = current.consistency
  if (clicks.length >= 4) {
    const times = clicks.map(e => e.reactionTime)
    const mean = times.reduce((a, b) => a + b, 0) / times.length
    const variance = times.reduce((s, t) => s + (t - mean) ** 2, 0) / times.length
    const stdDev = Math.sqrt(variance)
    const normalizedStd = Math.min(stdDev / 2000, 1)   // 0 = very consistent
    consistency = lerp(current.consistency, 1 - normalizedStd, 0.2)
  }

  return {
    riskTolerance: clamp(riskTolerance),
    impulsivity: clamp(impulsivity),
    patience: clamp(patience),
    consistency: clamp(consistency),
    totalClicks: current.totalClicks + 1,
    totalMisses: misses,
    sessionStart: current.sessionStart,
  }
}

function clamp(v: number) {
  return Math.max(0, Math.min(1, v))
}

export { DEFAULT_STATE }
