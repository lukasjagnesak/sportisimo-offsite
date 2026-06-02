'use client'

import type { ReactNode } from 'react'

// Thin client wrapper so the server page can pass client-interactive children
export default function StoriesClient({ children }: { children: ReactNode }) {
  return <>{children}</>
}
