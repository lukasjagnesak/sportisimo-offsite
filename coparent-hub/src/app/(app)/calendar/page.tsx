"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Moon } from "lucide-react"
import { cn, MONTH_NAMES, DAY_NAMES } from "@/lib/utils"
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, isSameMonth } from "date-fns"

interface Child {
  id: string
  name: string
  color: string
}

interface Member {
  id: string
  name: string
  role: string
}

interface CustodyDay {
  date: string
  parentId: string
  childId: string
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [children, setChildren] = useState<Child[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [custodyDays, setCustodyDays] = useState<CustodyDay[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [assignParentId, setAssignParentId] = useState<string>("")

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [famRes, custodyRes] = await Promise.all([
        fetch("/api/family"),
        fetch(`/api/custody?year=${year}&month=${month + 1}&childId=${selectedChild}`),
      ])
      const fam = await famRes.json()
      const custody = await custodyRes.json()
      setChildren(fam.children ?? [])
      setMembers(fam.members ?? [])
      if (!selectedChild && fam.children?.length > 0) {
        setSelectedChild(fam.children[0].id)
      }
      setCustodyDays(custody.days ?? [])
    } finally {
      setLoading(false)
    }
  }, [year, month, selectedChild])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = (getDay(monthStart) + 6) % 7 // Monday first

  const custodyMap: Record<string, string> = {}
  for (const cd of custodyDays) {
    if (!selectedChild || cd.childId === selectedChild) {
      custodyMap[cd.date.split("T")[0]] = cd.parentId
    }
  }

  const memberColors: Record<string, string> = {}
  members.forEach((m, i) => {
    memberColors[m.id] = i === 0 ? "#3b82f6" : "#f43f5e"
  })

  const nightsPerMember = members.map((m) => ({
    ...m,
    nights: Object.values(custodyMap).filter((pid) => pid === m.id).length,
    color: memberColors[m.id],
  }))

  async function assignCustody(date: Date, parentId: string) {
    if (!selectedChild || !parentId) return
    const dateStr = format(date, "yyyy-MM-dd")
    await fetch("/api/custody", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr, parentId, childId: selectedChild }),
    })
    setCustodyDays((prev) => {
      const filtered = prev.filter(
        (d) => !(d.date.startsWith(dateStr) && d.childId === selectedChild)
      )
      return [...filtered, { date: dateStr, parentId, childId: selectedChild }]
    })
    setSelectedDay(null)
  }

  return (
    <div className="px-4 py-5 space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-900">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Child selector */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child.id)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                selectedChild === child.id
                  ? "text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200"
              )}
              style={selectedChild === child.id ? { backgroundColor: child.color } : {}}
            >
              {child.name}
            </button>
          ))}
        </div>
      )}

      {/* Nights counter */}
      <div className="grid grid-cols-2 gap-3">
        {nightsPerMember.slice(0, 2).map((m) => (
          <div
            key={m.id}
            className="rounded-2xl p-3 flex items-center gap-3"
            style={{ backgroundColor: m.color + "15" }}
          >
            <Moon size={18} style={{ color: m.color }} />
            <div>
              <p className="text-xs text-slate-500">{m.name}</p>
              <p className="font-bold text-slate-900">
                {m.nights} <span className="text-xs font-normal text-slate-500">nocí</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="h-10" />
          ))}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd")
            const parentId = custodyMap[dateStr]
            const parentColor = parentId ? memberColors[parentId] : null
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

            return (
              <button
                key={dateStr}
                onClick={() => {
                  setSelectedDay(day)
                  setAssignParentId(parentId ?? "")
                }}
                className={cn(
                  "h-10 flex items-center justify-center relative transition-all",
                  isToday && "font-bold"
                )}
              >
                {parentColor && (
                  <div
                    className="absolute inset-1 rounded-lg opacity-80"
                    style={{ backgroundColor: parentColor + "30" }}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 w-7 h-7 flex items-center justify-center rounded-full text-sm",
                    isToday && "ring-2 ring-indigo-500 ring-offset-1",
                    parentColor ? "font-semibold" : "text-slate-600"
                  )}
                  style={parentColor ? { color: parentColor } : {}}
                >
                  {format(day, "d")}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        {nightsPerMember.slice(0, 2).map((m) => (
          <div key={m.id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: m.color + "60" }} />
            <span className="text-xs text-slate-500">{m.name}</span>
          </div>
        ))}
      </div>

      {/* Day assignment modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2" />
            <h3 className="text-lg font-bold text-slate-900 text-center">
              {format(selectedDay, "EEEE, d. MMMM")}
            </h3>
            <p className="text-sm text-slate-500 text-center">Vyberte kdo má dítě tuto noc</p>
            <div className="grid grid-cols-2 gap-3">
              {members.slice(0, 2).map((m, i) => {
                const color = i === 0 ? "#3b82f6" : "#f43f5e"
                const isSelected = assignParentId === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => assignCustody(selectedDay, m.id)}
                    className={cn(
                      "py-4 rounded-2xl font-semibold text-base transition-all active:scale-95",
                      isSelected ? "text-white shadow-lg" : "bg-slate-50 text-slate-700 border border-slate-200"
                    )}
                    style={isSelected ? { backgroundColor: color } : {}}
                  >
                    {m.name}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => assignCustody(selectedDay, "")}
              className="w-full py-3 rounded-xl text-slate-400 text-sm hover:text-slate-600 transition-colors"
            >
              Vymazat přiřazení
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
