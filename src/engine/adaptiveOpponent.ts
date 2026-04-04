import type { PlayerState, GameModifiers, AdaptationEntry } from '../types'

export const DEFAULT_MODIFIERS: GameModifiers = {
  spawnRate: 1.2,
  decaySpeed: 1.0,
  growthSpeed: 1.0,
  decoyProbability: 0.0,
  rewardScaling: 1.0,
  maxShapesOnScreen: 6,
  driftSpeed: 0,
  missDamageMultiplier: 1.0,
  decoyDamageMultiplier: 1.0,
}

interface Rule {
  id: string
  condition: (p: PlayerState) => boolean
  description: string
  trigger: string
  apply: (m: GameModifiers, p: PlayerState) => Partial<GameModifiers>
}

const RULES: Rule[] = [
  {
    id: 'impulsive_decoys',
    condition: p => p.impulsivity > 0.72,
    trigger: 'impulsivity > 0.72',
    description: 'Increased decoy frequency — you click too fast to discriminate',
    apply: (m, _p) => ({ decoyProbability: Math.min(m.decoyProbability + 0.08, 0.4) }),
  },
  {
    id: 'impulsive_decoy_damage',
    condition: p => p.impulsivity > 0.8,
    trigger: 'impulsivity > 0.80',
    description: 'Decoy damage amplified — your reflexes are costing you more HP',
    apply: (m, _p) => ({ decoyDamageMultiplier: Math.min(m.decoyDamageMultiplier + 0.3, 2.0) }),
  },
  {
    id: 'patient_pressure',
    condition: p => p.patience > 0.7 && p.totalClicks > 5,
    trigger: 'patience > 0.70',
    description: 'Shapes expire faster — waiting is no longer safe',
    apply: (m, _p) => ({ decaySpeed: Math.max(m.decaySpeed - 0.1, 0.5) }),
  },
  {
    id: 'patient_miss_damage',
    condition: p => p.patience > 0.75 && p.totalMisses > 3,
    trigger: 'patience > 0.75 and misses > 3',
    description: 'Miss damage increased — letting shapes expire now costs more HP',
    apply: (m, _p) => ({ missDamageMultiplier: Math.min(m.missDamageMultiplier + 0.4, 2.5) }),
  },
  {
    id: 'risk_traps',
    condition: p => p.riskTolerance > 0.68,
    trigger: 'riskTolerance > 0.68',
    description: 'High-risk traps introduced — large shapes now carry penalties',
    apply: (m, _p) => ({ decoyProbability: Math.min(m.decoyProbability + 0.05, 0.4) }),
  },
  {
    id: 'safe_player_squeeze',
    condition: p => p.riskTolerance < 0.3 && p.totalClicks > 8,
    trigger: 'riskTolerance < 0.30',
    description: 'Fewer high-reward opportunities — playing safe pays less',
    apply: (m, _p) => ({ rewardScaling: Math.max(m.rewardScaling - 0.1, 0.5) }),
  },
  {
    id: 'consistent_speedup',
    condition: p => p.consistency > 0.8 && p.totalClicks > 10,
    trigger: 'consistency > 0.80',
    description: 'Growth speed increased — stable patterns get disrupted',
    apply: (m, _p) => ({ growthSpeed: Math.min(m.growthSpeed + 0.15, 2.0) }),
  },
  {
    id: 'spawn_pressure',
    condition: p => p.totalClicks > 20 && p.impulsivity < 0.4,
    trigger: 'totalClicks > 20 and low impulsivity',
    description: 'Spawn rate increased — calm players face more decisions',
    apply: (m, _p) => ({ spawnRate: Math.min(m.spawnRate + 0.2, 2.5) }),
  },
  {
    id: 'patience_drift',
    condition: p => p.patience > 0.6 && p.totalClicks > 5,
    trigger: 'patience > 0.60',
    description: 'Shapes now drift — waiting means chasing a moving target',
    apply: (m, _p) => ({ driftSpeed: Math.min(m.driftSpeed + 35, 80) }),
  },
  {
    id: 'consistency_drift_boost',
    condition: p => p.consistency > 0.75 && p.totalClicks > 12,
    trigger: 'consistency > 0.75',
    description: 'Drift speed increased — your predictable timing meets unpredictable targets',
    apply: (m, _p) => ({ driftSpeed: Math.min(m.driftSpeed + 30, 130) }),
  },
  {
    id: 'performance_surge',
    condition: p => {
      const fireCount = ruleFiredCounts.get('performance_surge') ?? 0
      //Threshold escalates: 0.55, 0.65, 0.75, 0.85, then caps at 0.85
      const threshold = Math.min(0.55 + fireCount * 0.10, 0.85)
      return p.performance > threshold && p.totalClicks > 20
    },
    trigger: 'performance > escalating threshold (0.55 → 0.65 → 0.75 → 0.85)',
    description: 'Overall difficulty surge — you perform well, so the system is testing you harder',
    apply: (m, _p) => {
      //const fireCount = ruleFiredCounts.get('performance_surge') ?? 0
      //const threshold = Math.min(0.55 + fireCount * 0.10, 0.85)
      //const threshold = 0.60
      //const intensity = Math.max(0, (p.performance - threshold) / (1 - threshold))
      return {
        spawnRate: Math.min(m.spawnRate + 0.2, 4.0),
        decaySpeed: Math.max(m.decaySpeed - 0.08, 0.5),
        growthSpeed: Math.min(m.growthSpeed + 0.15, 2.5),
        driftSpeed: Math.min(m.driftSpeed + 20, 150),
        decoyProbability: Math.min(m.decoyProbability + 0.08 , 0.4),
        rewardScaling: Math.max(m.rewardScaling - 0.08 , 0.6),
      }
    },
  },
  {
    id: 'performance_relief',
    condition: p => p.performance < 0.43 && p.totalMisses > 7,
    trigger: 'performance < 0.43 and misses > 7',
    description: 'Difficulty relief — you struggle, so the system is easing up',
    apply: (m, _p) => ({
      spawnRate: Math.max(m.spawnRate - 0.02, 1.2),
      decaySpeed: Math.min(m.decaySpeed + 0.1, 2.0),
      growthSpeed: Math.max(m.growthSpeed - 0.15, 0.7),
      decoyProbability: Math.max(m.decoyProbability - 0.05, 0),
      rewardScaling: Math.min(m.rewardScaling + 0.1, 2.0),
    }),
  }
]

const firedRules = new Set<string>()
const ruleFiredCounts = new Map<string, number>()

export function adapt(
  player: PlayerState,
  current: GameModifiers,
  log: AdaptationEntry[]
): { modifiers: GameModifiers; log: AdaptationEntry[] } {
  let modifiers = { ...current }
  const newLog = [...log]

  for (const rule of RULES) {
    if (rule.condition(player)) {
      const delta = rule.apply(modifiers, player)
      modifiers = { ...modifiers, ...delta }

      firedRules.add(rule.id)
      ruleFiredCounts.set(rule.id, (ruleFiredCounts.get(rule.id) ?? 0) + 1)
      newLog.push({
        timestamp: Date.now(),
        trigger: rule.trigger,
        change: delta,
        description: rule.description,
      })
    }
  }

  return { modifiers, log: newLog }
}

export function resetAdaptation() {
  firedRules.clear()
  ruleFiredCounts.clear()
}