"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Users,
  UserPlus,
  Plus,
  Trash2,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Loader2,
} from "lucide-react"

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#f43f5e", // rose
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // purple
]

interface Child {
  id: string
  name: string
  color: string
}

type Mode = "idle" | "create" | "join"

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [mode, setMode] = useState<Mode>("idle")

  // Step 1 – create
  const [familyName, setFamilyName] = useState("")

  // Step 1 – join
  const [joinCode, setJoinCode] = useState("")

  // Step 2 – children
  const [children, setChildren] = useState<Child[]>([
    { id: crypto.randomUUID(), name: "", color: PRESET_COLORS[0] },
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─── Step 1 handlers ─────────────────────────────────────────────────────────

  function handleModeSelect(selected: Mode) {
    setMode(selected)
    setError(null)
  }

  function handleStep1Next() {
    setError(null)
    if (mode === "create") {
      if (!familyName.trim()) {
        setError("Zadejte název rodiny.")
        return
      }
      setStep(2)
    } else if (mode === "join") {
      // Join via code is not yet implemented
      setError("Připojení přes kód bude brzy dostupné. Zatím prosím vytvořte novou rodinu.")
    }
  }

  // ─── Step 2 handlers ─────────────────────────────────────────────────────────

  function addChild() {
    setChildren((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        color: PRESET_COLORS[prev.length % PRESET_COLORS.length],
      },
    ])
  }

  function removeChild(id: string) {
    setChildren((prev) => prev.filter((c) => c.id !== id))
  }

  function updateChild(id: string, field: "name" | "color", value: string) {
    setChildren((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  async function handleSubmit() {
    setError(null)

    const validChildren = children.filter((c) => c.name.trim().length > 0)
    if (validChildren.length === 0) {
      setError("Přidejte alespoň jedno dítě se jménem.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyName: familyName.trim(),
          children: validChildren.map((c) => ({ name: c.name.trim(), color: c.color })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Nepodařilo se vytvořit rodinu.")
        setLoading(false)
        return
      }

      setStep(3)
    } catch {
      setError("Chyba připojení. Zkuste to prosím znovu.")
      setLoading(false)
    }
  }

  // ─── Step 3 ───────────────────────────────────────────────────────────────────

  function handleFinish() {
    router.push("/dashboard")
    router.refresh()
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">CoParent Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Nastavení rodiny</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                step === s
                  ? "w-8 bg-indigo-600"
                  : step > s
                  ? "w-2 bg-indigo-400"
                  : "w-2 bg-slate-200"
              )}
            />
          ))}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Začínáme</h2>
            <p className="text-slate-500 text-sm mb-6">Vytvořte novou rodinu nebo se připojte k existující.</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => handleModeSelect("create")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  mode === "create"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    mode === "create" ? "bg-indigo-100" : "bg-slate-100"
                  )}
                >
                  <Users size={20} />
                </div>
                <span className="text-sm font-semibold text-center leading-tight">Vytvořit rodinu</span>
              </button>

              <button
                onClick={() => handleModeSelect("join")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  mode === "join"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    mode === "join" ? "bg-indigo-100" : "bg-slate-100"
                  )}
                >
                  <UserPlus size={20} />
                </div>
                <span className="text-sm font-semibold text-center leading-tight">Připojit se k rodině</span>
              </button>
            </div>

            {mode === "create" && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Název rodiny
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStep1Next()}
                  placeholder="např. Rodina Novákovi"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
            )}

            {mode === "join" && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Kód pozvánky
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Zadejte kód pozvánky"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
            )}

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleStep1Next}
              disabled={mode === "idle"}
              className={cn(
                "w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                mode !== "idle"
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-[0.98]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              Pokračovat
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <button
              onClick={() => { setStep(1); setError(null) }}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm mb-4 transition-colors"
            >
              <ArrowLeft size={14} />
              Zpět
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Děti</h2>
            <p className="text-slate-500 text-sm mb-6">Přidejte děti, které sdílíte s druhým rodičem.</p>

            <div className="space-y-3 mb-4">
              {children.map((child, idx) => (
                <div
                  key={child.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  {/* Color picker */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded-full shadow-sm cursor-pointer border-2 border-white ring-2"
                      style={{ backgroundColor: child.color }}
                    />
                    <select
                      value={child.color}
                      onChange={(e) => updateChild(child.id, "color", e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      aria-label={`Barva dítěte ${idx + 1}`}
                    >
                      {PRESET_COLORS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Name input */}
                  <input
                    type="text"
                    value={child.name}
                    onChange={(e) => updateChild(child.id, "name", e.target.value)}
                    placeholder={`Jméno dítěte ${idx + 1}`}
                    className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                  />

                  {/* Remove button */}
                  {children.length > 1 && (
                    <button
                      onClick={() => removeChild(child.id)}
                      className="p-1 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                      aria-label="Odebrat dítě"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Color swatches shown below the children list */}
            {children.map((child) => (
              <div key={`swatches-${child.id}`} className="hidden">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    style={{ backgroundColor: c }}
                    onClick={() => updateChild(child.id, "color", c)}
                  />
                ))}
              </div>
            ))}

            <button
              onClick={addChild}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 text-sm font-medium flex items-center justify-center gap-2 transition-colors mb-5"
            >
              <Plus size={16} />
              Přidat dítě
            </button>

            {/* Color picker UI — visible swatches per child */}
            {children.length > 0 && (
              <div className="mb-5 space-y-3">
                {children.map((child, idx) => (
                  <div key={`color-${child.id}`}>
                    <p className="text-xs text-slate-400 mb-1.5 font-medium">
                      Barva {child.name || `Dítě ${idx + 1}`}
                    </p>
                    <div className="flex gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => updateChild(child.id, "color", c)}
                          className={cn(
                            "w-7 h-7 rounded-full transition-all",
                            child.color === c
                              ? "ring-2 ring-offset-2 scale-110"
                              : "hover:scale-105"
                          )}
                          style={{ backgroundColor: c }}
                          aria-label={`Barva ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Vytvářím rodinu…
                </>
              ) : (
                <>
                  Vytvořit rodinu
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Vše je připraveno!</h2>
            <p className="text-slate-500 text-sm mb-2">
              Rodina <strong className="text-slate-700">{familyName}</strong> byla úspěšně vytvořena.
            </p>
            <p className="text-slate-400 text-xs mb-8">
              Nyní můžete začít sledovat péči o děti, výdaje a aktivity.
            </p>
            <button
              onClick={handleFinish}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
            >
              Jdeme na to! 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
