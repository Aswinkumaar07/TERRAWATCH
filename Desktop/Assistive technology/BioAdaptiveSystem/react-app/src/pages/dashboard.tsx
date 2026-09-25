import React, { useState } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Camera, Brain, Clock, ShieldCheck, CheckCircle2, Sliders, RefreshCw, Play, 
  Pause, RotateCcw, Volume2, VolumeX, Eye, Lock, Sparkles, Activity, AlertCircle, Server, Puzzle,
  ChevronLeft, ChevronRight, SlidersHorizontal, Settings2, Trash2, Key, Database
} from "lucide-react"
import { useDashboard } from "@/context/DashboardContext"
import { LiveAnalysis } from "@/components/dashboard/LiveAnalysis"
import { useAnalytics } from "@/hooks/useAnalytics"
import { cn } from "@/lib/utils"
import { TabType } from "@/App"

import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// --- Helper Functions ---
function getCognitiveStateDisplay(level: string) {
  switch (level) {
    case 'HIGH_COGNITIVE_LOAD':
      return { label: 'High Cognitive Load', tag: 'HIGH_COGNITIVE_LOAD', color: 'text-red-400 border-red-500/30 bg-red-500/10', message: 'High cognitive strain estimated. A short rest break is strongly advised.' }
    case 'POSSIBLE_FATIGUE':
      return { label: 'Possible Fatigue', tag: 'POSSIBLE_FATIGUE', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', message: 'Elevated cognitive load estimated. Font sizing and focus mode active.' }
    case 'REDUCED_ATTENTION':
      return { label: 'Reduced Attention', tag: 'REDUCED_ATTENTION', color: 'text-amber-300 border-amber-400/30 bg-amber-400/10', message: 'Slight attention shift detected. Consider taking a brief breather.' }
    case 'RECOVERY':
      return { label: 'Recovery', tag: 'RECOVERY', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10', message: 'Cognitive state recovering. Transitioning back to optimal settings.' }
    case 'NORMAL':
    default:
      return { label: 'Normal', tag: 'NORMAL', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', message: 'You appear to be in a good state.' }
  }
}

// --- Sub-components ---

function ExtensionInfo() {
  return (
    <Card className="liquid-card p-10 border border-white/5 bg-[#0D1322]/80 text-center max-w-3xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto mb-6">
        <Puzzle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Browser Extension Integration</h2>
      <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto leading-relaxed">
        Enable cross-site adaptive accessibility by installing the accompanying browser extension. It adjusts font scaling, contrast, and focus mode on external websites.
      </p>
      
      <div className="text-left space-y-4 max-w-md mx-auto mb-8">
        <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 items-center">
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white shrink-0 text-xs font-bold">1</div>
          <p className="text-xs text-slate-300">Open <code className="bg-white/10 px-2 py-0.5 rounded text-violet-300">chrome://extensions</code> in Chrome</p>
        </div>
        <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 items-center">
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white shrink-0 text-xs font-bold">2</div>
          <p className="text-xs text-slate-300">Enable <strong>Developer mode</strong> in the top right corner</p>
        </div>
        <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 items-center">
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white shrink-0 text-xs font-bold">3</div>
          <p className="text-xs text-slate-300">Click <strong>Load unpacked</strong> and select the <code className="bg-white/10 px-2 py-0.5 rounded text-violet-300">extension</code> folder</p>
        </div>
      </div>

      <a 
        href="/BioAdaptiveExtension.zip?v=1.1" 
        download 
        className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-lg hover:shadow-violet-500/25"
      >
        <span>Download Extension Bundle</span>
      </a>
    </Card>
  )
}

function HistoryView({ goldenHour }: { goldenHour: string | null }) {
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  
  const { backendSummary, loading, loadBackendData } = useAnalytics()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = [...Array(firstDay).fill(null), ...Array(daysInMonth).keys().map(i => i + 1)]
  
  const getDayData = (day: number) => {
    const key = `bio_adaptive_${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    return JSON.parse(localStorage.getItem(key) || "[]")
  }

  const selectedData = selectedDay ? JSON.parse(localStorage.getItem(selectedDay) || "[]") : null
  const selectedDateObj = selectedDay ? new Date(selectedDay.replace('bio_adaptive_', '')) : null

  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i)

  const hourlyAverages = Array(24).fill(0).map(() => ({ total: 0, count: 0 }))
  
  if (backendSummary && backendSummary.hourlyFocusDistribution) {
    backendSummary.hourlyFocusDistribution.forEach((h: any, i: number) => {
      if (i < 24) {
        hourlyAverages[i].total = h.focusScore
        hourlyAverages[i].count = 1
      }
    })
  } else {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('bio_adaptive_')) {
        const data = JSON.parse(localStorage.getItem(key) || "[]")
        data.forEach((entry: any) => {
          if (entry.timestamp?.includes(':')) {
            const h = parseInt(entry.timestamp.split(':')[0])
            hourlyAverages[h].total += (100 - entry.score)
            hourlyAverages[h].count++
          }
        })
      }
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-white/5">
          <span className="text-xs text-slate-400 block mb-1">Total Sessions</span>
          <span className="text-2xl font-bold text-white">{backendSummary?.totalSessions ?? '5'}</span>
        </div>
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-white/5">
          <span className="text-xs text-slate-400 block mb-1">Total Monitoring</span>
          <span className="text-2xl font-bold text-white">{backendSummary?.totalMonitoringMinutes ?? '185'} min</span>
        </div>
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-white/5">
          <span className="text-xs text-slate-400 block mb-1">Avg Fatigue Est.</span>
          <span className="text-2xl font-bold text-white">{backendSummary?.avgEstimatedCognitiveFatigue ?? '34'}%</span>
        </div>
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-white/5">
          <span className="text-xs text-slate-400 block mb-1">Adaptation Triggers</span>
          <span className="text-2xl font-bold text-white">{backendSummary?.interventionsTriggered ?? '12'}</span>
        </div>
      </div>

      <Card className="liquid-card p-8 border border-white/5 bg-[#0D1322]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
             <button onClick={() => setMonth(m => m === 0 ? 11 : m - 1)} className="p-2 rounded-lg bg-white/[0.04] border border-white/5 text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
             </button>
             <select 
               value={month} 
               onChange={(e) => setMonth(parseInt(e.target.value))}
               className="bg-[#090D16] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-semibold text-white outline-none cursor-pointer"
             >
               {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                 <option key={m} value={i} className="bg-slate-900">{m}</option>
               ))}
             </select>
             <select 
               value={year} 
               onChange={(e) => setYear(parseInt(e.target.value))}
               className="bg-[#090D16] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-semibold text-white outline-none cursor-pointer"
             >
               {years.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
             </select>
             <button onClick={() => setMonth(m => m === 11 ? 0 : m + 1)} className="p-2 rounded-lg bg-white/[0.04] border border-white/5 text-slate-400 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
             </button>
             <button onClick={() => loadBackendData()} className="p-2 rounded-lg bg-white/[0.04] border border-white/5 text-slate-400 hover:text-white transition-colors">
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center text-[11px] font-medium text-slate-500 mb-1">{d}</div>
          ))}
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />
            const dayData = getDayData(day)
            const avgScore = dayData.length ? Math.round(dayData.reduce((s: any, d: any) => s + d.score, 0) / dayData.length) : null
            const key = `bio_adaptive_${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
            const isFuture = new Date(year, month, day) > new Date()
            
            return (
              <button
                key={day}
                disabled={isFuture}
                onClick={() => setSelectedDay(key)}
                className={cn(
                  "aspect-square rounded-xl border transition-all flex flex-col items-center justify-center p-1 relative",
                  selectedDay === key ? "border-violet-500 ring-1 ring-violet-500/50" : "border-white/5",
                  isFuture ? "opacity-20 cursor-not-allowed" :
                  !dayData.length ? "bg-white/[0.02] hover:bg-white/[0.05]" : 
                  avgScore! <= 25 ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" :
                  avgScore! <= 50 ? "bg-amber-500/20 border-amber-500/30 text-amber-300" :
                  avgScore! <= 75 ? "bg-orange-500/20 border-orange-500/30 text-orange-300" : "bg-red-500/20 border-red-500/30 text-red-300"
                )}
              >
                <span className="text-xs font-semibold">{day}</span>
                {dayData.length > 0 && (
                  <span className="text-[9px] opacity-75 mt-0.5">{avgScore}%</span>
                )}
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// --- Main Page Component ---

interface DashboardPageProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onLogout: () => void
}

export default function DashboardPage({ activeTab, onTabChange, onLogout }: DashboardPageProps) {
    const { 
        isRunning, fatigueScore, blinkRate, posture,
        typingSpeed, isIdle,
        fontActive, brightnessActive, focusActive, voiceActive,
        extensionConnected, serverConnected, currentAdaptationLevel, recommendations, confidenceScore,
        focusTime, privacyMode, setPrivacyMode,
        demoMode, setDemoMode,
        toggleSystemState, toggleSession
    } = useDashboard()
    const { goldenHour } = useAnalytics()

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const stateDisplay = getCognitiveStateDisplay(currentAdaptationLevel)
    const estimatedFatiguePercent = fatigueScore
    const estimatedAttentionPercent = Math.max(0, 100 - fatigueScore)
    const isLive = isRunning || demoMode

    return (
        <MainLayout activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout}>
            {activeTab === "dashboard" && (
                <div className="space-y-6">
                    {/* Demo Mode Banner (PART 8) */}
                    {demoMode && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-amber-300 text-xs font-medium">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-400">SIMULATED DATA — DEMO MODE</span>
                        </div>
                        <span className="text-[10px] text-amber-300/80 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/30">
                          Active Stage: {currentAdaptationLevel}
                        </span>
                      </div>
                    )}

                    {/* TOP HEADER */}
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Good afternoon</h1>
                            <p className="text-slate-400 text-xs mt-0.5">Let's keep your mind fresh and focused.</p>
                        </div>

                        {/* Status Bar Indicators */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-xs">
                                <span className={cn("w-2 h-2 rounded-full", serverConnected ? "bg-emerald-400" : "bg-amber-400")} />
                                <span className="text-[11px] text-slate-300 font-medium">
                                  {serverConnected ? "Backend Online" : "Local Mode"}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-xs">
                                <span className={cn("w-2 h-2 rounded-full", extensionConnected ? "bg-emerald-400" : "bg-slate-500")} />
                                <span className="text-[11px] text-slate-300 font-medium">
                                  {extensionConnected ? "Extension Connected" : "Extension Off"}
                                </span>
                            </div>

                            <button
                              onClick={() => setDemoMode(!demoMode)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors border",
                                demoMode ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
                              )}
                            >
                              Demo Mode
                            </button>
                        </div>
                    </header>

                    {/* PRIMARY ROW: LIVE MONITORING | COGNITIVE STATE | FOCUS TIMER */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* 1. LIVE MONITORING */}
                        <Card className="lg:col-span-4 liquid-card p-6 border border-white/5 bg-[#0D1322] flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-base font-bold text-white">Live Monitoring</h3>
                                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", isRunning ? (privacyMode ? "bg-violet-500/20 text-violet-300 border-violet-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30") : "bg-white/5 text-slate-400 border-white/5")}>
                                      {isRunning ? (privacyMode ? "Privacy Mode Active" : "Camera Active") : "Camera Off"}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-xs mb-4">Real-time analysis of your cognitive state</p>
                                
                                {/* Video Preview Container */}
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/60 relative border border-white/5">
                                    <LiveAnalysis />
                                </div>
                            </div>

                            {/* Controls Below Camera */}
                            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4 text-xs">
                                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors">
                                        <input 
                                          type="checkbox" 
                                          checked={privacyMode} 
                                          onChange={(e) => setPrivacyMode(e.target.checked)} 
                                          className="rounded border-white/20 bg-white/5 text-violet-500 focus:ring-0"
                                        />
                                        <span>Privacy Mode</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors">
                                        <input 
                                          type="checkbox" 
                                          checked={voiceActive} 
                                          onChange={() => toggleSystemState('voice')} 
                                          className="rounded border-white/20 bg-white/5 text-violet-500 focus:ring-0"
                                        />
                                        <span>Audio Alerts</span>
                                    </label>
                                </div>

                                {isRunning && (
                                  <button
                                    onClick={toggleSession}
                                    className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold transition-colors border border-red-500/20"
                                  >
                                    Stop Session
                                  </button>
                                )}
                            </div>
                        </Card>

                        {/* 2. COGNITIVE STATE (VISUALLY DOMINANT - STATE CONSISTENCY ENHANCED) */}
                        <Card className="lg:col-span-5 liquid-card p-6 border border-white/5 bg-[#0D1322] flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-base font-bold text-white">Cognitive State</h3>
                                    <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider", isLive ? stateDisplay.color : "text-slate-400 border-white/10 bg-white/5")}>
                                        {isLive ? stateDisplay.label : `Last State: ${stateDisplay.label}`}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-xs mb-6">
                                  {isLive ? "Real-time estimated fatigue & attention capacity" : "Last estimated state (Monitoring Inactive)"}
                                </p>
                                
                                {/* Gauge / Circle Visualization */}
                                <div className="flex flex-col items-center justify-center my-2 relative">
                                    <div className="relative w-44 h-44 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle 
                                              className="text-white/[0.06]" 
                                              strokeWidth="8" 
                                              stroke="currentColor" 
                                              fill="transparent" 
                                              r="40" 
                                              cx="50" 
                                              cy="50" 
                                            />
                                            <circle 
                                              className={cn(
                                                "transition-all duration-700",
                                                !isLive ? "text-slate-500 opacity-60" : (fatigueScore > 75 ? "text-red-500" : fatigueScore > 40 ? "text-amber-500" : "text-violet-400")
                                              )} 
                                              strokeWidth="8" 
                                              strokeDasharray={251.2} 
                                              strokeDashoffset={251.2 * (1 - (fatigueScore / 100))} 
                                              strokeLinecap="round" 
                                              stroke="currentColor" 
                                              fill="transparent" 
                                              r="40" 
                                              cx="50" 
                                              cy="50" 
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center text-center">
                                            <span className={cn("text-4xl font-black tracking-tight", isLive ? "text-white" : "text-slate-300")}>{fatigueScore}%</span>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                                              {isLive ? "Estimated Fatigue" : "Last Estimated Fatigue"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cognitive State Message & Confidence */}
                            <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                  {isLive ? stateDisplay.message : "Monitoring is inactive. Displaying last estimated state from previous session."}
                                </p>
                                <span className={cn("text-[10px] font-semibold shrink-0 ml-3 px-2 py-0.5 rounded border", isLive ? "text-violet-400 bg-violet-500/10 border-violet-500/20" : "text-slate-400 bg-white/5 border-white/10")}>
                                  {isLive ? `${confidenceScore}% Confidence` : `Last Recorded Conf (${confidenceScore}%)`}
                                </span>
                            </div>
                        </Card>

                        {/* 3. FOCUS TIMER */}
                        <Card className="lg:col-span-3 liquid-card p-6 border border-white/5 bg-[#0D1322] flex flex-col justify-between">
                            <div>
                                <h3 className="text-base font-bold text-white mb-1">Focus Timer</h3>
                                <p className="text-slate-400 text-xs mb-6">Pomodoro deep work mode</p>
                                
                                <div className="text-center py-6">
                                    <span className="text-5xl font-black text-white tracking-tight font-mono">{formatTime(focusTime)}</span>
                                    <p className="text-xs text-slate-400 mt-2 font-medium">Focus Session (25m)</p>
                                </div>
                            </div>

                            <button
                                onClick={toggleSession}
                                className={cn(
                                  "w-full py-3 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2",
                                  isRunning 
                                    ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30" 
                                    : "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20"
                                )}
                            >
                                {isRunning ? (
                                  <>
                                    <Pause className="w-4 h-4" />
                                    <span>Pause Session</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4" />
                                    <span>Start Focus</span>
                                  </>
                                )}
                            </button>
                        </Card>
                    </div>

                    {/* METRICS ROW (COMPACT TILES WITH CLEAR STATE LABELING) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricTile 
                          label={isLive ? "Attention" : "Attention (Last Estimated)"} 
                          value={`${estimatedAttentionPercent}%`} 
                          barPercent={estimatedAttentionPercent}
                          barColor={isLive ? "bg-emerald-500" : "bg-slate-500"}
                        />
                        <MetricTile 
                          label={isLive ? "Cognitive Load" : "Cognitive Load (Last)"} 
                          value={`${estimatedFatiguePercent}%`} 
                          barPercent={estimatedFatiguePercent}
                          barColor={!isLive ? "bg-slate-500" : (fatigueScore > 75 ? "bg-red-500" : fatigueScore > 40 ? "bg-amber-500" : "bg-violet-500")}
                        />
                        <MetricTile 
                          label={isLive ? "Confidence" : "Confidence (Last Recorded)"} 
                          value={`${confidenceScore}%`} 
                          barPercent={confidenceScore}
                          barColor={isLive ? "bg-blue-500" : "bg-slate-600"}
                        />
                        <MetricTile 
                          label="Posture" 
                          value={isLive ? (posture === "No Face Detected" ? "Searching..." : posture) : "Session Inactive"} 
                          sub={isLive ? (posture === "Upright" ? "Normal Alignment" : "Adjust Seating") : `Last: ${posture}`}
                        />
                    </div>

                    {/* RECENT ACTIVITY (LINE CHART) */}
                    <Card className="liquid-card p-6 border border-white/5 bg-[#0D1322]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-white">Recent Activity</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Estimated cognitive load over time</p>
                            </div>
                        </div>

                        <div className="h-[220px] w-full pt-2">
                            <Line 
                              data={{
                                labels: ['12:00', '12:05', '12:10', '12:15', '12:20', '12:25', '12:30', '12:35', '12:40'],
                                datasets: [{
                                  label: 'Estimated Cognitive Fatigue',
                                  data: [15, 18, 22, 38, 42, 62, 55, 30, fatigueScore],
                                  borderColor: '#8B5CF6',
                                  backgroundColor: 'rgba(139, 92, 246, 0.08)',
                                  fill: true,
                                  tension: 0.35,
                                  pointRadius: 4,
                                  pointBackgroundColor: '#8B5CF6',
                                  borderWidth: 2
                                }]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: { 
                                    min: 0, 
                                    max: 100, 
                                    grid: { color: 'rgba(255, 255, 255, 0.03)' }, 
                                    ticks: { color: '#64748B', font: { size: 10 } } 
                                  },
                                  x: { 
                                    grid: { display: false }, 
                                    ticks: { color: '#64748B', font: { size: 10 } } 
                                  }
                                },
                                plugins: { 
                                  legend: { display: false },
                                  tooltip: {
                                     backgroundColor: '#0F172A',
                                     titleColor: '#F8FAFC',
                                     bodyColor: '#94A3B8',
                                     padding: 10,
                                     cornerRadius: 8,
                                     borderColor: 'rgba(255, 255, 255, 0.1)',
                                     borderWidth: 1
                                  }
                                }
                              }}
                            />
                        </div>
                    </Card>

                    {/* ADAPTIVE ACCESSIBILITY */}
                    <Card className="liquid-card p-6 border border-white/5 bg-[#0D1322]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-white">Adaptive Accessibility</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Your interface adapts based on your estimated cognitive state.</p>
                            </div>
                            <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                              Active State: {currentAdaptationLevel}
                            </span>
                        </div>

                        {/* Four Compact Setting Controls */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <SettingTile 
                              label="Font" 
                              value={fontActive ? "Boosted (+10%)" : "Normal"} 
                              active={fontActive}
                              onClick={() => toggleSystemState('font')}
                            />
                            <SettingTile 
                              label="Brightness" 
                              value={brightnessActive ? "Dimmed" : "Auto"} 
                              active={brightnessActive}
                              onClick={() => toggleSystemState('brightness')}
                            />
                            <SettingTile 
                              label="Focus Mode" 
                              value={focusActive ? "On" : "Off"} 
                              active={focusActive}
                              onClick={() => toggleSystemState('focus')}
                            />
                            <SettingTile 
                              label="Reduce Motion" 
                              value={currentAdaptationLevel === 'HIGH_COGNITIVE_LOAD' || currentAdaptationLevel === 'POSSIBLE_FATIGUE' ? "On" : "Off"} 
                              active={currentAdaptationLevel === 'HIGH_COGNITIVE_LOAD' || currentAdaptationLevel === 'POSSIBLE_FATIGUE'}
                              onClick={() => {}}
                            />
                        </div>

                        {/* Active Recommendations & Disclaimer */}
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                          <p className="text-xs font-semibold text-white mb-2">Current Active Adaptations:</p>
                          {recommendations.map((rec, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{rec}</span>
                            </div>
                          ))}
                          <p className="text-[11px] text-slate-400 italic pt-3 border-t border-white/5 mt-3">
                            "Adaptive recommendations are generated from estimated cognitive and behavioral signals."
                          </p>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === "analytics" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Performance History & Analytics</h1>
                    <p className="text-slate-400 text-xs mt-0.5">Long-term estimated cognitive load patterns and attention distribution</p>
                  </div>
                  <HistoryView goldenHour={goldenHour} />
                </div>
            )}

            {activeTab === "sessions" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Session History Logs</h1>
                    <p className="text-slate-400 text-xs mt-0.5">Historical telemetry recordings and data logs</p>
                  </div>
                  <HistoryView goldenHour={goldenHour} />
                </div>
            )}

            {activeTab === "accessibility" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Adaptive Accessibility Engine</h1>
                    <p className="text-slate-400 text-xs mt-0.5">Real-time interface adjustments based on estimated cognitive state</p>
                  </div>

                  <Card className="liquid-card p-6 border border-white/5 bg-[#0D1322]">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white">Manual Accessibility Controls</h3>
                      <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                        Current State: {currentAdaptationLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">Large Font Sizing</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Enlarges UI typography by +10% for improved readability</p>
                        </div>
                        <button 
                          onClick={() => toggleSystemState('font')}
                          className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border", fontActive ? "bg-violet-600 text-white border-violet-500" : "bg-white/5 text-slate-400 border-white/10")}
                        >
                          {fontActive ? "Active" : "Disabled"}
                        </button>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">Contrast & Glare Reduction</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Dims screen brightness and softens high contrast</p>
                        </div>
                        <button 
                          onClick={() => toggleSystemState('brightness')}
                          className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border", brightnessActive ? "bg-violet-600 text-white border-violet-500" : "bg-white/5 text-slate-400 border-white/10")}
                        >
                          {brightnessActive ? "Active" : "Disabled"}
                        </button>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">Focus Mode Highlight</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Dims sidebars and advertisements on external pages</p>
                        </div>
                        <button 
                          onClick={() => toggleSystemState('focus')}
                          className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border", focusActive ? "bg-violet-600 text-white border-violet-500" : "bg-white/5 text-slate-400 border-white/10")}
                        >
                          {focusActive ? "Active" : "Disabled"}
                        </button>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">Audio Break Reminders</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Plays gentle voice alerts during critical cognitive strain</p>
                        </div>
                        <button 
                          onClick={() => toggleSystemState('voice')}
                          className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border", voiceActive ? "bg-violet-600 text-white border-violet-500" : "bg-white/5 text-slate-400 border-white/10")}
                        >
                          {voiceActive ? "Active" : "Disabled"}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                      <p className="text-xs font-semibold text-white mb-2">Active Recommendations:</p>
                      {recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                      <p className="text-[11px] text-slate-400 italic pt-3 border-t border-white/5 mt-3">
                        "Adaptive recommendations are generated from estimated cognitive and behavioral signals."
                      </p>
                    </div>
                  </Card>
                </div>
            )}

            {activeTab === "extension" && (
                <div className="py-6">
                  <ExtensionInfo />
                </div>
            )}

            {activeTab === "settings" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white">System Settings</h1>
                    <p className="text-slate-400 text-xs mt-0.5">Configure system parameters and connectivity</p>
                  </div>

                  <Card className="liquid-card p-6 border border-white/5 bg-[#0D1322]">
                    <h3 className="text-base font-bold text-white mb-4">System Parameters & Status</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div>
                          <p className="text-xs font-semibold text-white">Privacy Mode Default</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Run fatigue monitoring using typing, scrolling, and idle heuristics without webcam</p>
                        </div>
                        <button
                          onClick={() => setPrivacyMode(!privacyMode)}
                          className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border", privacyMode ? "bg-violet-600 text-white border-violet-500" : "bg-white/5 text-slate-400 border-white/10")}
                        >
                          {privacyMode ? "Active" : "Disabled"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div>
                          <p className="text-xs font-semibold text-white">Backend API Server</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Express + SQLite Server on http://localhost:3001</p>
                        </div>
                        <span className={cn("text-xs font-semibold px-3 py-1 rounded-full border", serverConnected ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30")}>
                          {serverConnected ? "Connected (SQLite Active)" : "Local Offline Mode"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div>
                          <p className="text-xs font-semibold text-white">Chrome Extension Relay</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Cross-site accessibility sync engine</p>
                        </div>
                        <span className={cn("text-xs font-semibold px-3 py-1 rounded-full border", extensionConnected ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-white/5 text-slate-400 border-white/10")}>
                          {extensionConnected ? "Extension Connected" : "Waiting for Extension"}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
            )}
        </MainLayout>
    )
}

function MetricTile({ label, value, sub, barPercent, barColor }: { label: string, value: string, sub?: string, barPercent?: number, barColor?: string }) {
  return (
    <div className="p-4 rounded-xl bg-[#0D1322] border border-white/5">
      <span className="text-xs text-slate-400 block mb-1 font-medium">{label}</span>
      <span className="text-xl font-bold text-white tracking-tight">{value}</span>
      {sub && <span className="text-[10px] text-slate-400 block mt-0.5">{sub}</span>}
      {barPercent !== undefined && (
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-3">
          <div className={cn("h-full rounded-full transition-all duration-500", barColor || "bg-violet-500")} style={{ width: `${barPercent}%` }} />
        </div>
      )}
    </div>
  )
}

function SettingTile({ label, value, active, onClick }: { label: string, value: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
        active ? "bg-violet-500/10 border-violet-500/30 text-white" : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.04]"
      )}
    >
      <div>
        <span className="text-xs font-semibold block">{label}</span>
        <span className="text-[11px] text-slate-400 block mt-0.5">{value}</span>
      </div>
      <div className={cn("w-3 h-3 rounded-full border", active ? "bg-violet-400 border-violet-300" : "bg-slate-700 border-slate-600")} />
    </div>
  )
}
