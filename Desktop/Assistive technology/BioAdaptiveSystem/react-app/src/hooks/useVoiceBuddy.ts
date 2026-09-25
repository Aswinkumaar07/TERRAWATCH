import { useCallback, useRef, useEffect } from "react"
import { useDashboard } from "@/context/DashboardContext"

export function useVoiceBuddy() {
  const synth = useRef<SpeechSynthesis | null>(window.speechSynthesis)
  const lastSpeakTime = useRef(0)
  const cooldown = 120000 // 2 minutes

  const { voiceActive } = useDashboard()

  const speak = useCallback((text: string, priority = false) => {
    if (!synth.current || !voiceActive) return
    
    const now = Date.now()
    if (!priority && (now - lastSpeakTime.current < cooldown)) return

    if (priority) synth.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    
    synth.current.speak(utterance)
    lastSpeakTime.current = now
  }, [voiceActive])

  return { speak }
}
