import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a1a]">
      {/* Stars background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.8) 0%, transparent 100%),
            radial-gradient(1px 1px at 25% 40%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 40% 5%, rgba(255,255,255,0.9) 0%, transparent 100%),
            radial-gradient(1px 1px at 55% 60%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.8) 0%, transparent 100%),
            radial-gradient(1px 1px at 85% 45%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 15% 70%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 30% 85%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 90%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 78% 75%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(2px 2px at 5% 50%, rgba(167,139,250,0.6) 0%, transparent 100%),
            radial-gradient(2px 2px at 90% 10%, rgba(167,139,250,0.5) 0%, transparent 100%),
            radial-gradient(2px 2px at 50% 30%, rgba(196,181,253,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 35% 55%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 65% 35%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 80% 65%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 20% 25%, rgba(255,255,255,0.8) 0%, transparent 100%),
            radial-gradient(1px 1px at 45% 80%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 95% 55%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 3% 88%, rgba(255,255,255,0.5) 0%, transparent 100%)
          `,
        }}
      />
      {/* Nebula glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-900/15 rounded-full blur-3xl" />
      </div>

      {/* Moon decoration */}
      <div className="absolute top-8 right-16 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200 shadow-[0_0_40px_rgba(251,191,36,0.3)] opacity-70" />

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {children}
      </div>
    </div>
  )
}
