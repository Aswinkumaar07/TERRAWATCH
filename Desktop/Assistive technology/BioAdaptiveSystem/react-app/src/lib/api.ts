// API Client for Bio-Adaptive Cognitive Fatigue Detection & Accessibility System
const API_BASE = 'http://localhost:3001/api'

export interface TelemetryPayload {
  sessionId?: string
  fatigueScore: number
  blinkRate: number
  typingSpeed: number
  posture: string
  perclos?: number
  mar?: number
  isIdle: boolean
  privacyMode: boolean
  timestamp?: number
}

export interface SessionRecord {
  id: string
  user_id: string
  start_time: number
  end_time?: number
  duration_seconds: number
  mode: 'camera' | 'privacy_mode'
  status: 'active' | 'completed'
  avg_fatigue_score: number
  peak_fatigue_score: number
  blink_count: number
  avg_typing_speed: number
  posture_summary: string
}

export interface AnalyticsSummary {
  totalSessions: number
  totalMonitoringMinutes: number
  avgEstimatedCognitiveFatigue: number
  interventionsTriggered: number
  goldenHour: string | null
  hourlyFocusDistribution: Array<{ hour: string; focusScore: number }>
}

export interface AccessibilityState {
  fontActive: boolean
  brightnessActive: boolean
  focusActive: boolean
  voiceActive: boolean
  privacyMode: boolean
  adaptationLevel: 'LOW_FATIGUE' | 'MEDIUM_FATIGUE' | 'HIGH_FATIGUE' | 'CRITICAL_FATIGUE'
  recommendations: string[]
}

// 1. Health check
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    return null
  }
}

// 2. Start Session
export async function startBackendSession(mode: 'camera' | 'privacy_mode' = 'camera') {
  try {
    const res = await fetch(`${API_BASE}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.warn('[BioAdaptive Client] Backend start session offline, using local mode.')
    return null
  }
}

// 3. Stop Session
export async function stopBackendSession(sessionId?: string) {
  try {
    const res = await fetch(`${API_BASE}/sessions/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.warn('[BioAdaptive Client] Backend stop session offline.')
    return null
  }
}

// 4. Send Telemetry Batch (Derived Metrics ONLY - Privacy Protected)
export async function sendTelemetry(payload: TelemetryPayload) {
  try {
    const res = await fetch(`${API_BASE}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    return null
  }
}

// 5. Fetch Analytics Summary
export async function getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  try {
    const res = await fetch(`${API_BASE}/analytics/summary`)
    if (!res.ok) return null
    const data = await res.json()
    return data.summary || null
  } catch (err) {
    return null
  }
}

// 6. Fetch Analytics History
export async function getAnalyticsHistory() {
  try {
    const res = await fetch(`${API_BASE}/analytics/history`)
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    return null
  }
}

// 7. Get Accessibility Recommendations & State
export async function getAccessibilityState(): Promise<AccessibilityState | null> {
  try {
    const res = await fetch(`${API_BASE}/accessibility/state`)
    if (!res.ok) return null
    const data = await res.json()
    return data.settings || null
  } catch (err) {
    return null
  }
}

// 8. Update Accessibility Settings
export async function updateAccessibilitySettings(settings: Partial<AccessibilityState>) {
  try {
    const res = await fetch(`${API_BASE}/accessibility/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    return null
  }
}
