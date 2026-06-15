"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, MapPin, Clock, X, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { cn, formatDate, formatShortDate, SCHOOL_EVENT_TYPES } from "@/lib/utils"

interface Child {
  id: string
  name: string
  color: string
}

interface SchoolEvent {
  id: string
  name: string
  description: string | null
  date: string
  startTime: string | null
  endTime: string | null
  type: string
  location: string | null
  childId: string
  child: { id: string; name: string; color: string }
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  TRIP: "#10b981",
  MEETING: "#3b82f6",
  PHOTO: "#8b5cf6",
  EXCURSION: "#f97316",
  PERFORMANCE: "#ec4899",
  OTHER: "#64748b",
}

export default function SchoolPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPast, setShowPast] = useState(false)

  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    type: "OTHER",
    location: "",
    childId: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [evRes, famRes] = await Promise.all([
        fetch("/api/school-events"),
        fetch("/api/family"),
      ])
      const ev = await evRes.json()
      const fam = await famRes.json()
      setEvents(ev.events ?? [])
      setChildren(fam.children ?? [])
      if (fam.children?.length > 0) {
        setNewEvent((prev) =>
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcoming = events
    .filter((e) => new Date(e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const past = events
    .filter((e) => new Date(e.date) < today)
    .sort((a, b) => b.date.localeCompare(a.date))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!newEvent.name || !newEvent.childId) return
    setSaving(true)
    try {
      const res = await fetch("/api/school-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvent,
          startTime: newEvent.startTime || null,
          endTime: newEvent.endTime || null,
          description: newEvent.description || null,
          location: newEvent.location || null,
        }),
      })
      if (res.ok) {
        setShowAddSheet(false)
        setNewEvent({
          name: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          startTime: "",
          endTime: "",
          type: "OTHER",
          location: "",
          childId: children[0]?.id ?? "",
        })
        fetchData()
      }
    } finally {
      setSaving(false)
    }
  }

  function EventCard({ event, isPast }: { event: SchoolEvent; isPast?: boolean }) {
    const type = SCHOOL_EVENT_TYPES.find((t) => t.value === event.type)
    const typeColor = EVENT_TYPE_COLORS[event.type] ?? "#64748b"
    const eventDate = new Date(event.date)
    const dayNum = eventDate.getDate()
    const shortDate = formatShortDate(event.date)
    // Extract month abbreviation from short date (e.g. "15. čvn" → "čvn")
    const monthAbbr = shortDate.replace(/^\d+\.\s*/, "")

    const daysUntil = Math.ceil(
      (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    return (
      <div
        className={cn(
          "bg-white rounded-2xl shadow-sm border border-slate-100 flex overflow-hidden",
          isPast && "opacity-60"
        )}
      >
        {/* Date column */}
        <div
          className="flex-shrink-0 w-16 flex flex-col items-center justify-center py-4 px-2"
          style={{ backgroundColor: typeColor + "15" }}
        >
          <span
            className="text-2xl font-bold leading-none"
            style={{ color: typeColor }}
          >
            {dayNum}
          </span>
          <span className="text-xs font-medium mt-0.5" style={{ color: typeColor }}>
            {monthAbbr}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{type?.icon ?? "📅"}</span>
                <h3 className="font-bold text-slate-900 truncate">{event.name}</h3>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: event.child.color + "20",
                    color: event.child.color,
                  }}
                >
                  {event.child.name}
                </span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: typeColor + "15", color: typeColor }}
                >
                  {type?.label ?? event.type}
                </span>
              </div>
            </div>
            {!isPast && daysUntil >= 0 && daysUntil <= 7 && (
              <span className="flex-shrink-0 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                za {daysUntil === 0 ? "dnes" : `${daysUntil}d`}
              </span>
            )}
          </div>

          {(event.startTime || event.endTime) && (
            <div className="flex items-center gap-1 mt-2 text-slate-400">
              <Clock size={12} />
              <span className="text-xs">
                {event.startTime}
                {event.endTime ? `–${event.endTime}` : ""}
              </span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-1 mt-1 text-slate-400">
              <MapPin size={12} />
              <span className="text-xs">{event.location}</span>
            </div>
          )}

          {event.description && (
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {event.description}
            </p>
          )}

          <p className="text-xs text-slate-400 mt-2">{formatDate(event.date)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-500 px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Školní akce</h1>
            <p className="text-amber-100 text-sm mt-0.5">Přehled školních akcí a událostí</p>
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
            <Loader2 size={28} className="animate-spin text-amber-500" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-5xl mb-4">🏫</p>
            <p className="font-semibold text-slate-600 text-lg">Žádné školní akce</p>
            <p className="text-sm mt-1">Přidejte první akci tlačítkem +</p>
          </div>
        ) : (
          <>
            {/* Upcoming events */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Nadcházející akce
              </h2>
              {upcoming.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-slate-100">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-sm font-medium">Žádné nadcházející akce</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>

            {/* Past events */}
            {past.length > 0 && (
              <div>
                <button
                  onClick={() => setShowPast(!showPast)}
                  className="flex items-center gap-2 text-sm text-slate-500 font-medium hover:text-slate-700 transition-colors mb-3"
                >
                  {showPast ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                  {showPast ? "Skrýt" : "Zobrazit"} minulé akce ({past.length})
                </button>
                {showPast && (
                  <div className="space-y-3">
                    {past.map((event) => (
                      <EventCard key={event.id} event={event} isPast />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full shadow-xl flex items-center justify-center active:scale-95"
      >
        <Plus size={24} />
      </button>

      {/* Add School Event bottom sheet */}
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
              <h3 className="text-lg font-bold text-slate-900">Přidat školní akci</h3>
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
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  placeholder="Název akce"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Typ akce
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SCHOOL_EVENT_TYPES.map((t) => {
                    const tColor = EVENT_TYPE_COLORS[t.value] ?? "#64748b"
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, type: t.value })}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all",
                          newEvent.type === t.value
                            ? "border-transparent"
                            : "bg-slate-50 border-slate-100 text-slate-600"
                        )}
                        style={
                          newEvent.type === t.value
                            ? { backgroundColor: tColor + "20", borderColor: tColor, color: tColor }
                            : {}
                        }
                      >
                        <span className="text-xl">{t.icon}</span>
                        <span className="text-center leading-tight">{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Začátek
                  </label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, startTime: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Konec
                  </label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, endTime: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  value={newEvent.location}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, location: e.target.value })
                  }
                  placeholder="Škola, sportovní hala..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Poznámka
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  placeholder="Dodatečné informace..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
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
                          checked={newEvent.childId === child.id}
                          onChange={() =>
                            setNewEvent({ ...newEvent, childId: child.id })
                          }
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            "inline-flex px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                            newEvent.childId === child.id
                              ? "text-white border-transparent"
                              : "bg-white text-slate-600 border-slate-200"
                          )}
                          style={
                            newEvent.childId === child.id
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
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                {saving ? "Ukládám..." : "Přidat akci"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
