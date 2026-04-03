export interface Shape {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  maxRadius: number
  growthRate: number
  lifetime: number
  spawnTime: number
  isDecoy: boolean
  rewardValue: number
  riskValue: number
  opacity: number
  pulsePhase: number
}

export interface ClickEvent {
  shapeId: string
  clickTime: number
  reactionTime: number
  shapeSizeAtClick: number
  reward: number
  hpDelta: number       // positive = heal, negative = damage
  isDecoy: boolean
  missed: false
}

export interface MissEvent {
  shapeId: string
  expiredAt: number
  maxSizeReached: number
  hpDelta: number       // always negative
  missed: true
}

export type GameEvent = ClickEvent | MissEvent

export interface PlayerState {
  riskTolerance: number
  impulsivity: number
  patience: number
  consistency: number
  totalClicks: number
  totalMisses: number
  sessionStart: number
}

export interface GameModifiers {
  spawnRate: number
  decaySpeed: number
  growthSpeed: number
  decoyProbability: number
  rewardScaling: number
  maxShapesOnScreen: number
  driftSpeed: number
  missDamageMultiplier: number   // scales HP loss on miss (1 = normal)
  decoyDamageMultiplier: number  // scales HP loss on decoy click
}

export interface AdaptationEntry {
  timestamp: number
  trigger: string
  change: Partial<GameModifiers>
  description: string
}

export type GamePhase = 'idle' | 'playing' | 'ended'

export interface GameState {
  phase: GamePhase
  score: number
  hp: number
  timeElapsed: number
  shapes: Shape[]
  events: GameEvent[]
  player: PlayerState
  modifiers: GameModifiers
  adaptationLog: AdaptationEntry[]
}

export interface SessionReport {
  duration: number
  finalScore: number
  maxHpLost: number
  causeOfDeath: string | null   // null = survived
  player: PlayerState
  adaptationLog: AdaptationEntry[]
  behaviorSummary: string[]
  systemStatement: string
  riskOverTime: { t: number; risk: number }[]
  reactionOverTime: { t: number; rt: number }[]
}