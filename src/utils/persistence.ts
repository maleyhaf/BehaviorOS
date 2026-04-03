import type { PlayerState } from '../types'

// local storage key for saving player profile
const KEY = 'adaptive_system_profile'

export interface StoredProfile {
  riskTolerance: number
  impulsivity: number
  patience: number
  consistency: number
  sessionsPlayed: number
  lastPlayed: number
}

// retrieve saved player profile from storage
export function loadProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredProfile
  } catch {
    // if storage fails, just return null silently
    return null
  }
}

// persist player behavior profile to storage
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
    // if storage fails, fail silently
  }
}

// delete stored profile from storage
export function clearProfile(): void {
  localStorage.removeItem(KEY)
}

// apply saved profile to fresh player state to maintain traits across sessions
export function applyProfile(base: PlayerState, profile: StoredProfile): PlayerState {
  return {
    ...base,
    riskTolerance: profile.riskTolerance,
    impulsivity: profile.impulsivity,
    patience: profile.patience,
    consistency: profile.consistency,
  }
}
