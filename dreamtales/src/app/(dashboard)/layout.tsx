import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from './_components/sidebar'
import DashboardTopBar from './_components/topbar'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, subscription_plan, subscription_status')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name || user.email || 'User'

  return (
    <div className="min-h-screen bg-mist dark:bg-midnight text-slate-700 dark:text-slate-200 flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopBar displayName={displayName} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
