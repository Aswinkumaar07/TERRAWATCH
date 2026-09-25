import { useEffect, useState, useCallback } from "react"
import { getAnalyticsSummary, getAnalyticsHistory } from "@/lib/api"

export function useAnalytics() {
  const [goldenHour, setGoldenHour] = useState<string | null>(null)
  const [backendSummary, setBackendSummary] = useState<any>(null)
  const [backendHistory, setBackendHistory] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recordData = (score: number, blinkRate: number, typingSpeed: number, wasIdle: boolean) => {
    const now = new Date()
    const dateKey = `bio_adaptive_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const existing = JSON.parse(localStorage.getItem(dateKey) || "[]")
    existing.push({ timestamp, score, blinkRate, typingSpeed, wasIdle })
    localStorage.setItem(dateKey, JSON.stringify(existing))
  }

  const loadBackendData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const summary = await getAnalyticsSummary()
      const history = await getAnalyticsHistory()

      if (summary) {
        setBackendSummary(summary)
        if (summary.goldenHour) {
          setGoldenHour(summary.goldenHour)
        }
      }
      if (history) {
        setBackendHistory(history)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync backend analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePeakHours = useCallback(() => {
    const hourlyFocus = Array(24).fill(0).map(() => ({ total: 0, count: 0 }))
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('bio_adaptive_')) {
        const data = JSON.parse(localStorage.getItem(key) || "[]")
        data.forEach((entry: any) => {
          if (entry.timestamp?.includes(':')) {
            const hour = parseInt(entry.timestamp.split(':')[0])
            hourlyFocus[hour].total += (100 - entry.score)
            hourlyFocus[hour].count++
          }
        })
      }
    }

    let maxFocus = 0
    let peakHour = -1
    hourlyFocus.forEach((h, i) => {
      const avg = h.count > 0 ? (h.total / h.count) : 0
      if (avg > maxFocus) {
        maxFocus = avg
        peakHour = i
      }
    })

    if (peakHour !== -1 && maxFocus > 20) {
      const ampm = peakHour >= 12 ? 'PM' : 'AM'
      const displayHour = peakHour % 12 || 12
      setGoldenHour(`${displayHour} ${ampm}`)
    }
  }, [])

  useEffect(() => {
    updatePeakHours()
    loadBackendData()
  }, [updatePeakHours, loadBackendData])

  return { 
    recordData, 
    goldenHour, 
    updatePeakHours, 
    backendSummary, 
    backendHistory,
    loadBackendData,
    loading,
    error
  }
}
