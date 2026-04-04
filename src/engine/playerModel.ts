import type { GameEvent, PlayerState, ClickEvent } from '../types'

const DEFAULT_STATE: PlayerState = {
  riskTolerance: 0.5,
  impulsivity: 0.5,
  patience: 0.5,
  consistency: 0.5,
  performance: 0.5,
  totalClicks: 0,
  totalMisses: 0,
  sessionStart: Date.now(),
}

// analyze recent behavior changes to rate player traits
const WINDOW = 8   // use last N events for trait calculation

function lerp(current: number, target: number, alpha: number) {
  // smooth transition from current value toward target value
  return current + (target - current) * alpha
}

// update player behavior profile based on recent clicks
export function updatePlayerModel(
  events: GameEvent[],
  current: PlayerState
): PlayerState {
  if (events.length === 0) return current

  // get only clicks from recent window
  const clicks = events
    .filter((e): e is ClickEvent => !e.missed)
    .slice(-WINDOW)

  const misses = events.filter(e => e.missed).length

  // if no recent clicks, assume player is being more patient
  if (clicks.length === 0) {
    return {
      ...current,
      totalMisses: misses,
      // waiting = increased patience
      patience: lerp(current.patience, 0.8, 0.1),
      // waiting = decreased impulsivity
      impulsivity: lerp(current.impulsivity, 0.2, 0.1),
    }
  }

  // measure how fast player clicks (early = impulsive, late = patient)
  const avgReactionRatio = clicks.reduce((s, e) => s + e.reactionTime, 0)
    / clicks.length / 4000   // normalize against max shape lifetime
  // inverted: faster reaction = higher impulsivity
  const impulsivity = lerp(current.impulsivity, 1 - avgReactionRatio, 0.25)

  // measure shape size when clicked (large = risk tolerant, small = risk averse)
  const avgSize = clicks.reduce((s, e) => s + e.shapeSizeAtClick, 0) / clicks.length
  const riskTolerance = lerp(current.riskTolerance, avgSize, 0.25)

  // measure waiting time (mirrors impulsivity trait)
  const patience = lerp(current.patience, avgReactionRatio, 0.25)

  // measure timing stability (low variation = high consistency, good for prediction)
  let consistency = current.consistency
  if (clicks.length >= 4) {
    const times = clicks.map(e => e.reactionTime)
    const mean = times.reduce((a, b) => a + b, 0) / times.length
    const variance = times.reduce((s, t) => s + (t - mean) ** 2, 0) / times.length
    const stdDev = Math.sqrt(variance)
    // low variation (0) = very consistent, high variation = inconsistent
    const normalizedStd = Math.min(stdDev / 2000, 1)
    consistency = lerp(current.consistency, 1 - normalizedStd, 0.2)
  }

  // accuracy & consistency to get performance metric
  const recenthits = clicks.length
  const recentMisses = (events.filter(e => e.missed).slice(-WINDOW)).length
  const accuracy = recenthits / Math.max(1, recenthits + recentMisses)
  const performance = accuracy * 0.6 +
      (consistency ?? 0) * 0.4

  // constrain all traits to 0-1 range
  return {
    riskTolerance: clamp(riskTolerance),
    impulsivity: clamp(impulsivity),
    patience: clamp(patience),
    consistency: clamp(consistency),
    performance: clamp(performance),
    totalClicks: current.totalClicks + 1,
    totalMisses: misses,
    sessionStart: current.sessionStart,
  }
}

function clamp(v: number) {
  return Math.max(0, Math.min(1, v))
}

export { DEFAULT_STATE }
