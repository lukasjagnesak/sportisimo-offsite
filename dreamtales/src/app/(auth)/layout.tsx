import type { ReactNode } from 'react'
import { Logo } from '@/components/layout/header'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-mist dark:bg-midnight">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-blossom/30 dark:bg-blossom/10 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-cloud/40 dark:bg-cloud/10 blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-lavender/25 dark:bg-lavender/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <div className="flex justify-center mb-8">
          <Logo href="/" />
        </div>
        {children}
      </div>
    </div>
  )
}
