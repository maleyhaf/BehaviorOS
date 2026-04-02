import type { GameEvent, PlayerState, AdaptationEntry, SessionReport, ClickEvent } from '../types'

export function generateReport(
  events: GameEvent[],
  player: PlayerState,
  adaptationLog: AdaptationEntry[],
  score: number,
  sessionsPlayed: number
): SessionReport {
  const duration = Date.now() - player.sessionStart
  const clicks = events.filter((e): e is ClickEvent => !e.missed)

  const behaviorSummary: string[] = []

  if (player.impulsivity > 0.65) {
    behaviorSummary.push('You prioritized speed over accuracy — clicking early and often.')
  } else if (player.patience > 0.65) {
    behaviorSummary.push('You prioritized delayed reward, waiting for optimal timing.')
  } else {
    behaviorSummary.push('You balanced early and late clicks with moderate timing.')
  }

  if (player.riskTolerance > 0.6) {
    behaviorSummary.push('You consistently chased large shapes — high risk appetite.')
  } else if (player.riskTolerance < 0.35) {
    behaviorSummary.push('You favored smaller, safer shapes — low risk tolerance.')
  }

  if (player.consistency > 0.75) {
    behaviorSummary.push('Your reaction timing was stable and predictable.')
  } else {
    behaviorSummary.push('Your reaction timing was erratic — difficult to model.')
  }

  if (player.totalMisses > player.totalClicks * 0.4) {
    behaviorSummary.push('You missed a significant portion of available shapes.')
  }

  if (sessionsPlayed > 1) {
    behaviorSummary.push(`This is session ${sessionsPlayed}. The system started with prior knowledge of your behavior.`)
  }

  let systemStatement: string
  if (sessionsPlayed >= 5) {
    systemStatement = `${sessionsPlayed} sessions observed. Your profile is well-established. The system no longer needs to learn you.`
  } else if (adaptationLog.length >= 4) {
    systemStatement = 'The system adapted faster than you did.'
  } else if (adaptationLog.length >= 2) {
    systemStatement = 'The system detected your pattern. It adjusted accordingly.'
  } else if (player.consistency > 0.8) {
    systemStatement = 'Your behavior stabilized. The system responded with higher unpredictability.'
  } else {
    systemStatement = 'Your pattern was too inconsistent to fully model. The system is still learning.'
  }

  const t0 = player.sessionStart
  const riskOverTime = clicks.map(e => ({
    t: Math.round((e.clickTime - t0) / 1000),
    risk: e.shapeSizeAtClick,
  }))

  const reactionOverTime = clicks.map(e => ({
    t: Math.round((e.clickTime - t0) / 1000),
    rt: e.reactionTime,
  }))

  return {
    duration,
    finalScore: score,
    player,
    adaptationLog,
    behaviorSummary,
    systemStatement,
    riskOverTime,
    reactionOverTime,
  }
}
