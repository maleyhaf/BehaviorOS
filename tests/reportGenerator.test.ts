import { describe, it, expect } from 'vitest'
import { generateReport } from '../src/engine/reportGenerator'
import { makePlayer, click, miss } from './helpers'

const entry = { timestamp: 0, trigger: 't', change: {}, description: 'd' }
const log = (n: number) => Array.from({ length: n }, () => entry)

describe('generateReport', () => {
  it('copies score, duration, player and log into the report', () => {
    const player = makePlayer()
    const l = log(1)
    const r = generateReport([], player, l, 250, 1, 60)
    expect(r.finalScore).toBe(250)
    expect(r.duration).toBe(60)
    expect(r.player).toBe(player)
    expect(r.adaptationLog).toBe(l)
    expect(r.causeOfDeath).toBeNull()
  })

  it('includes cause of death when provided', () => {
    const r = generateReport([], makePlayer(), [], 0, 1, 10, 'HP depleted')
    expect(r.causeOfDeath).toBe('HP depleted')
    expect(r.behaviorSummary[0]).toBe('Session ended: HP depleted.')
  })

  it('impulsive players get the speed-over-accuracy message', () => {
    const r = generateReport([], makePlayer({ impulsivity: 0.8 }), [], 0, 1, 10)
    expect(r.behaviorSummary.join(' ')).toContain('speed over accuracy')
  })

  it('patient (non-impulsive) players get the delayed-reward message', () => {
    const r = generateReport([], makePlayer({ patience: 0.8 }), [], 0, 1, 10)
    expect(r.behaviorSummary.join(' ')).toContain('delayed reward')
  })

  it('balanced players get the moderate-timing message', () => {
    const r = generateReport([], makePlayer(), [], 0, 1, 10)
    expect(r.behaviorSummary.join(' ')).toContain('moderate timing')
  })

  it('high risk tolerance message', () => {
    const r = generateReport([], makePlayer({ riskTolerance: 0.9 }), [], 0, 1, 10)
    expect(r.behaviorSummary.join(' ')).toContain('high risk appetite')
  })

  it('low risk tolerance message', () => {
    const r = generateReport([], makePlayer({ riskTolerance: 0.1 }), [], 0, 1, 10)
    expect(r.behaviorSummary.join(' ')).toContain('low risk tolerance')
  })

  it('mid risk tolerance adds no risk message', () => {
    const r = generateReport([], makePlayer({ riskTolerance: 0.5 }), [], 0, 1, 10)
    const text = r.behaviorSummary.join(' ')
    expect(text).not.toContain('risk appetite')
    expect(text).not.toContain('risk tolerance')
  })

  it('consistent timing message', () => {
    const r = generateReport([], makePlayer({ consistency: 0.9 }), [], 0, 1, 10)
    expect(r.behaviorSummary.join(' ')).toContain('stable and predictable')
  })

  it('erratic timing message', () => {
    const r = generateReport([], makePlayer({ consistency: 0.4 }), [], 0, 1, 10)
    expect(r.behaviorSummary.join(' ')).toContain('erratic')
  })

  it('reports a high miss rate', () => {
    const r = generateReport([], makePlayer({ totalClicks: 10, totalMisses: 5 }), [], 0, 1, 10)
    expect(r.behaviorSummary.join(' ')).toContain('missed a significant portion')
  })

  it('does not report miss rate when misses are low', () => {
    const r = generateReport([], makePlayer({ totalClicks: 10, totalMisses: 1 }), [], 0, 1, 10)
    expect(r.behaviorSummary.join(' ')).not.toContain('missed a significant portion')
  })

  it('mentions prior knowledge only after the first session', () => {
    const first = generateReport([], makePlayer(), [], 0, 1, 10)
    const third = generateReport([], makePlayer(), [], 0, 3, 10)
    expect(first.behaviorSummary.join(' ')).not.toContain('prior knowledge')
    expect(third.behaviorSummary.join(' ')).toContain('Session 3 complete')
  })

  describe('systemStatement', () => {
    it('5+ sessions: profile established', () => {
      const r = generateReport([], makePlayer(), [], 0, 5, 10)
      expect(r.systemStatement).toContain('no longer needs to learn you')
    })
    it('4+ adaptations: system adapted faster', () => {
      const r = generateReport([], makePlayer(), log(4), 0, 1, 10)
      expect(r.systemStatement).toBe('The system adapted faster than you did.')
    })
    it('2-3 adaptations: pattern detected', () => {
      const r = generateReport([], makePlayer(), log(2), 0, 1, 10)
      expect(r.systemStatement).toContain('detected your pattern')
    })
    it('very consistent player: higher unpredictability', () => {
      const r = generateReport([], makePlayer({ consistency: 0.9 }), [], 0, 1, 10)
      expect(r.systemStatement).toContain('higher unpredictability')
    })
    it('death with no other signal: ran out of HP', () => {
      const r = generateReport([], makePlayer(), [], 0, 1, 10, 'HP depleted')
      expect(r.systemStatement).toContain('ran out of HP')
    })
    it('fallback: pattern too inconsistent to model', () => {
      const r = generateReport([], makePlayer(), [], 0, 1, 10)
      expect(r.systemStatement).toContain('too inconsistent')
    })
  })

  it('builds time series only from click events, relative to session start', () => {
    const player = makePlayer({ sessionStart: 1_000_000 })
    const events = [
      click({ clickTime: 1_002_000, shapeSizeAtClick: 0.4, reactionTime: 800 }),
      miss(),
      click({ clickTime: 1_005_400, shapeSizeAtClick: 0.9, reactionTime: 1200 }),
    ]
    const r = generateReport(events, player, [], 0, 1, 10)
    expect(r.riskOverTime).toEqual([
      { t: 2, risk: 0.4 },
      { t: 5, risk: 0.9 },
    ])
    expect(r.reactionOverTime).toEqual([
      { t: 2, rt: 800 },
      { t: 5, rt: 1200 },
    ])
  })
})
