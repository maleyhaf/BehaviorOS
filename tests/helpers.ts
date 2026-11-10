import type { ClickEvent, MissEvent, PlayerState } from '../src/types'

export function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    riskTolerance: 0.5,
    impulsivity: 0.5,
    patience: 0.5,
    consistency: 0.5,
    performance: 0.5,
    totalClicks: 0,
    totalMisses: 0,
    sessionStart: 1_000_000,
    ...overrides,
  }
}

export function click(overrides: Partial<ClickEvent> = {}): ClickEvent {
  return {
    shapeId: 's1',
    clickTime: 1_001_000,
    reactionTime: 1000,
    shapeSizeAtClick: 0.5,
    reward: 10,
    hpDelta: 0,
    isDecoy: false,
    missed: false,
    ...overrides,
  }
}

export function miss(overrides: Partial<MissEvent> = {}): MissEvent {
  return {
    shapeId: 's2',
    expiredAt: 1_004_000,
    maxSizeReached: 0.6,
    hpDelta: -5,
    missed: true,
    ...overrides,
  }
}
