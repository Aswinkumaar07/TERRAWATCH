import { useEffect, useRef, useCallback } from "react"
import { useVoiceBuddy } from "./useVoiceBuddy"

export function useEyeGuardian(isRunning: boolean) {
  const { speak } = useVoiceBuddy()
  const lastBlinkTime = useRef(Date.now())
  const staringThreshold = 20000 // 20 seconds

  const recordBlink = useCallback(() => {
    lastBlinkTime.current = Date.now()
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      const timeSinceBlink = Date.now() - lastBlinkTime.current
      if (timeSinceBlink > staringThreshold) {
        speak("You've been staring at the screen for a while. Remember to blink and look away.", true)
        // Reset to avoid spamming
        lastBlinkTime.current = Date.now()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isRunning, speak])

  return { recordBlink }
}
