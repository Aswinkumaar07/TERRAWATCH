import { GlowyWavesBackground } from "@/components/ui/glowy-waves-background"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Cpu, Shield, Sliders } from "lucide-react"

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin()
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#090D16] text-[#F8FAFC] font-sans p-6 overflow-hidden">
      {/* Soft background wave ambient lighting */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <GlowyWavesBackground />
      </div>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#090D16]/90 via-[#090D16]/80 to-[#090D16] pointer-events-none" />

      {/* Main Two-Column Container */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        
        {/* LEFT COLUMN: BRAND & VALUE PROP */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="BioAdaptive Logo" 
              className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(139,92,246,0.4)]" 
            />
            <span className="text-2xl font-bold tracking-tight text-white">
              BioAdaptive
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-violet-500/15 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded">
              PRO
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
              AI that adapts to you.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Real-time cognitive state estimation and adaptive digital accessibility.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <span>Cognitive-aware computing</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span>Privacy-first processing</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <span>Adaptive accessibility</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AUTHENTICATION PANEL */}
        <div className="bg-[#0D1322] border border-white/5 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Welcome back</h2>
            <p className="text-xs text-slate-400 mt-1">Sign in to continue to BioAdaptive.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-slate-300 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                defaultValue="demo@bioadaptive.ai"
                className="bg-[#090D16] border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-violet-500/50 text-xs py-2"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-slate-300 font-medium">Password</Label>
                <a href="#forgot" className="text-[11px] text-violet-400 hover:underline">Forgot?</a>
              </div>
              <Input
                id="password"
                type="password"
                defaultValue="••••••••"
                className="bg-[#090D16] border-white/10 text-white focus-visible:ring-violet-500/50 text-xs py-2"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold tracking-wide transition-all shadow-lg hover:shadow-violet-500/25 mt-2"
            >
              Sign In
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-slate-500">
              <span className="bg-[#0D1322] px-3">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogin}
            className="w-full py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          {/* Privacy Statement */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Privacy-first by design. Raw camera frames are processed locally.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
