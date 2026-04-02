import { useRef, useState, useCallback, useEffect } from 'react'
import type { GameState, Shape, GameEvent, SessionReport } from '../types'
import { spawnShape, updateShape, calcReward, hitTest } from '../engine/shapeEngine'
import { updatePlayerModel, DEFAULT_STATE } from '../engine/playerModel'
import { adapt, DEFAULT_MODIFIERS, resetAdaptation } from '../engine/adaptiveOpponent'
import { generateReport } from '../engine/reportGenerator'
import { loadProfile, saveProfile, applyProfile } from '../utils/persistence'

const SESSION_DURATION = 100_000

function makeInitialState(): GameState {
  return {
    phase: 'idle',
    score: 0,
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

    if (elapsed >= SESSION_DURATION) {
      const newSessionCount = sessionsPlayed + 1
      const r = generateReport(state.events, state.player, state.adaptationLog, state.score, newSessionCount)
      saveProfile(state.player, newSessionCount)
      setSessionsPlayed(newSessionCount)
      setReport(r)
      setGameState(s => ({ ...s, phase: 'ended' }))
      return
    }

    let shapes = [...state.shapes]
    const spawnInterval = 1000 / state.modifiers.spawnRate
    if (
      now - lastSpawnRef.current > spawnInterval &&
      shapes.length < state.modifiers.maxShapesOnScreen
    ) {
      shapes.push(spawnShape(canvasW, canvasH, state.modifiers))
      lastSpawnRef.current = now
    }

    const expiredEvents: GameEvent[] = []
    shapes = shapes.reduce<Shape[]>((acc, s) => {
      const updated = updateShape(s, dtMs)
      if (!updated) {
        expiredEvents.push({ shapeId: s.id, expiredAt: Date.now(), maxSizeReached: s.radius, missed: true })
        return acc
      }
      acc.push(updated)
      return acc
    }, [])

    const events = [...state.events, ...expiredEvents]

    const player = events.length % 5 === 0
      ? updatePlayerModel(events, state.player)
      : state.player

    let modifiers = state.modifiers
    let adaptationLog = state.adaptationLog

    if (events.length > 0 && events.length % 10 === 0) {
      const adapted = adapt(player, state.modifiers, state.adaptationLog)
      modifiers = adapted.modifiers
      adaptationLog = adapted.log
    }

    setGameState(s => ({
      ...s,
      shapes,
      events,
      player,
      modifiers,
      adaptationLog,
      timeElapsed: elapsed,
    }))

    animRef.current = requestAnimationFrame(tick)
  }, [canvasW, canvasH, sessionsPlayed])

  const start = useCallback(() => {
    resetAdaptation()
    const fresh = makeInitialState()
    const stored = loadProfile()
    if (stored) {
      fresh.player = applyProfile(fresh.player, stored)
    }
    setReport(null)
    setGameState({ ...fresh, phase: 'playing' })
    lastTickRef.current = 0
    lastSpawnRef.current = 0
    animRef.current = requestAnimationFrame(tick)
  }, [tick])

  const handleClick = useCallback((x: number, y: number) => {
    setGameState(s => {
      if (s.phase !== 'playing') return s

      let hit = false
      let scoreChange = 0
      const now = Date.now()
      const newEvents: GameEvent[] = []
      const shapes = s.shapes.filter(shape => {
        if (!hit && hitTest(shape, x, y)) {
          hit = true
          const reward = calcReward(shape, s.modifiers)
          scoreChange = reward
          newEvents.push({
            shapeId: shape.id,
            clickTime: now,
            reactionTime: now - shape.spawnTime,
            shapeSizeAtClick: shape.radius / shape.maxRadius,
            reward,
            isDecoy: shape.isDecoy,
            missed: false,
          })
          return false
        }
        return true
      })

      if (!hit) return s

      const events = [...s.events, ...newEvents]
      const player = updatePlayerModel(events, s.player)
      const { modifiers, log: adaptationLog } = adapt(player, s.modifiers, s.adaptationLog)

      return {
        ...s,
        shapes,
        events,
        player,
        modifiers,
        adaptationLog,
        score: Math.max(0, s.score + scoreChange),
      }
    })
  }, [])

  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  return { gameState, report, start, handleClick, sessionsPlayed, storedProfile: loadProfile() }
}
