'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, Pencil, Trash2, X, User, Users } from 'lucide-react'
import { GENRES, READING_LENGTHS, type Child } from '@/types'
import { cn } from '@/lib/utils'

interface ChildWithPrefs extends Child {
  story_preferences?: {
    genres: string[]
    reading_length: number
    delivery_time: string
  }[]
}

interface ChildFormValues {
  name: string
  age: string
  gender: 'boy' | 'girl' | 'neutral'
  friends: string
  parents: string
  genres: string[]
  reading_length: 15 | 30 | 45
  delivery_time: string
}

const genderOptions = [
  { value: 'boy', label: 'Chlapec', emoji: '👦' },
  { value: 'girl', label: 'Dívka', emoji: '👧' },
  { value: 'neutral', label: 'Neutrální', emoji: '🧒' },
] as const

export default function ChildrenPage() {
  const [children, setChildren] = useState<ChildWithPrefs[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingChild, setEditingChild] = useState<ChildWithPrefs | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ChildFormValues>({
    defaultValues: {
      gender: 'neutral',
      genres: [],
      reading_length: 15,
      delivery_time: '20:00',
      friends: '',
      parents: '',
    },
  })

  const selectedGenres = watch('genres')

  const fetchChildren = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/children')
      const data = await res.json()
      setChildren(data.children ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChildren()
  }, [fetchChildren])

  function openAdd() {
    setEditingChild(null)
    reset({
      name: '',
      age: '',
      gender: 'neutral',
      friends: '',
      parents: '',
      genres: [],
      reading_length: 15,
      delivery_time: '20:00',
    })
    setServerError(null)
    setDialogOpen(true)
  }

  function openEdit(child: ChildWithPrefs) {
    setEditingChild(child)
    const prefs = child.story_preferences?.[0]
    reset({
      name: child.name,
      age: child.age?.toString() ?? '',
      gender: child.gender,
      friends: child.friends?.join(', ') ?? '',
      parents: child.parents?.join(', ') ?? '',
      genres: prefs?.genres ?? [],
      reading_length: (prefs?.reading_length as 15 | 30 | 45) ?? 15,
      delivery_time: prefs?.delivery_time ?? '20:00',
    })
    setServerError(null)
    setDialogOpen(true)
  }

  async function onSubmit(values: ChildFormValues) {
    setSubmitting(true)
    setServerError(null)
    try {
      const body = {
        name: values.name.trim(),
        age: values.age ? parseInt(values.age) : undefined,
        gender: values.gender,
        friends: values.friends ? values.friends.split(',').map((s) => s.trim()).filter(Boolean) : [],
        parents: values.parents ? values.parents.split(',').map((s) => s.trim()).filter(Boolean) : [],
        genres: values.genres,
        reading_length: values.reading_length,
        delivery_time: values.delivery_time,
      }

      const url = editingChild ? `/api/children/${editingChild.id}` : '/api/children'
      const method = editingChild ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        setServerError(err.error ?? 'Nepodařilo se uložit profil')
        return
      }

      setDialogOpen(false)
      await fetchChildren()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/children/${id}`, { method: 'DELETE' })
      await fetchChildren()
    } finally {
      setDeletingId(null)
    }
  }

  function toggleGenre(genreId: string) {
    const current = selectedGenres ?? []
    if (current.includes(genreId)) {
      setValue('genres', current.filter((g) => g !== genreId))
    } else {
      setValue('genres', [...current, genreId])
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-soft-white">Profily dětí</h1>
          <p className="text-muted text-sm mt-1">Spravujte profily a preference pohádek</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-semibold px-4 py-2.5 text-sm transition shadow-lg shadow-purple/30"
        >
          <Plus size={16} />
          Přidat dítě
        </button>
      </div>

      {/* Children list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-purple/20 bg-navy-mid/80 p-5 animate-pulse h-36" />
          ))}
        </div>
      ) : children.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-purple/30 bg-navy-mid/40 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple/20 border border-purple/30 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-soft-white mb-2">Zatím žádné dítě</h3>
          <p className="text-sm text-muted mb-5">Přidejte první profil a začněte generovat personalizované pohádky.</p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold px-5 py-2.5 text-sm transition"
          >
            <Plus size={16} />
            Přidat dítě
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => {
            const genderEmoji = genderOptions.find((g) => g.value === child.gender)?.emoji ?? '🧒'
            const prefs = child.story_preferences?.[0]
            return (
              <div
                key={child.id}
                className="group rounded-2xl border border-purple/20 bg-navy-mid/80 p-5 hover:border-purple/40 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple/20 border border-purple/30 flex items-center justify-center text-xl">
                      {genderEmoji}
                    </div>
                    <div>
                      <p className="font-semibold text-soft-white">{child.name}</p>
                      {child.age && <p className="text-xs text-muted">{child.age} let</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => openEdit(child)}
                      className="p-1.5 rounded-lg text-muted hover:text-soft-white hover:bg-white/5 transition"
                      aria-label="Upravit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(child.id)}
                      disabled={deletingId === child.id}
                      className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-900/20 transition disabled:opacity-40"
                      aria-label="Smazat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {prefs?.genres && prefs.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {prefs.genres.slice(0, 3).map((gId) => {
                      const g = GENRES.find((x) => x.id === gId)
                      return g ? (
                        <span key={gId} className="text-sm" title={g.name_cs}>{g.emoji}</span>
                      ) : null
                    })}
                    {prefs.genres.length > 3 && (
                      <span className="text-xs text-muted">+{prefs.genres.length - 3}</span>
                    )}
                  </div>
                )}
                {prefs?.delivery_time && (
                  <p className="text-xs text-muted mt-2">
                    Doručení ve {prefs.delivery_time} · {prefs.reading_length} min
                  </p>
                )}
                {child.friends && child.friends.length > 0 && (
                  <p className="text-xs text-muted mt-1 truncate">
                    Kamarádi: {child.friends.slice(0, 2).join(', ')}{child.friends.length > 2 ? '…' : ''}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-purple/20 bg-navy-light shadow-2xl shadow-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple/20">
              <Dialog.Title className="text-lg font-semibold text-soft-white flex items-center gap-2">
                <User size={18} className="text-violet-400" />
                {editingChild ? 'Upravit profil' : 'Přidat dítě'}
              </Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg text-muted hover:text-soft-white hover:bg-white/5 transition">
                <X size={18} />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
              {serverError && (
                <div className="rounded-lg bg-red-900/30 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                  {serverError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1.5">Jméno *</label>
                <input
                  {...register('name', { required: 'Jméno je povinné', minLength: { value: 2, message: 'Jméno musí mít alespoň 2 znaky' } })}
                  placeholder="Tomáš"
                  className="w-full rounded-xl bg-navy-mid border border-purple/30 px-4 py-2.5 text-soft-white placeholder-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-transparent transition"
                />
                {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>}
              </div>

              {/* Age + Gender row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-1.5">Věk</label>
                  <input
                    {...register('age', {
                      validate: (v) => !v || (parseInt(v) >= 2 && parseInt(v) <= 14) || 'Věk 2–14 let',
                    })}
                    type="number"
                    min="2"
                    max="14"
                    placeholder="6"
                    className="w-full rounded-xl bg-navy-mid border border-purple/30 px-4 py-2.5 text-soft-white placeholder-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-transparent transition"
                  />
                  {errors.age && <p className="mt-1.5 text-xs text-red-400">{errors.age.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-1.5">Pohlaví</label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <div className="flex gap-1.5">
                        {genderOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={cn(
                              'flex-1 rounded-xl border py-2 text-sm transition',
                              field.value === opt.value
                                ? 'border-violet-500 bg-violet-500/20 text-white'
                                : 'border-purple/30 bg-navy-mid text-muted hover:border-purple/50'
                            )}
                            title={opt.label}
                          >
                            {opt.emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Friends */}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1.5">Kamarádi (oddělené čárkou)</label>
                <input
                  {...register('friends')}
                  placeholder="Honza, Lucie, Robot"
                  className="w-full rounded-xl bg-navy-mid border border-purple/30 px-4 py-2.5 text-soft-white placeholder-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-transparent transition"
                />
              </div>

              {/* Parents */}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1.5">Rodiče (oddělené čárkou)</label>
                <input
                  {...register('parents')}
                  placeholder="Maminka Jana, Tatínek Pavel"
                  className="w-full rounded-xl bg-navy-mid border border-purple/30 px-4 py-2.5 text-soft-white placeholder-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-transparent transition"
                />
              </div>

              {/* Genres */}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Oblíbené žánry</label>
                <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {GENRES.map((genre) => {
                    const isSelected = (selectedGenres ?? []).includes(genre.id)
                    return (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() => toggleGenre(genre.id)}
                        title={genre.name_cs}
                        className={cn(
                          'rounded-xl border py-2 text-xl transition',
                          isSelected
                            ? 'border-violet-500 bg-violet-500/20'
                            : 'border-purple/20 bg-navy-mid hover:border-purple/40'
                        )}
                      >
                        {genre.emoji}
                      </button>
                    )
                  })}
                </div>
                {selectedGenres && selectedGenres.length > 0 && (
                  <p className="mt-2 text-xs text-muted">Vybráno: {selectedGenres.length} žánrů</p>
                )}
              </div>

              {/* Reading length */}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1.5">Délka čtení</label>
                <Controller
                  name="reading_length"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-2">
                      {READING_LENGTHS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={cn(
                            'flex-1 rounded-xl border py-2.5 text-sm font-medium transition',
                            field.value === opt.value
                              ? 'border-violet-500 bg-violet-500/20 text-white'
                              : 'border-purple/30 bg-navy-mid text-muted hover:border-purple/50'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Delivery time */}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1.5">Čas doručení pohádky</label>
                <input
                  {...register('delivery_time')}
                  type="time"
                  className="w-full rounded-xl bg-navy-mid border border-purple/30 px-4 py-2.5 text-soft-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-transparent transition"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="flex-1 rounded-xl border border-purple/30 bg-transparent text-muted hover:text-soft-white hover:border-purple/50 py-2.5 text-sm font-medium transition"
                  >
                    Zrušit
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-semibold py-2.5 text-sm transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Ukládám...
                    </>
                  ) : editingChild ? 'Uložit změny' : 'Přidat dítě'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
