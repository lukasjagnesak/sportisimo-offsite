"use client"

import { useState, useEffect, useCallback } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LogOut, Send, UserPlus, Loader2, RefreshCw, Check, Pencil, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserProfile {
  id: string
  name: string | null
  email: string
  role: string
  telegramChatId: string | null
}

interface Member {
  id: string
  name: string | null
  email: string
  role: string
}

interface Child {
  id: string
  name: string
  color: string
}

interface Family {
  id: string
  name: string
  members: Member[]
  children: Child[]
}

export default function SettingsPage() {
  const router = useRouter()
  const [family, setFamily] = useState<Family | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("PARENT")
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [telegramId, setTelegramId] = useState("")
  const [savingTelegram, setSavingTelegram] = useState(false)
  const [telegramSaved, setTelegramSaved] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedSuccess, setSeedSuccess] = useState(false)
  // Inline name editing
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const [savingName, setSavingName] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [userRes, familyRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/family"),
      ])
      if (userRes.ok) {
        const userData = await userRes.json()
        setCurrentUser(userData.user)
        setNameInput(userData.user.name ?? "")
        setTelegramId(userData.user.telegramChatId ?? "")
      }
      if (familyRes.ok) {
        const familyData = await familyRes.json()
        setFamily(familyData.id ? familyData : null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return
    setInviting(true)
    try {
      await fetch("/api/family/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      setInviteSuccess(true)
      setInviteEmail("")
      setTimeout(() => setInviteSuccess(false), 3000)
    } finally {
      setInviting(false)
    }
  }

  async function handleSaveTelegram() {
    setSavingTelegram(true)
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramChatId: telegramId }),
      })
      setTelegramSaved(true)
      setCurrentUser((prev) => prev ? { ...prev, telegramChatId: telegramId || null } : prev)
      setTimeout(() => setTelegramSaved(false), 3000)
    } finally {
      setSavingTelegram(false)
    }
  }

  async function handleSaveName() {
    if (!nameInput.trim()) return
    setSavingName(true)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setCurrentUser((prev) => prev ? { ...prev, name: data.user.name } : prev)
        setEditingName(false)
      }
    } finally {
      setSavingName(false)
    }
  }

  async function handleSeedData() {
    setSeeding(true)
    try {
      await fetch("/api/seed", { method: "POST" })
      setSeedSuccess(true)
      setTimeout(() => {
        setSeedSuccess(false)
        router.refresh()
      }, 2000)
    } finally {
      setSeeding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="px-4 py-5 space-y-5">
      <h2 className="text-xl font-bold text-slate-900">Nastavení</h2>

      {/* Profile card */}
      {currentUser && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Profil</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
              {currentUser.name
                ? currentUser.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                : currentUser.email[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName()
                      if (e.key === "Escape") { setEditingName(false); setNameInput(currentUser.name ?? "") }
                    }}
                    className="flex-1 text-sm font-semibold text-slate-900 border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {savingName ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNameInput(currentUser.name ?? "") }}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {currentUser.name ?? "—"}
                  </span>
                  <button
                    onClick={() => { setEditingName(true); setNameInput(currentUser.name ?? "") }}
                    className="p-1 text-slate-300 hover:text-indigo-500 transition-colors flex-shrink-0"
                    aria-label="Upravit jméno"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-400 truncate mt-0.5">{currentUser.email}</p>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex-shrink-0">
              {currentUser.role === "PARENT" ? "Rodič" : currentUser.role}
            </span>
          </div>
        </div>
      )}

      {/* Family info */}
      {family && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-4 py-4">
            <p className="text-indigo-200 text-xs font-medium">Rodina</p>
            <p className="text-white font-bold text-lg">{family.name}</p>
          </div>

          {/* Members */}
          <div className="p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Členové</p>
            <div className="space-y-3">
              {family.members.map((m) => {
                const initials = m.name
                  ? m.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                  : m.email?.[0]?.toUpperCase() ?? "?"
                const isCurrentUser = m.id === currentUser?.id
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {initials}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {m.name ?? m.email}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-indigo-600 font-normal">(vy)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">{m.email}</p>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      {m.role === "PARENT" ? "Rodič" : m.role}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Children */}
          <div className="px-4 pb-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Děti</p>
            <div className="flex gap-2 flex-wrap">
              {family.children.map((child) => (
                <span
                  key={child.id}
                  className="px-3 py-1.5 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: child.color }}
                >
                  {child.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invite member */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
            <UserPlus size={16} className="text-green-600" />
          </div>
          <p className="font-semibold text-slate-900">Pozvat člena rodiny</p>
        </div>
        <form onSubmit={handleInvite} className="space-y-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@priklad.cz"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="PARENT">Rodič</option>
            <option value="GRANDPARENT">Prarodič</option>
            <option value="OTHER">Ostatní</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
              inviteSuccess
                ? "bg-green-500 text-white"
                : "bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            )}
          >
            {inviteSuccess ? <Check size={16} /> : inviting ? <Loader2 size={16} className="animate-spin" /> : null}
            {inviteSuccess ? "Pozvánka odeslána!" : inviting ? "Odesílám..." : "Odeslat pozvánku"}
          </button>
        </form>
      </div>

      {/* Telegram */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center">
            <Send size={16} className="text-sky-600" />
          </div>
          <p className="font-semibold text-slate-900">Telegram notifikace</p>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Zadejte vaše Telegram Chat ID pro příjem push notifikací.{" "}
          <span className="text-sky-600 font-medium">Jak zjistit Chat ID →</span>
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            placeholder="123456789"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
          />
          <button
            onClick={handleSaveTelegram}
            disabled={savingTelegram}
            className={cn(
              "px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5",
              telegramSaved
                ? "bg-green-500 text-white"
                : "bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
            )}
          >
            {telegramSaved ? <Check size={16} /> : savingTelegram ? <Loader2 size={16} className="animate-spin" /> : null}
            {telegramSaved ? "Uloženo" : "Uložit"}
          </button>
        </div>
      </div>

      {/* Demo data */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <RefreshCw size={16} className="text-amber-600" />
          </div>
          <p className="font-semibold text-slate-900">Demo data</p>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Naplnit databázi ukázkovými daty pro vyzkoušení aplikace.
        </p>
        <button
          onClick={handleSeedData}
          disabled={seeding}
          className={cn(
            "w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
            seedSuccess
              ? "bg-green-500 text-white"
              : "bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
          )}
        >
          {seedSuccess ? <Check size={16} /> : seeding ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {seedSuccess ? "Data načtena!" : seeding ? "Načítám data..." : "Načíst demo data"}
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full py-4 rounded-2xl font-semibold text-red-600 bg-red-50 border border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors active:scale-95"
      >
        <LogOut size={18} />
        Odhlásit se
      </button>

      <div className="h-4" />
    </div>
  )
}
