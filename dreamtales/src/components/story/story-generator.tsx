'use client'

import { useState } from 'react'
import { Sparkles, Download, Mail, ChevronLeft, BookOpen, Clock } from 'lucide-react'
import { GENRES, READING_LENGTHS, type ReadingLength } from '@/types'
import { cn } from '@/lib/utils'

interface ChildOption {
  id: string
  name: string
  age: number | null
  gender: 'boy' | 'girl' | 'neutral'
  story_preferences?: {
    genres: string[]
    reading_length: number
  }[]
}

interface StoryResult {
  id: string
  title: string
  content: string
  genre: string
  pdf_url: string | null
  created_at: string
}

interface Props {
  children: ChildOption[]
}

const LOADING_MESSAGES = [
  'Vymýšlíme dobrodružství...',
  'Kreslíme postavičky...',
  'Tkaní magického příběhu...',
  'Přidáváme tajemství...',
  'Pohádka je skoro hotová...',
  'Dokončujeme poslední kapitolu...',
]

export default function StoryGenerator({ children }: Props) {
  const [selectedChild, setSelectedChild] = useState<string>(children[0]?.id ?? '')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [readingLength, setReadingLength] = useState<ReadingLength>(15)
  const [genreSearch, setGenreSearch] = useState('')

  const [loading, setLoading] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<StoryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const filteredGenres = GENRES.filter((g) =>
    genreSearch === '' ||
    g.name_cs.toLowerCase().includes(genreSearch.toLowerCase()) ||
    g.name.toLowerCase().includes(genreSearch.toLowerCase())
  )

  async function handleGenerate() {
    if (!selectedChild || !selectedGenre) return

    setLoading(true)
    setResult(null)
    setError(null)
    setProgress(0)
    setLoadingMsgIdx(0)
    setEmailSent(false)

    // Animate loading messages
    let msgInterval: ReturnType<typeof setInterval>
    let progressInterval: ReturnType<typeof setInterval>

    msgInterval = setInterval(() => {
      setLoadingMsgIdx((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1))
    }, 3500)

    progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p
        return p + Math.random() * 8
      })
    }, 800)

    try {
      const res = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChild,
          genre: selectedGenre,
          readingLength,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Generování se nezdařilo. Zkuste to znovu.')
      } else {
        setProgress(100)
        setResult(data.story)
      }
    } catch {
      setError('Připojení selhalo. Zkontrolujte internet a zkuste znovu.')
    } finally {
      clearInterval(msgInterval)
      clearInterval(progressInterval)
      setLoading(false)
    }
  }

  async function handleSendEmail() {
    if (!result) return
    setEmailSending(true)
    try {
      // POST to send-email endpoint (if available)
      await fetch(`/api/stories/${result.id}/send`, { method: 'POST' })
      setEmailSent(true)
    } finally {
      setEmailSending(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError(null)
    setSelectedGenre('')
    setProgress(0)
  }

  const genreData = GENRES.find((g) => g.id === selectedGenre)
  const childOption = children.find((c) => c.id === selectedChild)

  // ── Result view ────────────────────────────────────────────────────────
  if (result) {
    const preview = result.content.replace(/^#+\s*.+\n?/, '').slice(0, 300)
    return (
      <div className="space-y-5">
        {/* Success card */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <BookOpen size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-emerald-400 font-medium">Pohádka vygenerována</p>
              <h2 className="text-lg font-bold text-soft-white">{result.title}</h2>
            </div>
          </div>

          {/* Genre + length badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {genreData && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-purple/20 border border-purple/30 text-violet-300 rounded-full px-3 py-1">
                {genreData.emoji} {genreData.name_cs}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs bg-navy-mid border border-purple/20 text-muted rounded-full px-3 py-1">
              <Clock size={11} /> {readingLength} min
            </span>
          </div>

          {/* Preview */}
          <div className="relative rounded-xl bg-navy-mid/60 border border-purple/15 p-4 mb-4">
            <p className="text-sm text-muted leading-relaxed line-clamp-5">
              {preview}…
            </p>
            {/* Fade overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-navy-mid/60 to-transparent rounded-b-xl pointer-events-none" />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {result.pdf_url && (
              <a
                href={result.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-semibold px-4 py-2.5 text-sm transition shadow-lg shadow-purple/30"
              >
                <Download size={15} />
                Stáhnout PDF
              </a>
            )}
            <button
              onClick={handleSendEmail}
              disabled={emailSending || emailSent}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition',
                emailSent
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-default'
                  : 'border-purple/30 text-muted hover:text-soft-white hover:border-purple/50'
              )}
            >
              <Mail size={15} />
              {emailSent ? 'Odesláno!' : emailSending ? 'Odesílám...' : 'Odeslat e-mailem'}
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-purple/20 text-muted hover:text-soft-white hover:border-purple/40 px-4 py-2.5 text-sm font-medium transition"
            >
              <ChevronLeft size={15} />
              Nová pohádka
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading view ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-2xl border border-purple/20 bg-navy-mid/80 p-10 flex flex-col items-center text-center gap-6">
        {/* Animated stars */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-700/30 blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-600/20 to-purple-800/20 border border-purple/30 flex items-center justify-center">
            <span className="text-5xl animate-bounce">🌙</span>
          </div>
          {/* Orbiting stars */}
          <div className="absolute -top-1 -right-1 text-lg animate-spin" style={{ animationDuration: '3s' }}>✨</div>
          <div className="absolute -bottom-1 -left-1 text-sm animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>⭐</div>
        </div>

        <div className="space-y-1">
          <p className="text-lg font-semibold text-soft-white transition-all duration-500">
            {LOADING_MESSAGES[loadingMsgIdx]}
          </p>
          <p className="text-sm text-muted">Pohádka pro {childOption?.name ?? 'vaše dítě'}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <div className="h-2 rounded-full bg-navy-light overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-400 transition-all duration-700"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">{Math.round(Math.min(progress, 100))}%</p>
        </div>
      </div>
    )
  }

  // ── Generator form ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-900/30 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Step 1: Child selector */}
      {children.length > 1 && (
        <div className="rounded-2xl border border-purple/20 bg-navy-mid/80 p-5">
          <h3 className="text-sm font-semibold text-soft-white mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-purple/30 text-xs flex items-center justify-center text-violet-300 font-bold">1</span>
            Pro které dítě?
          </h3>
          <div className="flex flex-wrap gap-2">
            {children.map((child) => {
              const emoji = child.gender === 'boy' ? '👦' : child.gender === 'girl' ? '👧' : '🧒'
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition',
                    selectedChild === child.id
                      ? 'border-violet-500 bg-violet-500/20 text-white'
                      : 'border-purple/30 bg-navy-light text-muted hover:border-purple/50 hover:text-soft-white'
                  )}
                >
                  <span>{emoji}</span>
                  {child.name}
                  {child.age && <span className="text-xs opacity-60">({child.age})</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 2: Genre picker */}
      <div className="rounded-2xl border border-purple/20 bg-navy-mid/80 p-5">
        <h3 className="text-sm font-semibold text-soft-white mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-purple/30 text-xs flex items-center justify-center text-violet-300 font-bold">
            {children.length > 1 ? '2' : '1'}
          </span>
          Vyberte žánr
        </h3>

        {/* Search */}
        <input
          type="text"
          value={genreSearch}
          onChange={(e) => setGenreSearch(e.target.value)}
          placeholder="Hledat žánr..."
          className="w-full rounded-xl bg-navy-light border border-purple/30 px-4 py-2.5 text-soft-white placeholder-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-transparent transition mb-3"
        />

        <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-64 overflow-y-auto pr-1">
          {filteredGenres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              title={genre.name_cs}
              className={cn(
                'relative rounded-xl border py-3 text-2xl transition group',
                selectedGenre === genre.id
                  ? 'border-violet-500 bg-violet-500/20 shadow-sm shadow-violet-500/20'
                  : 'border-purple/20 bg-navy-light hover:border-purple/40 hover:bg-purple/10'
              )}
            >
              {genre.emoji}
              {selectedGenre === genre.id && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-violet-500 border-2 border-navy-mid" />
              )}
            </button>
          ))}
          {filteredGenres.length === 0 && (
            <div className="col-span-full text-center py-4 text-sm text-muted">
              Žádný žánr nenalezen
            </div>
          )}
        </div>

        {selectedGenre && genreData && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-2.5">
            <span className="text-xl">{genreData.emoji}</span>
            <div>
              <p className="text-sm font-medium text-white">{genreData.name_cs}</p>
              <p className="text-xs text-muted">{genreData.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Reading length */}
      <div className="rounded-2xl border border-purple/20 bg-navy-mid/80 p-5">
        <h3 className="text-sm font-semibold text-soft-white mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-purple/30 text-xs flex items-center justify-center text-violet-300 font-bold">
            {children.length > 1 ? '3' : '2'}
          </span>
          Délka pohádky
        </h3>
        <div className="flex gap-3">
          {READING_LENGTHS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setReadingLength(opt.value)}
              className={cn(
                'flex-1 rounded-xl border py-3 text-sm font-medium transition',
                readingLength === opt.value
                  ? 'border-violet-500 bg-violet-500/20 text-white'
                  : 'border-purple/30 bg-navy-light text-muted hover:border-purple/50 hover:text-soft-white'
              )}
            >
              <span className="block text-lg mb-0.5">
                {opt.value === 15 ? '📖' : opt.value === 30 ? '📚' : '📜'}
              </span>
              {opt.label}
              <span className="block text-xs opacity-60 mt-0.5">{opt.words} slov</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!selectedChild || !selectedGenre || loading}
        className={cn(
          'w-full rounded-2xl py-4 text-base font-bold transition flex items-center justify-center gap-3',
          'shadow-xl',
          selectedChild && selectedGenre
            ? 'bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white shadow-purple/40 hover:shadow-purple/60'
            : 'bg-navy-mid border border-purple/20 text-muted cursor-not-allowed'
        )}
      >
        <Sparkles size={20} className={selectedChild && selectedGenre ? 'text-yellow-300' : 'text-muted'} />
        {!selectedChild
          ? 'Nejprve přidejte dítě'
          : !selectedGenre
          ? 'Vyberte žánr pohádky'
          : 'Vygenerovat pohádku'}
      </button>

      {children.length === 0 && (
        <div className="rounded-xl bg-yellow-900/20 border border-yellow-500/30 px-4 py-3 text-sm text-yellow-300 text-center">
          Pro generování pohádky nejprve{' '}
          <a href="/children" className="underline hover:text-yellow-200 transition">
            přidejte profil dítěte
          </a>
          .
        </div>
      )}
    </div>
  )
}
