import React from "react"
import { 
  LayoutDashboard, BarChart3, Clock, Sliders, Puzzle, Settings, 
  Download, LogOut, ShieldCheck, User 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/context/DashboardContext"
import { TabType } from "@/App"

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onLogout: () => void
}

export function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  const { serverConnected } = useDashboard()

  return (
    <aside className="w-[260px] bg-[#0D1322] border-r border-white/5 p-6 flex flex-col sticky top-0 h-screen z-20 shrink-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 px-2 cursor-pointer" onClick={() => onTabChange("dashboard")}>
        <img 
          src="/logo.png" 
          alt="BioAdaptive Logo" 
          className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" 
        />
        <span className="text-xl font-bold tracking-tight text-white">
          BioAdaptive
        </span>
        <span className="text-[9px] font-black uppercase tracking-wider bg-violet-500/15 text-violet-400 border border-violet-500/30 px-1.5 py-0.5 rounded">
          PRO
        </span>
      </div>

      {/* Navigation List (All 6 Functioning Tabs) */}
      <nav className="flex flex-col gap-1 flex-1">
        <NavItem 
          icon={<LayoutDashboard className="w-4 h-4" />} 
          label="Dashboard" 
          active={activeTab === "dashboard"} 
          onClick={() => onTabChange("dashboard")}
        />
        <NavItem 
          icon={<BarChart3 className="w-4 h-4" />} 
          label="Analytics" 
          active={activeTab === "analytics"} 
          onClick={() => onTabChange("analytics")}
        />
        <NavItem 
          icon={<Clock className="w-4 h-4" />} 
          label="Sessions" 
          active={activeTab === "sessions"} 
          onClick={() => onTabChange("sessions")}
        />
        <NavItem 
          icon={<Sliders className="w-4 h-4" />} 
          label="Accessibility" 
          active={activeTab === "accessibility"} 
          onClick={() => onTabChange("accessibility")}
        />
        <NavItem 
          icon={<Puzzle className="w-4 h-4" />} 
          label="Extension" 
          active={activeTab === "extension"} 
          onClick={() => onTabChange("extension")}
        />
        <NavItem 
          icon={<Settings className="w-4 h-4" />} 
          label="Settings" 
          active={activeTab === "settings"} 
          onClick={() => onTabChange("settings")}
        />

        {/* Extension Bundle Download link */}
        <a 
          href="/BioAdaptiveExtension.zip?v=1.1" 
          download
          className="mt-6 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] text-white/80 hover:text-white transition-all text-xs font-semibold"
        >
          <Download className="w-4 h-4 text-violet-400" />
          <span>Download Extension</span>
        </a>
      </nav>

      {/* Privacy Indicator (Subtle & Trustworthy) */}
      <div className="my-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-tight">
          <strong className="text-white font-semibold">Privacy-First</strong><br />
          Raw video processed locally. Only derived telemetry is transmitted.
        </p>
      </div>

      {/* Account / User Footer (Generic Authenticated Identity) */}
      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-none">Demo User</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-none">Pro Account</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          title="Logout"
          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all w-full text-left",
        active 
          ? "bg-violet-500/15 text-violet-300 border border-violet-500/30" 
          : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
      )}
    >
      <span className={cn(active ? "text-violet-400" : "text-slate-400")}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
