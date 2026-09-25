import express from 'express'
import cors from 'cors'
import db, { initDB } from './db.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Initialize DB schema & seed data if empty
initDB()

// --- Scientific Terminology & Privacy Declarations ---
const SYSTEM_INFO = {
  name: "Bio-Adaptive Cognitive Fatigue Detection & Intelligent Web Accessibility System",
  version: "2.0.0-hackathon-release",
  positioning: "Scientific Estimation & Attention State Monitoring",
  disclaimer: "Adaptive recommendations are generated from estimated cognitive and behavioral signals.",
  privacy: "Privacy-First Architecture: Derived biometric and behavioral metrics only. No raw camera frames stored or transmitted."
}

// 1. Healthcheck
app.get('/api/health', (req, res) => {
  try {
    const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions').get().count
    res.json({
      status: 'online',
      system: SYSTEM_INFO,
      database: 'connected (SQLite)',
      totalSessionsRecorded: sessionCount,
      timestamp: Date.now()
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 2. Start Session
app.post('/api/sessions/start', (req, res) => {
  try {
    const { mode = 'camera', userId = 'demo-user' } = req.body
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const startTime = Date.now()

    // Close any orphaned active sessions cleanly
    db.prepare(`UPDATE sessions SET status = 'completed', end_time = ? WHERE status = 'active'`).run(startTime)

    db.prepare(`
      INSERT INTO sessions (id, user_id, start_time, mode, status, posture_summary)
      VALUES (?, ?, ?, ?, 'active', ?)
    `).run(sessionId, userId, startTime, mode, mode === 'privacy_mode' ? 'Privacy Tracking' : 'Upright')

    res.json({
      success: true,
      session: {
        id: sessionId,
        mode,
        startTime,
        status: 'active'
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 3. Stop Session
app.post('/api/sessions/stop', (req, res) => {
  try {
    const { sessionId } = req.body
    const endTime = Date.now()

    let activeSession = null
    if (sessionId) {
      activeSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId)
    } else {
      activeSession = db.prepare("SELECT * FROM sessions WHERE status = 'active' ORDER BY start_time DESC LIMIT 1").get()
    }

    if (!activeSession) {
      return res.json({ success: true, message: 'No active session to stop' })
    }

    if (activeSession.status === 'completed') {
      return res.json({ success: true, session: activeSession })
    }

    const durationSeconds = Math.max(1, Math.round((endTime - activeSession.start_time) / 1000))

    // Calculate session aggregate stats from telemetry logs
    const stats = db.prepare(`
      SELECT 
        AVG(fatigue_score) as avg_score,
        MAX(fatigue_score) as peak_score,
        COUNT(*) as log_count,
        AVG(typing_speed) as avg_typing
      FROM telemetry_logs 
      WHERE session_id = ?
    `).get(activeSession.id)

    const avgScore = stats && stats.avg_score !== null ? Math.round(stats.avg_score * 10) / 10 : activeSession.avg_fatigue_score
    const peakScore = stats && stats.peak_score !== null ? Math.round(stats.peak_score) : activeSession.peak_fatigue_score
    const avgTyping = stats && stats.avg_typing !== null ? Math.round(stats.avg_typing) : activeSession.avg_typing_speed

    db.prepare(`
      UPDATE sessions 
      SET status = 'completed', 
          end_time = ?, 
          duration_seconds = ?,
          avg_fatigue_score = ?,
          peak_fatigue_score = ?,
          avg_typing_speed = ?
      WHERE id = ?
    `).run(endTime, durationSeconds, avgScore, peakScore, avgTyping, activeSession.id)

    const updatedSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(activeSession.id)

    res.json({
      success: true,
      session: updatedSession
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 4. Get Active Session
app.get('/api/sessions/active', (req, res) => {
  try {
    const session = db.prepare("SELECT * FROM sessions WHERE status = 'active' ORDER BY start_time DESC LIMIT 1").get()
    res.json({
      success: true,
      activeSession: session || null
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 5. Telemetry Log Batch Ingestion (Derived Metrics ONLY - Privacy Protected)
app.post('/api/telemetry', (req, res) => {
  try {
    const {
      sessionId,
      fatigueScore = 0,
      blinkRate = 0,
      typingSpeed = 0,
      posture = 'Upright',
      perclos = 0,
      mar = 0,
      isIdle = false,
      privacyMode = false,
      timestamp = Date.now()
    } = req.body

    const dateObj = new Date(timestamp)
    const timeStr = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`

    db.prepare(`
      INSERT INTO telemetry_logs (session_id, timestamp, time_str, fatigue_score, blink_rate, typing_speed, posture, perclos, mar, is_idle, privacy_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId || 'adhoc',
      timestamp,
      timeStr,
      fatigueScore,
      blinkRate,
      typingSpeed,
      posture,
      perclos,
      mar,
      isIdle ? 1 : 0,
      privacyMode ? 1 : 0
    )

    // Calculate exact 5 accessibility cognitive states: NORMAL, REDUCED_ATTENTION, POSSIBLE_FATIGUE, HIGH_COGNITIVE_LOAD, RECOVERY
    let adaptationLevel = 'NORMAL'
    if (fatigueScore > 75) adaptationLevel = 'HIGH_COGNITIVE_LOAD'
    else if (fatigueScore > 50) adaptationLevel = 'POSSIBLE_FATIGUE'
    else if (fatigueScore > 25) adaptationLevel = 'REDUCED_ATTENTION'
    else adaptationLevel = 'NORMAL'

    // Log interventions if elevated
    if (adaptationLevel === 'HIGH_COGNITIVE_LOAD' || adaptationLevel === 'POSSIBLE_FATIGUE') {
      db.prepare(`
        INSERT INTO interventions (session_id, trigger_type, adaptation_applied, timestamp)
        VALUES (?, ?, ?, ?)
      `).run(sessionId || 'adhoc', adaptationLevel, 'Adaptive Accessibility Boost', timestamp)
    }

    // Update global settings adaptation level
    db.prepare(`
      UPDATE accessibility_settings 
      SET current_adaptation_level = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE key = 'global'
    `).run(adaptationLevel)

    res.json({
      success: true,
      recommendation: {
        adaptationLevel,
        estimatedCognitiveLoad: fatigueScore > 50 ? 'Elevated' : 'Optimal',
        attentionState: isIdle ? 'Inactive' : (fatigueScore > 70 ? 'Drowsy / Distracted' : 'Focused'),
        disclaimer: "Adaptive recommendations are generated from estimated cognitive and behavioral signals.",
        suggestedInterventions: getSuggestedInterventions(adaptationLevel)
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Helper for accessibility recommendations mapping all 5 states
function getSuggestedInterventions(level) {
  switch (level) {
    case 'HIGH_COGNITIVE_LOAD':
      return [
        'Enlarge UI typography by +15%',
        'Apply strict high-contrast focus scrim',
        'Trigger rest break reminder audio cue',
        'Suppress non-essential background animations'
      ]
    case 'POSSIBLE_FATIGUE':
      return [
        'Enlarge font sizes by +10%',
        'Enable reduced motion mode',
        'Highlight primary reading area'
      ]
    case 'REDUCED_ATTENTION':
      return [
        'Increase text line-height by +5%',
        'Slightly dim background glare'
      ]
    case 'RECOVERY':
      return [
        'Cognitive load returning to baseline',
        'Gradually restoring standard layout dimensions'
      ]
    case 'NORMAL':
    default:
      return ['Standard accessibility configuration active']
  }
}

// 6. Analytics Summary
app.get('/api/analytics/summary', (req, res) => {
  try {
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM sessions').get().count
    const totalDuration = db.prepare('SELECT COALESCE(SUM(duration_seconds), 0) as total FROM sessions').get().total
    const avgScoreRow = db.prepare('SELECT COALESCE(AVG(avg_fatigue_score), 0) as avg_score FROM sessions').get()
    const interventionsCount = db.prepare('SELECT COUNT(*) as count FROM interventions').get().count

    const logs = db.prepare('SELECT time_str, fatigue_score FROM telemetry_logs').all()
    const hourlyFocus = Array(24).fill(0).map(() => ({ total: 0, count: 0 }))

    logs.forEach(log => {
      if (log.time_str && log.time_str.includes(':')) {
        const hour = parseInt(log.time_str.split(':')[0])
        if (!isNaN(hour) && hour >= 0 && hour < 24) {
          hourlyFocus[hour].total += (100 - log.fatigue_score)
          hourlyFocus[hour].count++
        }
      }
    })

    let maxFocus = 0
    let peakHour = -1
    hourlyFocus.forEach((h, i) => {
      const avg = h.count > 0 ? (h.total / h.count) : 0
      if (avg > maxFocus) {
        maxFocus = avg
        peakHour = i
      }
    })

    let goldenHour = null
    if (peakHour !== -1) {
      const ampm = peakHour >= 12 ? 'PM' : 'AM'
      const displayHour = peakHour % 12 || 12
      goldenHour = `${displayHour} ${ampm}`
    }

    res.json({
      success: true,
      summary: {
        totalSessions,
        totalMonitoringMinutes: Math.round(totalDuration / 60),
        avgEstimatedCognitiveFatigue: Math.round(avgScoreRow.avg_score * 10) / 10,
        interventionsTriggered: interventionsCount,
        goldenHour,
        hourlyFocusDistribution: hourlyFocus.map((h, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          focusScore: h.count > 0 ? Math.round(h.total / h.count) : 0
        }))
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 7. Analytics History
app.get('/api/analytics/history', (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT * FROM sessions ORDER BY start_time DESC LIMIT 30
    `).all()

    const recentLogs = db.prepare(`
      SELECT * FROM telemetry_logs ORDER BY timestamp DESC LIMIT 500
    `).all()

    res.json({
      success: true,
      sessions,
      recentLogs
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 8. Accessibility State & Settings
app.get('/api/accessibility/state', (req, res) => {
  try {
    const settings = db.prepare("SELECT * FROM accessibility_settings WHERE key = 'global'").get()
    res.json({
      success: true,
      settings: {
        fontActive: Boolean(settings.font_active),
        brightnessActive: Boolean(settings.brightness_active),
        focusActive: Boolean(settings.focus_active),
        voiceActive: Boolean(settings.voice_active),
        privacyMode: Boolean(settings.privacy_mode),
        adaptationLevel: settings.current_adaptation_level,
        recommendations: getSuggestedInterventions(settings.current_adaptation_level)
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/accessibility/settings', (req, res) => {
  try {
    const { fontActive, brightnessActive, focusActive, voiceActive, privacyMode } = req.body

    const current = db.prepare("SELECT * FROM accessibility_settings WHERE key = 'global'").get()

    const fontVal = fontActive !== undefined ? (fontActive ? 1 : 0) : current.font_active
    const brightVal = brightnessActive !== undefined ? (brightnessActive ? 1 : 0) : current.brightness_active
    const focusVal = focusActive !== undefined ? (focusActive ? 1 : 0) : current.focus_active
    const voiceVal = voiceActive !== undefined ? (voiceActive ? 1 : 0) : current.voice_active
    const privacyVal = privacyMode !== undefined ? (privacyMode ? 1 : 0) : current.privacy_mode

    db.prepare(`
      UPDATE accessibility_settings 
      SET font_active = ?, brightness_active = ?, focus_active = ?, voice_active = ?, privacy_mode = ?, updated_at = CURRENT_TIMESTAMP
      WHERE key = 'global'
    `).run(fontVal, brightVal, focusVal, voiceVal, privacyVal)

    res.json({
      success: true,
      settings: {
        fontActive: Boolean(fontVal),
        brightnessActive: Boolean(brightVal),
        focusActive: Boolean(focusVal),
        voiceActive: Boolean(voiceVal),
        privacyMode: Boolean(privacyVal)
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 9. Chrome Extension Sync
app.get('/api/extension/state', (req, res) => {
  try {
    const settings = db.prepare("SELECT * FROM accessibility_settings WHERE key = 'global'").get()
    const activeSession = db.prepare("SELECT * FROM sessions WHERE status = 'active' ORDER BY start_time DESC LIMIT 1").get()
    const latestTelemetry = db.prepare("SELECT * FROM telemetry_logs ORDER BY timestamp DESC LIMIT 1").get()

    res.json({
      success: true,
      systemActive: Boolean(activeSession),
      adaptationLevel: settings ? settings.current_adaptation_level : 'NORMAL',
      score: latestTelemetry ? latestTelemetry.fatigue_score : 0,
      privacyMode: settings ? Boolean(settings.privacy_mode) : false,
      manualOverrides: {
        font: settings ? Boolean(settings.font_active) : false,
        brightness: settings ? Boolean(settings.brightness_active) : false,
        focus: settings ? Boolean(settings.focus_active) : false
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/extension/sync', (req, res) => {
  try {
    const { score, activeState } = req.body

    if (score !== undefined) {
      db.prepare(`
        INSERT INTO telemetry_logs (session_id, timestamp, time_str, fatigue_score, blink_rate, typing_speed, posture, privacy_mode)
        VALUES ('extension-sync', ?, ?, ?, 0, 0, 'Extension Relay', 0)
      `).run(Date.now(), new Date().toTimeString().substring(0, 5), score)
    }

    res.json({ success: true, acknowledged: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`[BioAdaptive Fullstack Server] Running on http://localhost:${PORT}`)
})
