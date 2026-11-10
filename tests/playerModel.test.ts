import { describe, it, expect } from 'vitest'
import { updatePlayerModel, DEFAULT_STATE } from '../src/engine/playerModel'
import { makePlayer, click, miss } from './helpers'

describe('updatePlayerModel', () => {
  it('returns the same state when there are no events', () => {
    const p = makePlayer()
    expect(updatePlayerModel([], p)).toBe(p)
  })

  it('exposes a default state with neutral traits', () => {
    expect(DEFAULT_STATE.riskTolerance).toBe(0.5)
    expect(DEFAULT_STATE.totalClicks).toBe(0)
  })

  it('only misses: raises patience, lowers impulsivity, counts misses', () => {
    const p = makePlayer({ patience: 0.5, impulsivity: 0.5 })
    const result = updatePlayerModel([miss(), miss(), miss()], p)
    expect(result.patience).toBeCloseTo(0.5 + (0.8 - 0.5) * 0.1)
    expect(result.impulsivity).toBeCloseTo(0.5 + (0.2 - 0.5) * 0.1)
    expect(result.totalMisses).toBe(3)
    expect(result.totalClicks).toBe(0)
  })

  it('fast reactions increase impulsivity', () => {
    const p = makePlayer({ impulsivity: 0.5 })
    const result = updatePlayerModel([click({ reactionTime: 100 })], p)
    expect(result.impulsivity).toBeGreaterThan(0.5)
  })

  it('slow reactions decrease impulsivity', () => {
    const p = makePlayer({ impulsivity: 0.5 })
    const result = updatePlayerModel([click({ reactionTime: 3900 })], p)
    expect(result.impulsivity).toBeLessThan(0.5)
  })

  it('clamps reaction ratio when reaction time exceeds the 4000ms cap', () => {
    const p = makePlayer({ impulsivity: 0.5 })
    const result = updatePlayerModel([click({ reactionTime: 20000 })], p)
    // avgReactionRatio clamped to 1 -> target impulsivity 0
    expect(result.impulsivity).toBeCloseTo(0.5 + (0 - 0.5) * 0.25)
  })

  it('clicking large shapes raises riskTolerance, small shapes lower it', () => {
    const p = makePlayer({ riskTolerance: 0.5 })
    const big = updatePlayerModel([click({ shapeSizeAtClick: 1 })], p)
    const small = updatePlayerModel([click({ shapeSizeAtClick: 0 })], p)
    expect(big.riskTolerance).toBeGreaterThan(0.5)
    expect(small.riskTolerance).toBeLessThan(0.5)
  })

  it('misses reduce the patience score compared with a no-miss window', () => {
    const p = makePlayer({ patience: 0.5 })
    const clean = updatePlayerModel([click({ shapeSizeAtClick: 0.9 })], p)
    const sloppy = updatePlayerModel(
      [click({ shapeSizeAtClick: 0.9 }), miss(), miss()],
      p
    )
    expect(sloppy.patience).toBeLessThan(clean.patience)
  })

  it('does not update consistency with fewer than 4 clicks', () => {
    const p = makePlayer({ consistency: 0.5 })
    const events = [click(), click(), click()]
    expect(updatePlayerModel(events, p).consistency).toBe(0.5)
  })

  it('identical reaction times with 4+ clicks increase consistency', () => {
    const p = makePlayer({ consistency: 0.5 })
    const events = [1, 2, 3, 4].map(() => click({ reactionTime: 1500 }))
    expect(updatePlayerModel(events, p).consistency).toBeGreaterThan(0.5)
  })

  it('wildly varying reaction times with 4+ clicks decrease consistency', () => {
    const p = makePlayer({ consistency: 0.5 })
    const events = [100, 3900, 100, 3900].map(rt => click({ reactionTime: rt }))
    expect(updatePlayerModel(events, p).consistency).toBeLessThan(0.5)
  })

  it('performance improves with accurate, fast play', () => {
    const p = makePlayer({ performance: 0.5 })
    const events = [1, 2, 3].map(() => click({ reactionTime: 200 }))
    expect(updatePlayerModel(events, p).performance).toBeGreaterThan(0.5)
  })

  it('performance drops when most recent events are misses', () => {
    const p = makePlayer({ performance: 0.5 })
    const events = [click({ reactionTime: 3800 }), miss(), miss(), miss(), miss()]
    expect(updatePlayerModel(events, p).performance).toBeLessThan(0.5)
  })

  it('only the last 10 events affect trait calculation but totals use all events', () => {
    const p = makePlayer()
    const old = Array.from({ length: 5 }, () => miss())
    const recent = Array.from({ length: 10 }, () => click({ reactionTime: 1000 }))
    const result = updatePlayerModel([...old, ...recent], p)
    expect(result.totalClicks).toBe(10)
    expect(result.totalMisses).toBe(5)
  })

  it('keeps every trait within [0, 1]', () => {
    const p = makePlayer({ riskTolerance: 1, impulsivity: 1, patience: 1 })
    const events = Array.from({ length: 12 }, () =>
      click({ reactionTime: 0, shapeSizeAtClick: 5 })
    )
    const r = updatePlayerModel(events, p)
    for (const k of ['riskTolerance', 'impulsivity', 'patience', 'consistency', 'performance'] as const) {
      expect(r[k]).toBeGreaterThanOrEqual(0)
      expect(r[k]).toBeLessThanOrEqual(1)
    }
  })

  it('preserves sessionStart', () => {
    const p = makePlayer({ sessionStart: 42 })
    expect(updatePlayerModel([click()], p).sessionStart).toBe(42)
  })
})
