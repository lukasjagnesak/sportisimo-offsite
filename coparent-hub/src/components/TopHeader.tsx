"use client"

import { User } from "next-auth"
import { Bell } from "lucide-react"

interface TopHeaderProps {
  user: User & { familyId?: string; role?: string }
  family: { name: string; children: { name: string }[] } | null | undefined
}

export function TopHeader({ user, family }: TopHeaderProps) {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "U"

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-base leading-tight">
            {family?.name ?? "CoParent Hub"}
          </h1>
          {family && (
            <p className="text-indigo-200 text-xs">
              {family.children.map((c) => c.name).join(", ")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <Bell size={18} />
          </button>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name ?? ""} className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
