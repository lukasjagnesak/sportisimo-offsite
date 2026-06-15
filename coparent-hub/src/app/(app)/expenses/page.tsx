"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, ChevronLeft, ChevronRight, Camera, X, Loader2 } from "lucide-react"
import { cn, formatCurrency, formatDate, EXPENSE_CATEGORIES, MONTH_NAMES } from "@/lib/utils"

interface Child {
  id: string
  name: string
  color: string
}

interface Expense {
  id: string
  amount: number
  category: string
  description: string | null
  date: string
  receiptUrl: string | null
  child: { id: string; name: string; color: string } | null
}

export default function ExpensesPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    amount: "",
    category: "other",
    description: "",
    date: new Date().toISOString().split("T")[0],
    childId: "",
    receiptUrl: "",
  })
  const [saving, setSaving] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [expRes, famRes] = await Promise.all([
        fetch(`/api/expenses?year=${year}&month=${month + 1}`),
        fetch("/api/family"),
      ])
      const exp = await expRes.json()
      const fam = await famRes.json()
      setExpenses(exp.expenses ?? [])
      setChildren(fam.children ?? [])
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    ...cat,
    amount: expenses.filter((e) => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.amount > 0)

  // Group by date
  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    const d = e.date.split("T")[0]
    if (!acc[d]) acc[d] = []
    acc[d].push(e)
    return acc
  }, {})

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.category) return
    setSaving(true)
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          category: form.category,
          description: form.description || null,
          date: form.date,
          childId: form.childId || null,
          receiptUrl: form.receiptUrl || null,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ amount: "", category: "other", description: "", date: new Date().toISOString().split("T")[0], childId: "", receiptUrl: "" })
        fetchData()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <h2 className="text-lg font-bold text-slate-900">{MONTH_NAMES[month]} {year}</h2>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center"
        >
          <ChevronRight size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Total card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-indigo-200 text-sm font-medium mb-1">Celkové výdaje</p>
        <p className="text-4xl font-bold">{formatCurrency(total)}</p>
        <p className="text-indigo-300 text-sm mt-1">{expenses.length} položek</p>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {byCategory.map((cat) => (
              <span
                key={cat.value}
                className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1 text-xs font-medium"
              >
                {cat.icon} {formatCurrency(cat.amount)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expense list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-indigo-600" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-3">💰</p>
          <p className="font-medium">Žádné výdaje tento měsíc</p>
          <p className="text-sm mt-1">Přidejte první výdaj tlačítkem níže</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, items]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  {formatDate(date)}
                </p>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
                  {items.map((expense) => {
                    const cat = EXPENSE_CATEGORIES.find((c) => c.value === expense.category)
                    return (
                      <div key={expense.id} className="flex items-center gap-3 p-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: (cat?.color ?? "#6b7280") + "15" }}
                        >
                          {cat?.icon ?? "📦"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">
                            {expense.description || cat?.label}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {expense.child && (
                              <span
                                className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: expense.child.color + "20",
                                  color: expense.child.color,
                                }}
                              >
                                {expense.child.name}
                              </span>
                            )}
                            {expense.receiptUrl && (
                              <span className="text-xs text-slate-400 flex items-center gap-0.5">
                                <Camera size={10} /> Účtenka
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 flex-shrink-0">
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-all"
      >
        <Plus size={24} />
      </button>

      {/* Add expense sheet */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setShowForm(false)}>
          <div
            className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-6" />
              <h3 className="text-lg font-bold text-slate-900">Přidat výdaj</h3>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Částka (Kč)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kategorie</label>
                <div className="grid grid-cols-4 gap-2">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.value })}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                        form.category === cat.value
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                      )}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-xs text-center leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Popis (volitelné)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Např. Kopačky Nike"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Datum</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {children.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Dítě</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, childId: "" })}
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                        !form.childId ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200"
                      )}
                    >
                      Vše
                    </button>
                    {children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setForm({ ...form, childId: child.id })}
                        className={cn(
                          "px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                          form.childId === child.id ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200"
                        )}
                        style={form.childId === child.id ? { backgroundColor: child.color } : {}}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL účtenky (volitelné)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.receiptUrl}
                    onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    className="px-3 py-3 rounded-xl bg-slate-100 text-slate-600 flex items-center gap-1.5"
                  >
                    <Camera size={18} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-base shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                {saving ? "Ukládám..." : "Uložit výdaj"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
