import { useState, useRef, useEffect } from "react"
import { FaceMesh, Results } from "@mediapipe/face_mesh"
import { Camera } from "@mediapipe/camera_utils"

export function useFaceMesh(isRunning: boolean, onResults: (results: Results) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const faceMeshRef = useRef<FaceMesh | null>(null)
  const cameraRef = useRef<Camera | null>(null)

  useEffect(() => {
    if (!videoRef.current) return

    // Initialize FaceMesh once
    if (!faceMeshRef.current) {
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      })

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      faceMeshRef.current = faceMesh
    }

    const faceMesh = faceMeshRef.current
    faceMesh.onResults(onResults)

    const stopCamera = () => {
      if (cameraRef.current) {
        cameraRef.current.stop()
        cameraRef.current = null
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => {
          track.stop()
        })
        videoRef.current.srcObject = null
      }
      setIsLoaded(false)
    }

    // Handle Camera Start/Stop based on isRunning
    if (isRunning) {
      if (!cameraRef.current && videoRef.current && faceMeshRef.current) {
        cameraRef.current = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && faceMeshRef.current && isRunning) {
              await faceMeshRef.current.send({ image: videoRef.current })
            }
          },
          width: 640,
          height: 480,
        })
        cameraRef.current.start().then(() => setIsLoaded(true))
      }
    } else {
      stopCamera()
    }

    return () => {
      // Unregister callback on effect cleanup to avoid leaks/stale closures
      if (faceMeshRef.current) {
        faceMeshRef.current.onResults(() => {})
      }
    }
  }, [isRunning, onResults])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraRef.current) cameraRef.current.stop()
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
      if (faceMeshRef.current) faceMeshRef.current.close()
    }
  }, [])

  return { videoRef, isLoaded }
}
