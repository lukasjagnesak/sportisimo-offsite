import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatShortDate, EXPENSE_CATEGORIES, SCHOOL_EVENT_TYPES } from "@/lib/utils"
import { startOfMonth, endOfMonth, addDays } from "date-fns"
import Link from "next/link"
import { TrendingUp, Calendar, Star, School, ArrowRight } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      family: {
        include: {
          children: true,
          members: { select: { id: true, name: true, role: true } },
        },
      },
    },
  })

  if (!user?.family) return null

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const next7Days = addDays(now, 7)
  const next30Days = addDays(now, 30)

  const [expenses, custodyDays, activities, schoolEvents] = await Promise.all([
    prisma.expense.findMany({
      where: {
        paidById: user.id,
        date: { gte: monthStart, lte: monthEnd },
      },
      include: { child: { select: { name: true, color: true } } },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.custodyDay.findMany({
      where: {
        childId: { in: user.family.children.map((c) => c.id) },
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.activityEvent.findMany({
      where: {
        date: { gte: now, lte: next7Days },
        activity: { familyId: user.family.id },
      },
      include: {
        activity: { include: { child: { select: { name: true, color: true } } } },
        driver: { select: { name: true } },
      },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.schoolEvent.findMany({
      where: {
        familyId: user.family.id,
        date: { gte: now, lte: next30Days },
      },
      include: { child: { select: { name: true, color: true } } },
      orderBy: { date: "asc" },
      take: 5,
    }),
  ])

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  // Count nights per parent
  const nightsByParent: Record<string, number> = {}
  for (const day of custodyDays) {
    nightsByParent[day.parentId] = (nightsByParent[day.parentId] ?? 0) + 1
  }

  const memberNights = user.family.members.map((m) => ({
    ...m,
    nights: nightsByParent[m.id] ?? 0,
  }))

  const firstName = user.name?.split(" ")[0] ?? "příteli"

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Dobrý den, {firstName}! 👋</h2>
        <p className="text-slate-500 text-sm mt-0.5">{new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now)}</p>
      </div>

      {/* Nights per parent */}
      <div className="grid grid-cols-2 gap-3">
        {memberNights.slice(0, 2).map((member, i) => (
          <div
            key={member.id}
            className={`rounded-2xl p-4 text-white shadow-md ${
              i === 0
                ? "bg-gradient-to-br from-blue-500 to-blue-600"
                : "bg-gradient-to-br from-rose-500 to-rose-600"
            }`}
          >
            <p className="text-xs font-medium opacity-80 mb-1">{member.name}</p>
            <p className="text-3xl font-bold">{member.nights}</p>
            <p className="text-xs opacity-70 mt-0.5">nocí tento měsíc</p>
          </div>
        ))}
      </div>

      {/* Monthly expenses */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <TrendingUp size={16} className="text-indigo-600" />
            </div>
            <span className="font-semibold text-slate-900">Výdaje tento měsíc</span>
          </div>
          <Link href="/expenses" className="text-indigo-600 text-sm font-medium flex items-center gap-1">
            Vše <ArrowRight size={14} />
          </Link>
        </div>
        <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalExpenses)}</p>
        <div className="mt-3 space-y-2">
          {expenses.slice(0, 3).map((expense) => {
            const cat = EXPENSE_CATEGORIES.find((c) => c.value === expense.category)
            return (
              <div key={expense.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat?.icon ?? "📦"}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {expense.description || cat?.label}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatShortDate(expense.date)}
                      {expense.child ? ` · ${expense.child.name}` : ""}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming activities */}
      {activities.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <Star size={16} className="text-purple-600" />
              </div>
              <span className="font-semibold text-slate-900">Kroužky tento týden</span>
            </div>
            <Link href="/activities" className="text-indigo-600 text-sm font-medium flex items-center gap-1">
              Vše <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {activities.map((event) => (
              <div key={event.id} className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: event.activity.child.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{event.activity.name}</p>
                  <p className="text-xs text-slate-400">
                    {formatShortDate(event.date)} · {event.activity.startTime}–{event.activity.endTime}
                    {event.driver ? ` · Veze: ${event.driver.name}` : ""}
                  </p>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: event.activity.child.color + "20",
                    color: event.activity.child.color,
                  }}
                >
                  {event.activity.child.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming school events */}
      {schoolEvents.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <School size={16} className="text-amber-600" />
              </div>
              <span className="font-semibold text-slate-900">Školní akce</span>
            </div>
            <Link href="/school" className="text-indigo-600 text-sm font-medium flex items-center gap-1">
              Vše <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {schoolEvents.map((event) => {
              const type = SCHOOL_EVENT_TYPES.find((t) => t.value === event.type)
              return (
                <div key={event.id} className="flex items-center gap-3">
                  <span className="text-xl">{type?.icon ?? "📅"}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{event.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatShortDate(event.date)} · {event.child.name}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Rychlé akce</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/expenses", icon: "💰", label: "Výdaj", color: "bg-indigo-50 text-indigo-700" },
            { href: "/activities", icon: "🎯", label: "Aktivita", color: "bg-purple-50 text-purple-700" },
            { href: "/school", icon: "🏫", label: "Školní akce", color: "bg-amber-50 text-amber-700" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`${action.color} rounded-2xl p-3 text-center transition-all active:scale-95`}
            >
              <span className="text-2xl block mb-1">{action.icon}</span>
              <span className="text-xs font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
