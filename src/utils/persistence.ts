import type { PlayerState } from '../types'

const KEY = 'adaptive_system_profile'

export interface StoredProfile {
  riskTolerance: number
  impulsivity: number
  patience: number
  consistency: number
  sessionsPlayed: number
  lastPlayed: number
}

export function loadProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredProfile
  } catch {
    return null
  }
}

export function saveProfile(player: PlayerState, sessionsPlayed: number): void {
  try {
    const profile: StoredProfile = {
      riskTolerance: player.riskTolerance,
      impulsivity: player.impulsivity,
      patience: player.patience,
      consistency: player.consistency,
      sessionsPlayed,
      lastPlayed: Date.now(),
    }
    localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    // storage unavailable, fail silently
  }
}

export function clearProfile(): void {
  localStorage.removeItem(KEY)
}

// Merge stored profile into a fresh PlayerState so the model
// starts warm instead of at 0.5 defaults
export function applyProfile(base: PlayerState, profile: StoredProfile): PlayerState {
  return {
    ...base,
    riskTolerance: profile.riskTolerance,
    impulsivity: profile.impulsivity,
    patience: profile.patience,
    consistency: profile.consistency,
  }
}
