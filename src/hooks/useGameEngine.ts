import { useRef, useState, useCallback, useEffect } from 'react'
import type { GameState, Shape, GameEvent, SessionReport } from '../types'
import { spawnShape, updateShape, calcReward, calcClickHpDelta, calcMissHpDelta, hitTest, MAX_HP } from '../engine/shapeEngine'
import { updatePlayerModel, DEFAULT_STATE } from '../engine/playerModel'
import { adapt, DEFAULT_MODIFIERS, resetAdaptation } from '../engine/adaptiveOpponent'
import { generateReport } from '../engine/reportGenerator'
import { loadProfile, saveProfile, applyProfile, clearProfile } from '../utils/persistence'

function makeInitialState(): GameState {
  return {
    phase: 'idle',
    score: 0,
    hp: MAX_HP,
    timeElapsed: 0,
    shapes: [],
    events: [],
    player: { ...DEFAULT_STATE, sessionStart: Date.now() },
    modifiers: { ...DEFAULT_MODIFIERS },
    adaptationLog: [],
  }
}

export function useGameEngine(canvasW: number, canvasH: number) {
  const [gameState, setGameState] = useState<GameState>(makeInitialState)
  const [report, setReport] = useState<SessionReport | null>(null)
  const [sessionsPlayed, setSessionsPlayed] = useState<number>(
    () => loadProfile()?.sessionsPlayed ?? 0
  )

  const stateRef = useRef<GameState>(gameState)
  const animRef = useRef<number>(0)
  const lastTickRef = useRef<number>(0)
  const lastSpawnRef = useRef<number>(0)

  useEffect(() => { stateRef.current = gameState }, [gameState])

  const tick = useCallback((now: number) => {
    const state = stateRef.current
    if (state.phase !== 'playing') return

    const dtMs = now - (lastTickRef.current || now)
    lastTickRef.current = now
    const elapsed = Date.now() - state.player.sessionStart

    let shapes = [...state.shapes]
    const spawnInterval = 1000 / state.modifiers.spawnRate
    if (
      now - lastSpawnRef.current > spawnInterval &&
      shapes.length < state.modifiers.maxShapesOnScreen
    ) {
      shapes.push(spawnShape(canvasW, canvasH, state.modifiers))
      lastSpawnRef.current = now
    }

    // Update shapes, collect miss events + HP deltas
    const expiredEvents: GameEvent[] = []
    let hpDelta = 0
    shapes = shapes.reduce<Shape[]>((acc, s) => {
      const updated = updateShape(s, dtMs, canvasW, canvasH)
      if (!updated) {
        const damage = calcMissHpDelta(s, state.modifiers)
        hpDelta += damage
        expiredEvents.push({
          shapeId: s.id,
          expiredAt: Date.now(),
          maxSizeReached: s.radius,
          hpDelta: damage,
          missed: true,
        })
        return acc
      }
      acc.push(updated)
      return acc
    }, [])

    const newHp = Math.min(MAX_HP, Math.max(0, state.hp + hpDelta))
    const events = [...state.events, ...expiredEvents]

    /*
    // MOVED INSIDE PLAYER MODEL  
    // perfomance check for the player to determine if difficulty should be increased
    const recentEvents = state.events.slice(-15)

    // hits misses calc
    const hits = recentEvents.filter(e => !e.missed).length
    const misses = recentEvents.filter(e => e.missed).length

    const accuracy = hits / Math.max(1, hits + misses)

    // simple performance metric
    
    const performanceScore =
      accuracy * 0.6 +
      (state.player.consistency ?? 0) * 0.4
    */

    // Death check
    if (newHp <= 0) {
      const newSessionCount = sessionsPlayed + 1
      const r = generateReport(events, state.player, state.adaptationLog, state.score, newSessionCount, elapsed, 'HP depleted')
      saveProfile(state.player, newSessionCount)
      setSessionsPlayed(newSessionCount)
      setReport(r)
      setGameState(s => ({ ...s, hp: 0, phase: 'ended' }))
      return
    }

    const player = events.length % 5 === 0
      ? updatePlayerModel(events, state.player)
      : state.player

    let modifiers = state.modifiers
    let adaptationLog = state.adaptationLog
    // Adaptation check every 10 events to avoid excessive recalculations
    if (events.length > 0 && events.length % 10 === 0) {
      const adapted = adapt(player, state.modifiers, state.adaptationLog)
      modifiers = adapted.modifiers
      adaptationLog = adapted.log
    }

    /*
    // MOVED TO ADAPTIVE OPPONENT
    // pressure multiplier
    let pressureMultiplier = 1

    if (performanceScore > 0.55) {
      // player doing well → ramp difficulty
      pressureMultiplier += 0.25
    } else if (performanceScore < 0.3) {
      // player struggling → slight relief
      pressureMultiplier = 0.9
    }

    // modified scaling
    const timeSec = elapsed / 1000
    const baseScale = 1 + Math.min(timeSec / 60, 2)

    // combine both systems
    const finalScale = baseScale * pressureMultiplier

    console.log(`Performance: ${performanceScore.toFixed(2)}, Pressure Multiplier: ${pressureMultiplier.toFixed(2)}, Final Scale: ${finalScale.toFixed(2)}`)

    modifiers = {
      ...modifiers,

      // multiplicative scaling (stable)
      spawnRate: Math.min(DEFAULT_MODIFIERS.spawnRate * finalScale, 5), 

      growthSpeed: Math.min(DEFAULT_MODIFIERS.growthSpeed * finalScale, 5),

      decaySpeed:
        performanceScore < 0.4
          ? Math.min(modifiers.decaySpeed + 0.02, 1.5)
          : Math.max(DEFAULT_MODIFIERS.decaySpeed - timeSec * 0.005, 0.4),
    }
    */
    console.log(`performance: ${player.performance.toFixed(2)}, spawnRate: ${modifiers.spawnRate.toFixed(2)}, growthSpeed: ${modifiers.growthSpeed.toFixed(2)}, decaySpeed: ${modifiers.decaySpeed.toFixed(2)}`)

    setGameState(s => ({
      ...s,
      shapes,
      events,
      player,
      modifiers,
      adaptationLog,
      hp: newHp,
      timeElapsed: elapsed,
    }))

    animRef.current = requestAnimationFrame(tick)
  }, [canvasW, canvasH, sessionsPlayed])

  const start = useCallback(() => {
    resetAdaptation()
    const fresh = makeInitialState()
    const stored = loadProfile()
    if (stored) fresh.player = applyProfile(fresh.player, stored)
    setReport(null)
    setGameState({ ...fresh, phase: 'playing' })
    lastTickRef.current = 0
    lastSpawnRef.current = 0
    animRef.current = requestAnimationFrame(tick)
  }, [tick])

  // reset game profile
  const reset = useCallback(() => {
    resetAdaptation()
    clearProfile()
    setGameState(s => ({ ...s, phase: 'idle' }))
  }, [tick])

  const handleClick = useCallback((x: number, y: number) => {
    setGameState(s => {
      if (s.phase !== 'playing') return s

      let hit = false
      let scoreChange = 0
      let hpChange = 0
      const now = Date.now()
      const newEvents: GameEvent[] = []

      const shapes = s.shapes.filter(shape => {
        if (!hit && hitTest(shape, x, y)) {
          hit = true
          const reward = calcReward(shape, s.modifiers)
          const hpDelta = calcClickHpDelta(shape, s.modifiers)
          scoreChange = shape.isDecoy ? reward : reward
          hpChange = hpDelta
          newEvents.push({
            shapeId: shape.id,
            clickTime: now,
            reactionTime: now - shape.spawnTime,
            shapeSizeAtClick: shape.radius / shape.maxRadius,
            reward,
            hpDelta,
            isDecoy: shape.isDecoy,
            missed: false,
          })
          return false
        }
        return true
      })

      if (!hit) return s

      const newHp = Math.min(MAX_HP, Math.max(0, s.hp + hpChange))
      const events = [...s.events, ...newEvents]
      const player = updatePlayerModel(events, s.player)
      const { modifiers, log: adaptationLog } = adapt(player, s.modifiers, s.adaptationLog)

      // Check death from decoy click
      if (newHp <= 0) {
        const newSessionCount = sessionsPlayed + 1
        const r = generateReport(events, player, adaptationLog, Math.max(0, s.score + scoreChange), newSessionCount, Date.now() - s.player.sessionStart, 'Clicked a decoy at critical HP')
        saveProfile(player, newSessionCount)
        setTimeout(() => {
          setSessionsPlayed(newSessionCount)
          setReport(r)
        }, 0)
        return { ...s, shapes, events, player, modifiers, adaptationLog, hp: 0, score: Math.max(0, s.score + scoreChange), phase: 'ended' }
      }

      return {
        ...s,
        shapes,
        events,
        player,
        modifiers,
        adaptationLog,
        hp: newHp,
        score: Math.max(0, s.score + scoreChange),
      }
    })
  }, [sessionsPlayed])

  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  return { gameState, report, start, reset, handleClick, sessionsPlayed, storedProfile: loadProfile() }
}