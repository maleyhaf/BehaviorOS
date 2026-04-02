import type { SessionReport } from '../types'

interface Props {
  sessionsPlayed: number
  report: SessionReport
  onRestart: () => void
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function lvl(v: number) {
  if (v > 0.7) return 'HIGH'
  if (v > 0.4) return 'MODERATE'
  return 'LOW'
}

export function EndScreen({ report, onRestart, sessionsPlayed }: Props) {
  const { player, adaptationLog, behaviorSummary, systemStatement, finalScore, duration } = report

  return (
    <div style={{
      background: '#050a10',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      padding: 24,
    }}>
      <div style={{ maxWidth: 640, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: '#4ade80', letterSpacing: '0.12em', marginBottom: 8 }}>SESSION COMPLETE</div>
          <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 4 }}>{finalScore}</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{Math.round(duration / 1000)}s session</div>
        </div>

        {/* Behavioral summary */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12, letterSpacing: '0.08em' }}>BEHAVIORAL ANALYSIS</div>
          {behaviorSummary.map((line, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              {line}
            </div>
          ))}
        </div>

        {/* Trait scores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>PLAYER PROFILE</div>
            <StatRow label="Risk tendency" value={lvl(player.riskTolerance)} />
            <StatRow label="Impulsivity" value={lvl(player.impulsivity)} />
            <StatRow label="Patience" value={lvl(player.patience)} />
            <StatRow label="Consistency" value={lvl(player.consistency)} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>ACTIVITY</div>
            <StatRow label="Total clicks" value={String(player.totalClicks)} />
            <StatRow label="Missed shapes" value={String(player.totalMisses)} />
            <StatRow label="Hit rate" value={
              player.totalClicks + player.totalMisses > 0
                ? `${Math.round(player.totalClicks / (player.totalClicks + player.totalMisses) * 100)}%`
                : '—'
            } />
            <StatRow label="Adaptations" value={String(adaptationLog.length)} />
          </div>
        </div>

        {/* Adaptation log */}
        {adaptationLog.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12, letterSpacing: '0.08em' }}>SYSTEM RESPONSE HISTORY</div>
            {adaptationLog.map((entry, i) => (
              <div key={i} style={{
                padding: '8px 12px',
                marginBottom: 6,
                background: 'rgba(250,204,21,0.06)',
                border: '1px solid rgba(250,204,21,0.15)',
                borderRadius: 4,
                fontSize: 11,
              }}>
                <div style={{ color: 'rgba(250,204,21,0.6)', marginBottom: 2 }}>↳ TRIGGER: {entry.trigger}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)' }}>{entry.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* System statement */}
        <div style={{
          textAlign: 'center',
          padding: '24px 0',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' }}>
            "{systemStatement}"
          </div>
        </div>

        {/* Restart */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onRestart}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '10px 32px',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 12,
              letterSpacing: '0.08em',
            }}
          >
            RUN AGAIN
          </button>
        </div>

      </div>
    </div>
  )
}
