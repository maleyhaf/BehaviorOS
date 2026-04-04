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
const WINDOW = 10   // use last N events for trait calculation

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

  // slice the full event stream first so miss/hit counts are window-accurate
  const recentEvents = events.slice(-WINDOW)
  const recentHits   = recentEvents.filter((e): e is ClickEvent => !e.missed)
  const recentMisses = recentEvents.filter(e => e.missed).length

  const totalHits   = events.filter(e => !e.missed).length
  const totalMisses = events.filter(e => e.missed).length

  // get only clicks from recent window
  const clicks = events
    .filter((e): e is ClickEvent => !e.missed)
    .slice(-WINDOW)

  // if no recent clicks, assume player is being more patient
  if (clicks.length === 0) {
    return {
      ...current,
      totalMisses,
      totalClicks: totalHits,
      // waiting = increased patience
      patience: lerp(current.patience, 0.8, 0.1),
      // waiting = decreased impulsivity
      impulsivity: lerp(current.impulsivity, 0.2, 0.1),
    }
  }

  // normalize reaction time against max shape lifetime, clamped to 0-1
  const avgReactionRatio = clamp(
    clicks.reduce((s, e) => s + e.reactionTime, 0) / clicks.length / 4000
  )

  // inverted: faster reaction = higher impulsivity
  const impulsivity = lerp(current.impulsivity, 1 - avgReactionRatio, 0.25)

  // measure shape size when clicked (large = risk tolerant, small = risk averse)
  const avgSize = clicks.reduce((s, e) => s + e.shapeSizeAtClick, 0) / clicks.length
  const riskTolerance = lerp(current.riskTolerance, avgSize, 0.25)

  // patience: how late in the shape's lifetime the player clicks, independent of impulsivity.
  // high = player waits for shapes to grow; low = player clicks early or misses a lot
  const avgGrowthRatio = clicks.reduce((s, e) => s + e.shapeSizeAtClick, 0) / clicks.length
  const missRatio = recentMisses / Math.max(1, recentHits.length + recentMisses)
  // patient players click late (high size) but also don't miss — missing is impatience failing
  const patience = lerp(current.patience, avgGrowthRatio * (1 - missRatio * 0.5), 0.25)

  // measure timing stability (low variation = high consistency)
  let consistency = current.consistency
  if (clicks.length >= 4) {
    const times = clicks.map(e => e.reactionTime)
    const mean = times.reduce((a, b) => a + b, 0) / times.length
    const variance = times.reduce((s, t) => s + (t - mean) ** 2, 0) / times.length
    const stdDev = Math.sqrt(variance)
    // low variation = very consistent, high variation = inconsistent
    const normalizedStd = clamp(stdDev / 2000)
    consistency = lerp(current.consistency, 1 - normalizedStd, 0.2)
  }

  // performance: accuracy over recent window + how quickly the player reacted.
  // does NOT include consistency — that is already its own trait and conflating
  // the two would reward consistent-but-sloppy players unfairly.
  const accuracy = recentHits.length / Math.max(1, recentHits.length + recentMisses)
  // early click = player saw the shape fast = higher skill signal
  const reactionScore = 1 - avgReactionRatio
  const performance = lerp(
    current.performance,
    accuracy * 0.7 + reactionScore * 0.3,
    0.2  // smoother than traits so it doesn't swing on a single good/bad click
  )

  // constrain all traits to 0-1 range
  return {
    riskTolerance: clamp(riskTolerance),
    impulsivity:   clamp(impulsivity),
    patience:      clamp(patience),
    consistency:   clamp(consistency),
    performance:   clamp(performance),
    totalClicks:   totalHits,
    totalMisses,
    sessionStart:  current.sessionStart,
  }
}

function clamp(v: number) {
  return Math.max(0, Math.min(1, v))
}

export { DEFAULT_STATE }