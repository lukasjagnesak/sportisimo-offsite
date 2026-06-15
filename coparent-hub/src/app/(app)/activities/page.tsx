"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, MapPin, X, Loader2 } from "lucide-react"
import { cn, DAY_NAMES } from "@/lib/utils"

interface Child {
  id: string
  name: string
  color: string
}

interface Member {
  id: string
  name: string
}

interface Activity {
  id: string
  name: string
  location: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  color: string
  childId: string
  child: { id: string; name: string; color: string }
}

const FULL_DAY_NAMES = [
  "Neděle",
  "Pondělí",
  "Úterý",
  "Středa",
  "Čtvrtek",
  "Pátek",
  "Sobota",
]

const ACTIVITY_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
]

// Days sorted Mon–Sun for display (1,2,3,4,5,6,0)
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [children, setChildren] = useState<Child[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newActivity, setNewActivity] = useState({
    name: "",
    location: "",
    dayOfWeek: 1,
    startTime: "15:00",
    endTime: "16:30",
    color: "#6366f1",
    childId: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [actRes, famRes] = await Promise.all([
        fetch("/api/activities"),
        fetch("/api/family"),
      ])
      const act = await actRes.json()
      const fam = await famRes.json()
      setActivities(act.activities ?? [])
      setChildren(fam.children ?? [])
      setMembers(fam.members ?? [])
      if (fam.children?.length > 0) {
        setNewActivity((prev) =>
          prev.childId ? prev : { ...prev, childId: fam.children[0].id }
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!newActivity.name || !newActivity.childId) return
    setSaving(true)
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newActivity),
      })
      if (res.ok) {
        setShowAddSheet(false)
        setNewActivity({
          name: "",
          location: "",
          dayOfWeek: 1,
          startTime: "15:00",
          endTime: "16:30",
          color: "#6366f1",
          childId: children[0]?.id ?? "",
        })
        fetchData()
      }
    } finally {
      setSaving(false)
    }
  }

  // Group activities by dayOfWeek
  const byDay: Record<number, Activity[]> = {}
  for (const act of activities) {
    if (!byDay[act.dayOfWeek]) byDay[act.dayOfWeek] = []
    byDay[act.dayOfWeek].push(act)
  }
  // Sort each day's activities by startTime
  for (const day of Object.keys(byDay)) {
    byDay[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  // All activities sorted by dayOfWeek (Mon first) then startTime
  const sortedActivities = [...activities].sort((a, b) => {
    const normA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek
    const normB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek
    if (normA !== normB) return normA - normB
    return a.startTime.localeCompare(b.startTime)
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Kroužky & Aktivity</h1>
            <p className="text-indigo-200 text-sm mt-0.5">Týdenní rozvrh kroužků</p>
          </div>
          <button
            onClick={() => setShowAddSheet(true)}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm text-white rounded-2xl flex items-center justify-center active:scale-95"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-indigo-600" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-5xl mb-4">🎯</p>
            <p className="font-semibold text-slate-600 text-lg">Žádné kroužky</p>
            <p className="text-sm mt-1">Přidejte první aktivitu tlačítkem +</p>
          </div>
        ) : (
          <>
            {/* Weekly schedule – horizontal scroll */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Týdenní rozvrh
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {WEEK_ORDER.map((day) => {
                  const dayActivities = byDay[day] ?? []
                  return (
                    <div
                      key={day}
                      className={cn(
                        "flex-shrink-0 w-28 rounded-2xl p-3 border",
                        dayActivities.length > 0
                          ? "bg-white border-slate-100 shadow-sm"
                          : "bg-slate-100 border-transparent"
                      )}
                    >
                      <p
                        className={cn(
                          "text-xs font-bold mb-2",
                          dayActivities.length > 0 ? "text-indigo-600" : "text-slate-400"
                        )}
                      >
                        {DAY_NAMES[day]}
                      </p>
                      {dayActivities.length === 0 ? (
                        <p className="text-xs text-slate-300">–</p>
                      ) : (
                        <div className="space-y-1.5">
                          {dayActivities.map((act) => (
                            <div
                              key={act.id}
                              className="rounded-lg px-2 py-1"
                              style={{ backgroundColor: act.color + "20" }}
                            >
                              <p
                                className="text-xs font-semibold leading-tight truncate"
                                style={{ color: act.color }}
                              >
                                {act.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {act.startTime}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* All activities list */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Všechny aktivity
              </h2>
              <div className="space-y-3">
                {sortedActivities.map((act) => (
                  <div
                    key={act.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 flex overflow-hidden"
                  >
                    {/* Left colored bar */}
                    <div
                      className="w-1.5 flex-shrink-0"
                      style={{ backgroundColor: act.color }}
                    />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 truncate">
                            {act.name}
                          </h3>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {FULL_DAY_NAMES[act.dayOfWeek]}{" "}
                            {act.startTime}–{act.endTime}
                          </p>
                          {act.location && (
                            <div className="flex items-center gap-1 mt-1.5 text-slate-400">
                              <MapPin size={12} />
                              <span className="text-xs">{act.location}</span>
                            </div>
                          )}
                        </div>
                        <span
                          className="inline-flex flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor: act.child.color + "20",
                            color: act.child.color,
                          }}
                        >
                          {act.child.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-95"
      >
        <Plus size={24} />
      </button>

      {/* Add Activity bottom sheet */}
      {showAddSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end"
          onClick={() => setShowAddSheet(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900">Přidat aktivitu</h3>
              <button
                onClick={() => setShowAddSheet(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Název
                </label>
                <input
                  type="text"
                  value={newActivity.name}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, name: e.target.value })
                  }
                  placeholder="Fotbal, tanec, plavání..."
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Day of week */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Den v týdnu
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {WEEK_ORDER.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setNewActivity({ ...newActivity, dayOfWeek: day })
                      }
                      className={cn(
                        "py-2 rounded-lg text-xs font-medium transition-all",
                        newActivity.dayOfWeek === day
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {DAY_NAMES[day]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Začátek
                  </label>
                  <input
                    type="time"
                    value={newActivity.startTime}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, startTime: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Konec
                  </label>
                  <input
                    type="time"
                    value={newActivity.endTime}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, endTime: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Místo
                </label>
                <input
                  type="text"
                  value={newActivity.location}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, location: e.target.value })
                  }
                  placeholder="Sportovní hala, Sokol..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Barva
                </label>
                <div className="flex gap-3">
                  {ACTIVITY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewActivity({ ...newActivity, color })}
                      className={cn(
                        "w-9 h-9 rounded-full transition-all",
                        newActivity.color === color &&
                          "ring-2 ring-offset-2 ring-slate-500 scale-110"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Child selector */}
              {children.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Dítě
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {children.map((child) => (
                      <label key={child.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="childId"
                          value={child.id}
                          checked={newActivity.childId === child.id}
                          onChange={() =>
                            setNewActivity({ ...newActivity, childId: child.id })
                          }
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            "inline-flex px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                            newActivity.childId === child.id
                              ? "text-white border-transparent"
                              : "bg-white text-slate-600 border-slate-200"
                          )}
                          style={
                            newActivity.childId === child.id
                              ? { backgroundColor: child.color }
                              : {}
                          }
                        >
                          {child.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                {saving ? "Ukládám..." : "Přidat aktivitu"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
