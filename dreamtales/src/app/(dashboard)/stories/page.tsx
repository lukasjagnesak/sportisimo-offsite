import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sparkles, Download, BookOpen, Filter } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { GENRES } from '@/types'
import StoriesClient from './_client'

interface PageProps {
  searchParams: Promise<{ page?: string; child?: string }>
}

export default async function StoriesPage({ searchParams }: PageProps) {
  const { page: pageParam, child: childFilter } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1'))
  const perPage = 12
  const offset = (page - 1) * perPage

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch children for filter dropdown
  const { data: children } = await supabase
    .from('children')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('active', true)

  // Build stories query
  let query = supabase
    .from('stories')
    .select('id, title, genre, reading_length, created_at, child_name, child_id, pdf_url', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (childFilter) {
    query = query.eq('child_id', childFilter)
  }

  const { data: stories, count } = await query

  const totalPages = Math.ceil((count ?? 0) / perPage)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-soft-white">Pohádky</h1>
          <p className="text-muted text-sm mt-1">
            {count ? `${count} pohádek celkem` : 'Zatím žádné pohádky'}
          </p>
        </div>
        <StoriesClient>
          <Link
            href="/stories/generate"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-semibold px-5 py-2.5 text-sm transition shadow-lg shadow-purple/30"
          >
            <Sparkles size={16} />
            Vygenerovat pohádku
          </Link>
        </StoriesClient>
      </div>

      {/* Filter bar */}
      {children && children.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-muted" />
          <Link
            href="/stories"
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              !childFilter
                ? 'border-violet-500 bg-violet-500/20 text-white'
                : 'border-purple/30 text-muted hover:border-purple/50 hover:text-soft-white'
            }`}
          >
            Všechny děti
          </Link>
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/stories?child=${child.id}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                childFilter === child.id
                  ? 'border-violet-500 bg-violet-500/20 text-white'
                  : 'border-purple/30 text-muted hover:border-purple/50 hover:text-soft-white'
              }`}
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Stories grid */}
      {!stories || stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-purple/30 bg-navy-mid/40 p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple/20 border border-purple/30 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-soft-white mb-2">Žádné pohádky nenalezeny</h3>
          <p className="text-sm text-muted mb-5">
            {childFilter ? 'Toto dítě zatím nemá žádné pohádky.' : 'Začněte generovat personalizované pohádky pro vaše děti.'}
          </p>
          <Link
            href="/stories/generate"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold px-5 py-2.5 text-sm transition"
          >
            <Sparkles size={16} />
            Vytvořit první pohádku
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map((story) => {
            const genreData = GENRES.find((g) => g.id === story.genre)
            return (
              <div
                key={story.id}
                className="group rounded-2xl border border-purple/20 bg-navy-mid/80 hover:border-purple/40 transition overflow-hidden"
              >
                {/* Color header */}
                <div className="h-24 bg-gradient-to-br from-purple/30 via-violet-900/20 to-navy-mid flex items-center justify-center">
                  <span className="text-5xl filter drop-shadow-lg">{genreData?.emoji ?? '📖'}</span>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-soft-white text-sm leading-snug line-clamp-2 mb-2">
                    {story.title}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted">{story.child_name}</span>
                    <span className="text-purple/40">·</span>
                    <span className="text-xs text-muted">{story.reading_length} min</span>
                    <span className="text-purple/40">·</span>
                    <span className="text-xs text-muted">{formatDate(story.created_at)}</span>
                  </div>
                  {genreData && (
                    <span className="mt-2 inline-block text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5">
                      {genreData.name_cs}
                    </span>
                  )}

                  {/* PDF download */}
                  {story.pdf_url && (
                    <div className="mt-3 pt-3 border-t border-purple/10">
                      <a
                        href={story.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-soft-white hover:bg-white/5 rounded-lg px-2.5 py-1.5 border border-purple/20 hover:border-purple/40 transition"
                      >
                        <Download size={12} />
                        Stáhnout PDF
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          {page > 1 && (
            <Link
              href={`/stories?page=${page - 1}${childFilter ? `&child=${childFilter}` : ''}`}
              className="px-4 py-2 rounded-xl border border-purple/30 text-sm text-muted hover:text-soft-white hover:border-purple/50 transition"
            >
              Předchozí
            </Link>
          )}
          <span className="text-sm text-muted px-3">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/stories?page=${page + 1}${childFilter ? `&child=${childFilter}` : ''}`}
              className="px-4 py-2 rounded-xl border border-purple/30 text-sm text-muted hover:text-soft-white hover:border-purple/50 transition"
            >
              Další
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
