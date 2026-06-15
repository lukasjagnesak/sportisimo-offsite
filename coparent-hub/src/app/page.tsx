import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function LandingPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-5" />
        <div className="max-w-md mx-auto px-6 pt-16 pb-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <span className="text-4xl">👨‍👩‍👧‍👦</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">CoParent Hub</h1>
          <p className="text-lg text-slate-600 mb-8">
            Sdílená péče o děti – vše na jednom místě pro celou rodinu
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/signin"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 text-center"
            >
              Přihlásit se
            </Link>
            <Link
              href="/auth/register"
              className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-semibold text-lg border-2 border-indigo-200 hover:border-indigo-400 transition-all active:scale-95 text-center"
            >
              Vytvořit účet
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-md mx-auto px-6 py-8 space-y-4">
        {[
          {
            icon: "📅",
            title: "Kalendář péče",
            desc: "Vizuální přehled kdy jsou děti u koho. Počítání nocí za měsíc.",
          },
          {
            icon: "💰",
            title: "Výdaje & Výživné",
            desc: "Evidence nákladů s kategoriemi, foto účtenek a přehled za měsíc.",
          },
          {
            icon: "🎯",
            title: "Kroužky & Aktivity",
            desc: "Plánování kroužků, kdo veze, kde a kdy. Připomínky.",
          },
          {
            icon: "🏫",
            title: "Školní akce",
            desc: "Škola v přírodě, třídní schůzky, focení a výlety na jednom místě.",
          },
          {
            icon: "🔔",
            title: "Telegram notifikace",
            desc: "Push notifikace přímo do Telegramu pro celou rodinu.",
          },
          {
            icon: "👨‍👩‍👧",
            title: "Sdílení s rodinou",
            desc: "Pozvěte prarodiče a ostatní členy rodiny do aplikace.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 items-start"
          >
            <span className="text-3xl">{f.icon}</span>
            <div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="h-8" />
    </div>
  )
}
