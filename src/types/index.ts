export interface Shape {
  id: string
  x: number
  y: number
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
  isDecoy: boolean
  missed: false
}

export interface MissEvent {
  shapeId: string
  expiredAt: number
  maxSizeReached: number
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
  player: PlayerState
  adaptationLog: AdaptationEntry[]
  behaviorSummary: string[]
  systemStatement: string
  riskOverTime: { t: number; risk: number }[]
  reactionOverTime: { t: number; rt: number }[]
}