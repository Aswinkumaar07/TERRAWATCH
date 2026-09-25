import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react"
import { useAnalytics } from "@/hooks/useAnalytics"
import {
  checkBackendHealth,
  startBackendSession,
  stopBackendSession,
  sendTelemetry,
  updateAccessibilitySettings
} from "@/lib/api"

interface DashboardState {
  isRunning: boolean
  setIsRunning: (val: boolean) => void
  fatigueScore: number
  setFatigueScore: (val: number) => void
  blinkRate: number
  setBlinkRate: (val: number) => void
  typingSpeed: number
  setTypingSpeed: (val: number) => void
  posture: string
  setPosture: (val: string) => void
  isIdle: boolean
  setIsIdle: (val: boolean) => void
  // System State toggles
  fontActive: boolean
  brightnessActive: boolean
  focusActive: boolean
  voiceActive: boolean
  extensionConnected: boolean
  serverConnected: boolean
  activeSessionId: string | null
  currentAdaptationLevel: string
  recommendations: string[]
  confidenceScore: number
  focusTime: number
  privacyMode: boolean
  setPrivacyMode: (val: boolean) => void
  demoMode: boolean
  setDemoMode: (val: boolean) => void
  toggleSystemState: (key: 'font' | 'brightness' | 'focus' | 'voice') => void
  toggleSession: () => void
}

