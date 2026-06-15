"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, Wallet, Star, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Přehled", icon: Home },
  { href: "/calendar", label: "Kalendář", icon: Calendar },
  { href: "/expenses", label: "Výdaje", icon: Wallet },
  { href: "/activities", label: "Aktivity", icon: Star },
  { href: "/settings", label: "Nastavení", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-lg">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative",
                active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-b-full" />
              )}
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className={cn("text-[10px] font-medium", active ? "text-indigo-600" : "text-slate-400")}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
      <div className="h-safe-bottom" style={{ height: "env(safe-area-inset-bottom)" }} />
    </nav>
  )
}
