import type { PlayerState, GameModifiers, AdaptationEntry } from '../types'
import { MAX_HP } from '../engine/shapeEngine'
import { useState, useEffect } from 'react'

interface Props {
  player: PlayerState
  modifiers: GameModifiers
  adaptationLog: AdaptationEntry[]
  timeElapsed: number
  hp: number
  compact?: boolean
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
        <div style={{ width: `${Math.round(value * 100)}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', minWidth: 24, textAlign: 'right' }}>
        {Math.round(value * 100)}
      </span>
    </div>
  )
}

function lbl(value: number) {
  if (value > 0.7) return 'HI'
  if (value > 0.4) return 'MD'
  return 'LO'
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{value}</span>
    </div>
  )
}

// ── Compact (mobile): fixed to bottom of screen ────────────────────────────
function CompactPanel({ player, modifiers, adaptationLog, timeElapsed, hp }: Omit<Props, 'compact'>) {
  const hpPct = hp / MAX_HP
  const hpColor = hpPct > 0.6 ? '#4ade80' : hpPct > 0.3 ? '#facc15' : '#f87171'


  const [visibleEntry, setVisibleEntry] = useState<AdaptationEntry | null>(null)

  useEffect(() => {
    const latest = adaptationLog[adaptationLog.length - 1]
    if (!latest) return
    setVisibleEntry(latest)
    const timer = setTimeout(() => setVisibleEntry(null), 2500)
    return () => clearTimeout(timer)
  }, [adaptationLog.length])  // fires when a new entry is added

  const traits = [
    { label: 'RISK', value: player.riskTolerance, color: '#f97316' },
    { label: 'IMPL', value: player.impulsivity, color: '#a78bfa' },
    { label: 'PAT', value: player.patience, color: '#38bdf8' },
    { label: 'CON', value: player.consistency, color: '#4ade80' },
    { label: 'PERF', value: player.performance, color: '#facc15' },
  ]

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(5,10,16,0.96)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px 12px 0 0',
      padding: '10px 16px 14px',
      fontFamily: 'monospace',
      zIndex: 100,
      backdropFilter: 'blur(8px)',
    }}>
      {/* Trait pills + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: visibleEntry ? 8 : 0 }}>
        {traits.map(t => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{t.label}</span>
            <span style={{ fontSize: 11, color: t.color, fontWeight: 'bold' }}>{lbl(t.value)}</span>
          </div>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
            DECOY <span style={{ color: 'rgba(255,255,255,0.6)' }}>{Math.round(modifiers.decoyProbability * 100)}%</span>
          </span>
          {modifiers.driftSpeed > 0 && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
              DRIFT <span style={{ color: 'rgba(56,189,248,0.7)' }}>{Math.round(modifiers.driftSpeed)}</span>
            </span>
          )}
          <span style={{ fontSize: 13, color: hpColor, fontWeight: 'bold' }}>
            {`${Math.floor((Math.floor(timeElapsed / 1000)) / 60)}m ${(Math.floor(timeElapsed / 1000)) % 60}s`}
          </span>
        </div>
      </div>

      {/* Latest adaptation message */}
      {visibleEntry && (
        <div style={{
          fontSize: 10,
          color: 'rgba(250,204,21,0.7)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: 6,
          lineHeight: 1.4,
        }}>
          ↳ {visibleEntry.description}
        </div>
      )}
    </div>
  )
}

// ── Full (desktop): vertical sidebar ──────────────────────────────────────
export function BehaviorOSPanel({ player, modifiers, adaptationLog, timeElapsed, hp, compact }: Props) {
  if (compact) return <CompactPanel player={player} modifiers={modifiers} adaptationLog={adaptationLog} timeElapsed={timeElapsed} hp={hp} />


  const [visibleEntry, setVisibleEntry] = useState<AdaptationEntry | null>(null)

  useEffect(() => {
    const latest = adaptationLog[adaptationLog.length - 1]
    if (!latest) return
    setVisibleEntry(latest)
    const timer = setTimeout(() => setVisibleEntry(null), 2500)
    return () => clearTimeout(timer)
  }, [adaptationLog.length])  // fires when a new entry is added

  const hpPct = hp / MAX_HP
  const hpColor = hpPct > 0.6 ? '#4ade80' : hpPct > 0.3 ? '#facc15' : '#f87171'
  const lvl = (v: number) => v > 0.7 ? 'HIGH' : v > 0.4 ? 'MED' : 'LOW'

  return (
    <div style={{
      background: 'rgba(0,0,0,0.85)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: '16px',
      fontFamily: 'monospace',
      color: 'rgba(255,255,255,0.7)',
      fontSize: 12,
      width: 220,
      userSelect: 'none',
      flexShrink: 0,
    }}>
      <div style={{ color: '#4ade80', marginBottom: 12, fontSize: 11, letterSpacing: '0.08em' }}>
        SYSTEM STATUS
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>INTEGRITY</span>
          <span style={{ fontSize: 10, color: hpColor }}>{Math.ceil(hp)} / {MAX_HP}</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
          <div style={{ width: `${hpPct * 100}%`, height: '100%', background: hpColor, borderRadius: 2, transition: 'width 0.2s ease' }} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Row label="RISK TENDENCY" value={lvl(player.riskTolerance)} />
        <Bar value={player.riskTolerance} color="#f97316" />
        <div style={{ height: 8 }} />
        <Row label="IMPULSIVITY" value={lvl(player.impulsivity)} />
        <Bar value={player.impulsivity} color="#a78bfa" />
        <div style={{ height: 8 }} />
        <Row label="PATIENCE" value={lvl(player.patience)} />
        <Bar value={player.patience} color="#38bdf8" />
        <div style={{ height: 8 }} />
        <Row label="CONSISTENCY" value={lvl(player.consistency)} />
        <Bar value={player.consistency} color="#4ade80" />
        <div style={{ height: 8 }} />
        <Row label="PERFORMANCE" value={lvl(player.performance)} />
        <Bar value={player.performance} color="#facc15" />
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>OPPONENT MODEL</div>
        <Row label="Decoy rate" value={`${Math.round(modifiers.decoyProbability * 100)}%`} />
        <Row label="Decay speed" value={`${modifiers.decaySpeed.toFixed(2)}×`} />
        <Row label="Growth speed" value={`${modifiers.growthSpeed.toFixed(2)}×`} />
        <Row label="Spawn rate" value={`${modifiers.spawnRate.toFixed(1)}/s`} />
        <Row label="Drift speed" value={modifiers.driftSpeed > 0 ? `${Math.round(modifiers.driftSpeed)}px/s` : 'STATIC'} />
        <Row label="Miss damage" value={`${modifiers.missDamageMultiplier.toFixed(1)}×`} />
        <Row label="Decoy damage" value={`${modifiers.decoyDamageMultiplier.toFixed(1)}×`} />
      </div>

      {visibleEntry && (
        <div style={{
          background: 'rgba(250,204,21,0.08)',
          border: '1px solid rgba(250,204,21,0.2)',
          borderRadius: 4, padding: '6px 8px',
          fontSize: 10, color: 'rgba(250,204,21,0.8)', marginBottom: 10,
        }}>
          ↳ {visibleEntry.description}
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, textAlign: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>SESSION </span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{`${Math.floor((Math.floor(timeElapsed / 1000)) / 60)}m ${(Math.floor(timeElapsed / 1000)) % 60}s`}</span>
      </div>
    </div>
  )
}