const DashboardContext = createContext<DashboardState | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isRunning, setIsRunningState] = useState(false)
  const [fatigueScore, setFatigueScoreState] = useState(0)
  const [blinkRate, setBlinkRate] = useState(0)
  const [typingSpeed, setTypingSpeed] = useState(0)
  const [posture, setPosture] = useState("Upright")
  const [isIdle, setIsIdle] = useState(false)
  const [confidenceScore, setConfidenceScore] = useState(94)
  
  // System states
  const [fontActive, setFontActive] = useState(false)
  const [brightnessActive, setBrightnessActive] = useState(false)
  const [focusActive, setFocusActive] = useState(false)
  const [voiceActive, setVoiceActive] = useState(true)
  const [extensionConnected, setExtensionConnected] = useState(false)
  const [serverConnected, setServerConnected] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [currentAdaptationLevel, setCurrentAdaptationLevel] = useState("NORMAL")
  const [recommendations, setRecommendations] = useState<string[]>([
    "Standard accessibility configuration active"
  ])
  const [focusTime, setFocusTime] = useState(25 * 60)
  const [privacyMode, setPrivacyModeState] = useState(false)
  const [demoMode, setDemoModeState] = useState(false)
  
  const { recordData } = useAnalytics()

  // 1. Check Backend Server Connection
  const checkServer = useCallback(async () => {
    const health = await checkBackendHealth()
    if (health && health.status === 'online') {
      setServerConnected(true)
    } else {
      setServerConnected(false)
    }
  }, [])

  useEffect(() => {
    checkServer()
    const healthInterval = setInterval(checkServer, 10000)
    return () => clearInterval(healthInterval)
  }, [checkServer])

  // 2. Handle Extension Communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BIO_ADAPTIVE_ACK') {
        setExtensionConnected(true)
      } else if (event.data?.type === 'BIO_ADAPTIVE_MANUAL_SYNC') {
        const overrides = event.data.manualOverrides
        setFontActive(!!overrides.font)
        setBrightnessActive(!!overrides.brightness)
        setFocusActive(!!overrides.focus)
      } else if (event.data?.type === 'BIO_ADAPTIVE_PRIVACY_SYNC') {
        setPrivacyModeState(!!event.data.privacyMode)
      }
    }

    window.addEventListener('message', handleMessage)
    
    // Ping extension to check connectivity
    const ping = setInterval(() => {
      window.postMessage({ type: 'BIO_ADAPTIVE_STATE', fatigueScore: 0 }, '*')
    }, 5000)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearInterval(ping)
    }
  }, [])

  // 3. System State Toggles
  const toggleSystemState = (key: 'font' | 'brightness' | 'focus' | 'voice') => {
    if (key === 'voice') {
      const nextVoice = !voiceActive
      setVoiceActive(nextVoice)
      updateAccessibilitySettings({ voiceActive: nextVoice })
      return
    }

    const newValue = key === 'font' ? !fontActive : key === 'brightness' ? !brightnessActive : !focusActive
    
    if (key === 'font') {
      setFontActive(newValue)
      updateAccessibilitySettings({ fontActive: newValue })
    }
    if (key === 'brightness') {
      setBrightnessActive(newValue)
      updateAccessibilitySettings({ brightnessActive: newValue })
    }
    if (key === 'focus') {
      setFocusActive(newValue)
      updateAccessibilitySettings({ focusActive: newValue })
    }

    // Notify extension
    window.postMessage({
      type: 'BIO_ADAPTIVE_MANUAL_TOGGLE',
      overrideType: key,
      value: newValue
    }, '*')
  }

  // 4. Privacy Mode Toggle
  const setPrivacyMode = (val: boolean) => {
    setPrivacyModeState(val)
    updateAccessibilitySettings({ privacyMode: val })
    window.postMessage({
      type: 'BIO_ADAPTIVE_PRIVACY_TOGGLE',
      privacyMode: val
    }, '*')
  }

  // 5. Start / Stop Session Handler
  const toggleSession = async () => {
    const nextIsRunning = !isRunning
    setIsRunningState(nextIsRunning)

    if (nextIsRunning) {
      window.postMessage({ type: 'BIO_ADAPTIVE_START_SYSTEM' }, '*')
      const mode = privacyMode ? 'privacy_mode' : 'camera'
      const result = await startBackendSession(mode)
      if (result && result.session) {
        setActiveSessionId(result.session.id)
      }
    } else {
      window.postMessage({ type: 'BIO_ADAPTIVE_STOP_SYSTEM' }, '*')
      if (activeSessionId) {
        await stopBackendSession(activeSessionId)
        setActiveSessionId(null)
      } else {
        await stopBackendSession()
      }
    }
  }

  const setIsRunning = (val: boolean) => {
    if (val !== isRunning) {
      toggleSession()
    }
  }

  const setFatigueScore = (val: number) => {
    if (!demoMode) {
      setFatigueScoreState(val)
    }
  }

  // 6. Demo Mode Cycle Handler (PART 8 Requirement)
  const setDemoMode = (enabled: boolean) => {
    setDemoModeState(enabled)
    if (enabled && !isRunning) {
      setIsRunningState(true)
    }
  }

  useEffect(() => {
    if (!demoMode) return

    const demoSteps = [
      { level: 'NORMAL', score: 15, blink: 14, wpm: 68, posture: 'Upright', conf: 96, recs: ['Standard accessibility configuration active'] },
      { level: 'REDUCED_ATTENTION', score: 38, blink: 22, wpm: 46, posture: 'Upright', conf: 93, recs: ['Increase text line-height by +5%', 'Slightly dim background glare'] },
      { level: 'POSSIBLE_FATIGUE', score: 62, blink: 29, wpm: 26, posture: 'Tilted Down', conf: 91, recs: ['Enlarge font sizes by +10%', 'Enable reduced motion mode', 'Highlight primary reading area'] },
      { level: 'HIGH_COGNITIVE_LOAD', score: 85, blink: 38, wpm: 12, posture: 'Looking Away', conf: 95, recs: ['Enlarge UI typography by +15%', 'Apply strict high-contrast focus scrim', 'Trigger rest break reminder audio cue', 'Suppress non-essential background animations'] },
      { level: 'RECOVERY', score: 20, blink: 16, wpm: 58, posture: 'Upright', conf: 94, recs: ['Cognitive load returning to baseline', 'Gradually restoring standard layout dimensions'] }
    ]

    let stepIndex = 0

    const runDemoStep = () => {
      const step = demoSteps[stepIndex]
      setFatigueScoreState(step.score)
      setBlinkRate(step.blink)
      setTypingSpeed(step.wpm)
      setPosture(step.posture)
      setConfidenceScore(step.conf)
      setCurrentAdaptationLevel(step.level)
      setRecommendations(step.recs)

      // Transmit demo telemetry to backend API and extension
      sendTelemetry({
        sessionId: activeSessionId || 'demo-mode-session',
        fatigueScore: step.score,
        blinkRate: step.blink,
        typingSpeed: step.wpm,
        posture: step.posture,
        isIdle: false,
        privacyMode,
        timestamp: Date.now()
      })

      window.postMessage({
        type: 'BIO_ADAPTIVE_STATE',
        fatigueScore: step.score
      }, '*')

      stepIndex = (stepIndex + 1) % demoSteps.length
    }

    runDemoStep()
    const demoInterval = setInterval(runDemoStep, 4000)

    return () => clearInterval(demoInterval)
  }, [demoMode, activeSessionId, privacyMode])

  // 7. Real-time Telemetry Sync Loop (Non-demo)
  useEffect(() => {
    if (!isRunning || demoMode) return
    
    let keyCount = 0
    let lastActivity = Date.now()

    const handleKeyDown = () => { 
      keyCount++ 
      lastActivity = Date.now()
    }
    const handleMouseMove = () => {
      lastActivity = Date.now()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousemove', handleMouseMove)

    // Telemetry Sync Interval (Throttled to 5s for performance)
    const telemetryInterval = setInterval(async () => {
      const now = Date.now()
      const idle = (now - lastActivity) > 30000
      setIsIdle(idle)

      const wpm = Math.round(keyCount / 5) * 12
      setTypingSpeed(wpm)
      
      recordData(fatigueScore, blinkRate, wpm, idle)

      const res = await sendTelemetry({
        sessionId: activeSessionId || undefined,
        fatigueScore,
        blinkRate,
        typingSpeed: wpm,
        posture,
        perclos: (fatigueScore / 100) * 0.25,
        mar: 0.35,
        isIdle: idle,
        privacyMode,
        timestamp: Date.now()
      })

      if (res && res.recommendation) {
        setCurrentAdaptationLevel(res.recommendation.adaptationLevel)
        setRecommendations(res.recommendation.suggestedInterventions || [])
      }

      keyCount = 0 
    }, 5000)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(telemetryInterval)
    }
  }, [isRunning, demoMode, fatigueScore, blinkRate, posture, privacyMode, activeSessionId, recordData])

  // 8. Focus Timer Ticker
  useEffect(() => {
    if (!isRunning) return

    const ticker = setInterval(() => {
      setFocusTime(prev => {
        if (prev <= 0) return 25 * 60
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(ticker)
  }, [isRunning])

  return (
    <DashboardContext.Provider value={{
      isRunning, setIsRunning,
      fatigueScore, setFatigueScore,
      blinkRate, setBlinkRate,
      typingSpeed, setTypingSpeed,
      posture, setPosture,
      isIdle, setIsIdle,
      fontActive, brightnessActive, focusActive, voiceActive, 
      extensionConnected, serverConnected, activeSessionId,
      currentAdaptationLevel, recommendations, confidenceScore,
      focusTime, privacyMode, setPrivacyMode,
      demoMode, setDemoMode,
      toggleSystemState, toggleSession
    }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) throw new Error("useDashboard must be used within DashboardProvider")
  return context
}
