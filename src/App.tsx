import { useGameEngine } from './hooks/useGameEngine'
import { useWindowSize, fitCanvas } from './hooks/useWindowSize'
import { GameCanvas } from './components/GameCanvas'
import { BehaviorOSPanel } from './components/BehaviorOSPanel'
import { EndScreen } from './components/EndScreen'
import { MAX_HP } from './engine/shapeEngine'


function HpBar({ hp }: { hp: number }) {
  const pct = (hp / MAX_HP) * 100
  const color = hp > 60 ? '#4ade80' : hp > 30 ? '#facc15' : '#f87171'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>HP</span>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color, borderRadius: 3,
          transition: 'width 0.2s ease, background 0.4s ease',
        }} />
      </div>
      <span style={{ color, fontSize: 12, fontWeight: 'bold', minWidth: 28 }}>{Math.ceil(hp)}</span>
    </div>
  )
}

export default function App() {

  // computing the canvas display size responsive to window size is a bit tricky, so we do it in a hook
  const { width: winW, height: winH } = useWindowSize()
  const isMobile = winW < 768
  const CANVAS_W = winW - (isMobile ? 0 : 248) // subtract side panel on desktop
  const CANVAS_H = winH - 48 - (isMobile ? 80 : 0) // subtract header + bottom panel


  // On mobile: canvas takes full width minus padding, panel goes below
  // On desktop: canvas + side panel sit side by side
  const PANEL_W = 236   // BehaviorOS panel width + gap
  const padding = isMobile ? 12 : 24
  const availableW = winW - padding * 2 - (isMobile ? 0 : PANEL_W)
  const availableH = winH - (isMobile ? 160 : 120) // leave room for header + panel

  const { displayW, displayH, scale } = fitCanvas(CANVAS_W, CANVAS_H, availableW, availableH)

  const { gameState, report, start, handleClick, sessionsPlayed, storedProfile } = useGameEngine(CANVAS_W, CANVAS_H)
  const { phase, score, hp, timeElapsed, shapes, player, modifiers, adaptationLog } = gameState

  // track the session duration
  // not using since sessions last until HP depletes, not a fixed time limit
  //const timeLeft = Math.max(0, Math.ceil((100_000 - timeElapsed) / 1000))

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
      justifyContent: phase === 'playing' ? 'flex-start' : 'center',
      padding,
      paddingTop: phase === 'playing' ? padding : undefined,
      paddingBottom: phase === 'playing' && isMobile ? 80 : padding,
      fontFamily: 'monospace',
      gap: 12,
      boxSizing: 'border-box',
    }}>

      {/* ── IDLE ── */}
      {phase === 'idle' && (
        <div style={{ textAlign: 'center', color: 'white', maxWidth: 480, width: '100%' }}>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 'bold', marginBottom: 8 }}>
            BehaviorOS
          </div>

          {storedProfile && (
            <div style={{
              display: 'inline-block',
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: 4, padding: '8px 16px', marginBottom: 16,
              fontSize: 11, color: 'rgba(74,222,128,0.8)',
            }}>
              RETURNING SUBJECT — SESSION {storedProfile.sessionsPlayed + 1} — PRIOR PROFILE LOADED
            </div>
          )}

          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 8 }}>
            Tap shapes to score. Survive as long as possible.
          </div>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginBottom: 24 }}>
            Missing large shapes drains HP. Tapping decoys drains more. Tap at peak size to recover HP.
            {storedProfile ? ' The system remembers you.' : ' The system is watching.'}
          </div>

          {storedProfile && (
            <div style={{
              display: 'flex', gap: isMobile ? 12 : 24, justifyContent: 'center',
              marginBottom: 20, fontSize: 11, color: 'rgba(255,255,255,0.3)',
              flexWrap: 'wrap',
            }}>
              <span>RISK <span style={{ color: 'rgba(249,115,22,0.7)' }}>{Math.round(storedProfile.riskTolerance * 100)}</span></span>
              <span>IMPULSIVITY <span style={{ color: 'rgba(167,139,250,0.7)' }}>{Math.round(storedProfile.impulsivity * 100)}</span></span>
              <span>PATIENCE <span style={{ color: 'rgba(56,189,248,0.7)' }}>{Math.round(storedProfile.patience * 100)}</span></span>
              <span>CONSISTENCY <span style={{ color: 'rgba(74,222,128,0.7)' }}>{Math.round(storedProfile.consistency * 100)}</span></span>
              <span>PERFORMANCE <span style={{ color: 'rgba(250,204,21,0.7)' }}>{Math.round(storedProfile.performance * 100)}</span></span>
            </div>
          )}

          <button onClick={start} style={{
            background: '#4ade80', border: 'none', color: '#050a10',
            padding: '14px 40px', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'monospace', fontWeight: 'bold',
            fontSize: isMobile ? 16 : 14, letterSpacing: '0.08em',
            width: isMobile ? '100%' : 'auto',
          }}>
            {storedProfile ? `BEGIN SESSION ${storedProfile.sessionsPlayed + 1}` : 'BEGIN SESSION'}
          </button>
        </div>
      )}

      {/* ── PLAYING ── */}
      {phase === 'playing' && (
        <>
          {/* Header bar */}
          <div style={{
            display: 'flex', gap: isMobile ? 12 : 24,
            alignItems: 'center', color: 'white', fontSize: 12,
            width: '100%', maxWidth: displayW + PANEL_W,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
              SCORE <span style={{ color: 'white', fontWeight: 'bold', fontSize: isMobile ? 16 : 18 }}>{score}</span>
            </span>
            <HpBar hp={hp} />
            {!isMobile && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                  CLICKS <span style={{ color: 'white' }}>{player.totalClicks}</span>
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                  MISSED <span style={{ color: 'rgba(248,113,113,0.8)' }}>{player.totalMisses}</span>
                </span>
              </>
            )}
          </div>

          {/* Canvas + panel */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 12,
            alignItems: isMobile ? 'center' : 'flex-start',
            width: '100%',
          }}>
            <GameCanvas
              shapes={shapes}
              width={CANVAS_W}
              height={CANVAS_H}
              displayW={displayW}
              displayH={displayH}
              scale={scale}
              onCanvasClick={handleClick}
            />
            <BehaviorOSPanel
              player={player}
              modifiers={modifiers}
              adaptationLog={adaptationLog}
              timeElapsed={timeElapsed}
              hp={hp}
              compact={isMobile}
            />
          </div>
        </>
      )}
    </div>
  )
}