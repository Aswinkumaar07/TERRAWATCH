import React, { useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { useFaceMesh } from "@/hooks/useFaceMesh"
import { useDashboard } from "@/context/DashboardContext"
import { Results } from "@mediapipe/face_mesh"
import { useEyeGuardian } from "@/hooks/useEyeGuardian"
import { useVoiceBuddy } from "@/hooks/useVoiceBuddy"

// Thresholds
const EYE_AR_THRESH = 0.20
const MOUTH_AR_THRESH = 0.45

export function LiveAnalysis() {
  const { isRunning, setFatigueScore, setBlinkRate, setPosture, privacyMode } = useDashboard()
  const { recordBlink } = useEyeGuardian(isRunning)
  const { speak } = useVoiceBuddy()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Internal state for logic (refs to avoid re-renders)
  const metricsRef = useRef({
    eyeClosedFrames: 0,
    blinkCount: 0,
    lastBlinkTime: Date.now(),
    blinkTimestamps: [] as number[],
    yawnFrames: 0,
    perclosSamples: [] as boolean[], // Sliding window of eye closure (max 600 samples for ~60s at 10fps)
    smoothedScore: 0,
  })

  const onResults = useCallback((results: Results) => {
    if (!isRunning || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Mirror
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0]
      const metrics = metricsRef.current

      // --- EAR Calculation (Eye Closure) ---
      const leftEAR = calculateEAR([33, 160, 158, 133, 153, 144], landmarks)
      const rightEAR = calculateEAR([362, 385, 387, 263, 373, 380], landmarks)
      const avgEAR = (leftEAR + rightEAR) / 2.0
      
      const isEyeClosed = avgEAR < EYE_AR_THRESH
      
      // Update PERCLOS sliding window (percentage of eye closure over time)
      metrics.perclosSamples.push(isEyeClosed)
      if (metrics.perclosSamples.length > 300) metrics.perclosSamples.shift() // ~30s window @ 10fps
      const perclos = (metrics.perclosSamples.filter(Boolean).length / metrics.perclosSamples.length) * 100

      if (isEyeClosed) {
        metrics.eyeClosedFrames++
      } else {
        if (metrics.eyeClosedFrames >= 2) {
          metrics.blinkCount++
          recordBlink()
          const now = Date.now()
          metrics.blinkTimestamps.push(now)
          metrics.blinkTimestamps = metrics.blinkTimestamps.filter(t => now - t < 60000)
          setBlinkRate(metrics.blinkTimestamps.length)
        }
        metrics.eyeClosedFrames = 0
      }

      // --- MAR Calculation (Yawning) ---
      // Inner mouth landmarks: 13 (top), 14 (bottom)
      const mouthHeight = Math.abs(landmarks[13].y - landmarks[14].y)
      const faceHeight = Math.abs(landmarks[10].y - landmarks[152].y)
      const mar = mouthHeight / faceHeight

      if (mar > MOUTH_AR_THRESH) {
        metrics.yawnFrames++
      } else {
        metrics.yawnFrames = 0
      }
      const isYawning = metrics.yawnFrames > 15 // Sustained opening for ~1.5s

      // --- Posture Analysis ---
      const nose = landmarks[1]
      const leftEar = landmarks[234]
      const rightEar = landmarks[454]
      
      let currentPosture = "Upright"
      let headTiltFactor = 0
      if (nose.y > (leftEar.y + rightEar.y) / 2 + 0.05) {
        currentPosture = "Tilted Down"
        headTiltFactor = 40
      } else if (Math.abs(leftEar.z - rightEar.z) > 0.1) {
        currentPosture = "Looking Away"
        headTiltFactor = 30
      }
      setPosture(currentPosture)

      // --- Final Score Compilation ---
      // PERCLOS is weighted heavily (scientific drowsiness), plus blinks/yawns/posture
      let perclosFactor = perclos * 5 // 10% PERCLOS -> 50 points
      let closureDurationFactor = metrics.eyeClosedFrames > 20 ? 80 : (metrics.eyeClosedFrames > 10 ? 40 : 0)
      let yawnFactor = isYawning ? 30 : 0
      let blinkRateFactor = metrics.blinkTimestamps.length > 20 ? 30 : 0

      let rawScore = Math.min(100, perclosFactor + closureDurationFactor + yawnFactor + blinkRateFactor + headTiltFactor)
      
      // Smoothing (Exponential Moving Average)
      metrics.smoothedScore = (metrics.smoothedScore * 0.95) + (rawScore * 0.05)
      const finalScore = Math.round(metrics.smoothedScore)
      
      if (finalScore > 75 && isRunning) {
        speak("Your fatigue level is critical. Please take a break.", false)
      }
      setFatigueScore(finalScore)
    } else {
      setPosture("No Face Detected")
    }
  }, [isRunning, setFatigueScore, setBlinkRate, setPosture, recordBlink, speak])

  const { videoRef } = useFaceMesh(isRunning && !privacyMode, onResults)

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className="hidden"
        playsInline
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className={cn("w-full h-full object-cover rounded-lg transition-opacity", privacyMode ? "opacity-20 pointer-events-none" : "opacity-100")}
      />
      {!isRunning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
          <p className="text-white/60 font-medium">Click Start to begin analysis</p>
        </div>
      )}
      {isRunning && privacyMode && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-lg">
          <div className="p-4 rounded-full bg-[var(--primary-color)]/20 mb-4 animate-pulse">
            <span className="text-2xl">🛡️</span>
          </div>
          <p className="text-white font-black uppercase tracking-widest text-sm">Privacy Mode Active</p>
          <p className="text-white/40 text-[10px] uppercase tracking-tighter mt-1">Behavioral Tracking Only</p>
        </div>
      )}
    </div>
  )
}

function euclideanDistance(p1: any, p2: any) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

function calculateEAR(indices: number[], landmarks: any[]) {
  const p1 = landmarks[indices[0]]
  const p4 = landmarks[indices[3]]
  const p2 = landmarks[indices[1]]
  const p3 = landmarks[indices[2]]
  const p5 = landmarks[indices[5]]
  const p6 = landmarks[indices[4]]

  const vert1 = euclideanDistance(p2, p6)
  const vert2 = euclideanDistance(p3, p5)
  const horiz = euclideanDistance(p1, p4)

  return (vert1 + vert2) / (2.0 * horiz)
}
