import type { PlayerState, GameModifiers, AdaptationEntry } from '../types'
import { MAX_HP } from '../engine/shapeEngine'

interface Props {
  player: PlayerState
  modifiers: GameModifiers
  adaptationLog: AdaptationEntry[]
  timeLeft: number
  hp: number
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
        <div style={{ width: `${Math.round(value * 100)}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', minWidth: 28, textAlign: 'right' }}>
        {Math.round(value * 100)}
      </span>
    </div>
  )
}

function label(value: number): string {
  if (value > 0.7) return 'HIGH'
  if (value > 0.4) return 'MED'
  return 'LOW'
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{value}</span>
    </div>
  )
}

export function BehaviorOSPanel({ player, modifiers, adaptationLog, timeLeft, hp }: Props) {
  const lastEntry = adaptationLog[adaptationLog.length - 1]
  const hpPct = hp / MAX_HP
  const hpColor = hpPct > 0.6 ? '#4ade80' : hpPct > 0.3 ? '#facc15' : '#f87171'

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
    }}>
      <div style={{ color: '#4ade80', marginBottom: 12, fontSize: 11, letterSpacing: '0.08em' }}>
        SYSTEM STATUS
      </div>

      {/* HP mini bar */}
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
        <Row label="RISK TENDENCY" value={label(player.riskTolerance)} />
        <Bar value={player.riskTolerance} color="#f97316" />
        <div style={{ height: 8 }} />
        <Row label="IMPULSIVITY" value={label(player.impulsivity)} />
        <Bar value={player.impulsivity} color="#a78bfa" />
        <div style={{ height: 8 }} />
        <Row label="PATIENCE" value={label(player.patience)} />
        <Bar value={player.patience} color="#38bdf8" />
        <div style={{ height: 8 }} />
        <Row label="CONSISTENCY" value={label(player.consistency)} />
        <Bar value={player.consistency} color="#4ade80" />
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

      {lastEntry && (
        <div style={{
          background: 'rgba(250,204,21,0.08)',
          border: '1px solid rgba(250,204,21,0.2)',
          borderRadius: 4,
          padding: '6px 8px',
          fontSize: 10,
          color: 'rgba(250,204,21,0.8)',
          marginBottom: 10,
        }}>
          ↳ {lastEntry.description}
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, textAlign: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>SESSION </span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
      </div>
    </div>
  )
}