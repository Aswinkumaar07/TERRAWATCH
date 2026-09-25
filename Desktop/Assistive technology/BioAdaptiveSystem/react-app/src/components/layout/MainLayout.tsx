import { GlowyWavesBackground } from "@/components/ui/glowy-waves-background"
import { Sidebar } from "./Sidebar"
import { TabType } from "@/App"

interface MainLayoutProps {
  children: React.ReactNode
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onLogout: () => void
}

export function MainLayout({ children, activeTab, onTabChange, onLogout }: MainLayoutProps) {
  return (
    <div className="relative h-screen w-full flex bg-[#090D16] text-[#F8FAFC] font-sans overflow-hidden">
      {/* Background Waves (Soft Ambient Overlay) */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <GlowyWavesBackground />
      </div>
      
      {/* Dark Scrim overlay for readability */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#090D16]/90 via-[#090D16]/80 to-[#090D16] pointer-events-none" />

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} />

      {/* Main Content Pane */}
      <main className="flex-1 h-full overflow-y-auto relative z-10 custom-scrollbar">
        <div className="p-8 max-w-[1240px] mx-auto min-h-screen flex flex-col">
          {children}
          
          {/* Footer Accent */}
          <div className="mt-auto pt-10 pb-6 text-center text-xs text-slate-500 font-medium">
            &copy; 2026 BioAdaptive Systems. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  )
}
