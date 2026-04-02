import { useGameEngine } from './hooks/useGameEngine'
import { GameCanvas } from './components/GameCanvas'
import { BehaviorOSPanel } from './components/BehaviorOSPanel'
import { EndScreen } from './components/EndScreen'

const CANVAS_W = 900
const CANVAS_H = 560

export default function App() {
  const { gameState, report, start, handleClick, sessionsPlayed, storedProfile } = useGameEngine(CANVAS_W, CANVAS_H)
  const { phase, score, timeElapsed, shapes, player, modifiers, adaptationLog } = gameState
  const timeLeft = Math.max(0, Math.ceil((100_000 - timeElapsed) / 1000))

  if (phase === 'ended' && report) {
    return <EndScreen report={report} onRestart={start} sessionsPlayed={sessionsPlayed} />
  }

  return (
    <div style={{
      background: '#050a10',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 24,
      fontFamily: 'monospace',
    }}>

      {phase === 'idle' && (
        <div style={{ textAlign: 'center', color: 'white', marginBottom: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>ADAPTIVE SYSTEM</div>

          {storedProfile ? (
            <div style={{
              display: 'inline-block',
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: 4,
              padding: '8px 16px',
              marginBottom: 16,
              fontSize: 12,
              color: 'rgba(74,222,128,0.8)',
            }}>
              RETURNING SUBJECT — SESSION {storedProfile.sessionsPlayed + 1} —
              PRIOR PROFILE LOADED
            </div>
          ) : null}

          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24, maxWidth: 480 }}>
            Click shapes to score. Wait for them to grow for higher rewards — but they disappear.
            {storedProfile
              ? ' The system remembers you.'
              : ' The system is watching. It will adapt.'}
          </div>

          {storedProfile && (
            <div style={{
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              marginBottom: 20,
              fontSize: 11,
              color: 'rgba(255,255,255,0.3)',
            }}>
              <span>RISK <span style={{ color: 'rgba(249,115,22,0.7)' }}>{Math.round(storedProfile.riskTolerance * 100)}</span></span>
              <span>IMPULSIVITY <span style={{ color: 'rgba(167,139,250,0.7)' }}>{Math.round(storedProfile.impulsivity * 100)}</span></span>
              <span>PATIENCE <span style={{ color: 'rgba(56,189,248,0.7)' }}>{Math.round(storedProfile.patience * 100)}</span></span>
              <span>CONSISTENCY <span style={{ color: 'rgba(74,222,128,0.7)' }}>{Math.round(storedProfile.consistency * 100)}</span></span>
            </div>
          )}

          <button
            onClick={start}
            style={{
              background: '#4ade80',
              border: 'none',
              color: '#050a10',
              padding: '12px 40px',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              fontSize: 14,
              letterSpacing: '0.08em',
            }}
          >
            {storedProfile ? 'BEGIN SESSION ' + (storedProfile.sessionsPlayed + 1) : 'BEGIN SESSION'}
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <div style={{ display: 'flex', gap: 32, color: 'white', fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
              SCORE <span style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{score}</span>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
              CLICKS <span style={{ color: 'white' }}>{player.totalClicks}</span>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
              MISSED <span style={{ color: 'rgba(248,113,113,0.8)' }}>{player.totalMisses}</span>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
              SESSION <span style={{ color: 'rgba(255,255,255,0.6)' }}>{sessionsPlayed + 1}</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <GameCanvas
              shapes={shapes}
              width={CANVAS_W}
              height={CANVAS_H}
              onCanvasClick={handleClick}
            />
            <BehaviorOSPanel
              player={player}
              modifiers={modifiers}
              adaptationLog={adaptationLog}
              timeLeft={timeLeft}
            />
          </div>
        </>
      )}
    </div>
  )
}
