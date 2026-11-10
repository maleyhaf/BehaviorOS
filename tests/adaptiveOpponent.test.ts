import { describe, it, expect, beforeEach } from 'vitest'
import { adapt, resetAdaptation, DEFAULT_MODIFIERS } from '../src/engine/adaptiveOpponent'
import { makePlayer } from './helpers'

const ids = (log: { description: string }[]) => log.map(l => l.description)

describe('adapt', () => {
  beforeEach(() => resetAdaptation())

  it('changes nothing for a neutral player', () => {
    const { modifiers, log } = adapt(makePlayer(), DEFAULT_MODIFIERS, [])
    expect(modifiers).toEqual(DEFAULT_MODIFIERS)
    expect(log).toHaveLength(0)
  })

  it('does not mutate the input modifiers or log', () => {
    const inLog: never[] = []
    const mods = { ...DEFAULT_MODIFIERS }
    adapt(makePlayer({ impulsivity: 0.9 }), mods, inLog)
    expect(mods).toEqual(DEFAULT_MODIFIERS)
    expect(inLog).toHaveLength(0)
  })

  it('appends to an existing log', () => {
    const existing = [{ timestamp: 1, trigger: 't', change: {}, description: 'old' }]
    const { log } = adapt(makePlayer({ impulsivity: 0.9 }), DEFAULT_MODIFIERS, existing)
    expect(log[0].description).toBe('old')
    expect(log.length).toBeGreaterThan(1)
  })

  it('impulsive player (>0.72) gets more decoys', () => {
    const { modifiers } = adapt(makePlayer({ impulsivity: 0.75 }), DEFAULT_MODIFIERS, [])
    expect(modifiers.decoyProbability).toBeCloseTo(0.08)
    expect(modifiers.decoyDamageMultiplier).toBe(1.0)
  })

  it('very impulsive player (>0.8) also gets amplified decoy damage', () => {
    const { modifiers } = adapt(makePlayer({ impulsivity: 0.9 }), DEFAULT_MODIFIERS, [])
    expect(modifiers.decoyDamageMultiplier).toBeCloseTo(1.3)
  })

  it('caps decoyProbability at 0.4 and decoy damage at 2.0', () => {
    let mods = { ...DEFAULT_MODIFIERS }
    const p = makePlayer({ impulsivity: 0.9, riskTolerance: 0.9 })
    for (let i = 0; i < 20; i++) mods = adapt(p, mods, []).modifiers
    expect(mods.decoyProbability).toBeCloseTo(0.4)
    expect(mods.decoyDamageMultiplier).toBeCloseTo(2.0)
  })

  it('patient player with >5 clicks: shapes expire faster and drift', () => {
    const p = makePlayer({ patience: 0.72, totalClicks: 6 })
    const { modifiers } = adapt(p, DEFAULT_MODIFIERS, [])
    expect(modifiers.decaySpeed).toBeCloseTo(0.9)
    expect(modifiers.driftSpeed).toBe(35)
  })

  it('patient player is not pressured before enough clicks', () => {
    const p = makePlayer({ patience: 0.9, totalClicks: 5 })
    const { modifiers } = adapt(p, DEFAULT_MODIFIERS, [])
    expect(modifiers.decaySpeed).toBe(1.0)
    expect(modifiers.driftSpeed).toBe(0)
  })

  it('patient player with many misses takes more miss damage', () => {
    const p = makePlayer({ patience: 0.8, totalClicks: 6, totalMisses: 4 })
    const { modifiers } = adapt(p, DEFAULT_MODIFIERS, [])
    expect(modifiers.missDamageMultiplier).toBeCloseTo(1.4)
  })

  it('caps missDamageMultiplier at 2.5', () => {
    let mods = { ...DEFAULT_MODIFIERS }
    const p = makePlayer({ patience: 0.8, totalClicks: 6, totalMisses: 4 })
    for (let i = 0; i < 10; i++) mods = adapt(p, mods, []).modifiers
    expect(mods.missDamageMultiplier).toBeCloseTo(2.5)
  })

  it('risk-tolerant player (>0.68) triggers the risk trap rule', () => {
    const { modifiers, log } = adapt(makePlayer({ riskTolerance: 0.7 }), DEFAULT_MODIFIERS, [])
    expect(modifiers.decoyProbability).toBeCloseTo(0.05)
    expect(ids(log).some(d => d.includes('High-risk traps'))).toBe(true)
  })

  it('safe player (<0.3, >8 clicks) gets reduced rewards, floored at 0.5', () => {
    let mods = { ...DEFAULT_MODIFIERS }
    const p = makePlayer({ riskTolerance: 0.2, totalClicks: 9 })
    mods = adapt(p, mods, []).modifiers
    expect(mods.rewardScaling).toBeCloseTo(0.9)
    for (let i = 0; i < 10; i++) mods = adapt(p, mods, []).modifiers
    expect(mods.rewardScaling).toBeCloseTo(0.5)
  })

  it('consistent player (>0.8, >10 clicks) gets faster growth', () => {
    const p = makePlayer({ consistency: 0.85, totalClicks: 11 })
    const { modifiers } = adapt(p, DEFAULT_MODIFIERS, [])
    expect(modifiers.growthSpeed).toBeCloseTo(1.15)
  })

  it('consistent player (>0.75, >12 clicks) gets extra drift', () => {
    const p = makePlayer({ consistency: 0.78, totalClicks: 13 })
    const { modifiers } = adapt(p, DEFAULT_MODIFIERS, [])
    expect(modifiers.driftSpeed).toBe(30)
  })

  it('calm veteran (>20 clicks, low impulsivity) gets higher spawn rate', () => {
    const p = makePlayer({ impulsivity: 0.3, totalClicks: 21 })
    const { modifiers } = adapt(p, DEFAULT_MODIFIERS, [])
    expect(modifiers.spawnRate).toBeCloseTo(1.4)
  })

  it('high performer (>0.55, >20 clicks) triggers the difficulty surge', () => {
    const p = makePlayer({ performance: 0.6, totalClicks: 21, impulsivity: 0.5 })
    const { modifiers, log } = adapt(p, DEFAULT_MODIFIERS, [])
    expect(modifiers.spawnRate).toBeCloseTo(1.4)
    expect(modifiers.decaySpeed).toBeCloseTo(0.92)
    expect(modifiers.rewardScaling).toBeCloseTo(0.92)
    expect(ids(log).some(d => d.includes('Overall difficulty surge'))).toBe(true)
  })

  it('performance surge threshold escalates after each firing', () => {
    const p = makePlayer({ performance: 0.6, totalClicks: 21 })
    const first = adapt(p, DEFAULT_MODIFIERS, [])
    expect(first.log).toHaveLength(1)
    // threshold is now 0.65, so performance 0.6 no longer triggers it
    const second = adapt(p, first.modifiers, [])
    expect(second.log).toHaveLength(0)
  })

  it('performance surge threshold is capped at 0.85', () => {
    const p = makePlayer({ performance: 0.9, totalClicks: 21 })
    let mods = { ...DEFAULT_MODIFIERS }
    let fired = 0
    for (let i = 0; i < 8; i++) {
      const r = adapt(p, mods, [])
      mods = r.modifiers
      fired += r.log.length
    }
    // 0.9 > 0.85 cap, so it keeps firing every call
    expect(fired).toBe(8)
  })

  it('struggling player (<0.43 perf, >7 misses) gets difficulty relief', () => {
    const start = { ...DEFAULT_MODIFIERS, decoyProbability: 0.2, rewardScaling: 0.8 }
    const p = makePlayer({ performance: 0.3, totalMisses: 8 })
    const { modifiers } = adapt(p, start, [])
    expect(modifiers.decoyProbability).toBeCloseTo(0.15)
    expect(modifiers.rewardScaling).toBeCloseTo(0.9)
    expect(modifiers.decaySpeed).toBeCloseTo(1.1)
  })

  it('relief never pushes spawnRate below 1.2 or decoy probability below 0', () => {
    const p = makePlayer({ performance: 0.3, totalMisses: 8 })
    const { modifiers } = adapt(p, DEFAULT_MODIFIERS, [])
    expect(modifiers.spawnRate).toBeCloseTo(1.2)
    expect(modifiers.decoyProbability).toBe(0)
  })

  it('resetAdaptation clears escalation so the surge fires at 0.55 again', () => {
    const p = makePlayer({ performance: 0.6, totalClicks: 21 })
    adapt(p, DEFAULT_MODIFIERS, [])
    expect(adapt(p, DEFAULT_MODIFIERS, []).log).toHaveLength(0)
    resetAdaptation()
    expect(adapt(p, DEFAULT_MODIFIERS, []).log).toHaveLength(1)
  })
})
