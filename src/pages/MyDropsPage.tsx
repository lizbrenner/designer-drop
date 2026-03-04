import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { GalleryFilters } from '@/components/gallery/GalleryFilters'
import { useDrops } from '@/hooks/useDrops'
import { useAuth } from '@/hooks/useAuth'
import type { DropsFilter, DatePreset } from '@/types/drop'
import { SynthesizeModal } from '@/components/synthesize/SynthesizeModal'

type SortBy = 'created' | 'updated'

function getDateRangeFromPreset(preset: DatePreset): { from: number; to: number } | null {
  if (preset === 'all') return null
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const to = now
  let from: number
  switch (preset) {
    case '3d': from = now - 3 * day; break
    case '7d': from = now - 7 * day; break
    case '30d': from = now - 30 * day; break
    case '180d': from = now - 180 * day; break
    default: return null
  }
  return { from, to }
}

export function MyDropsPage() {
  const { user } = useAuth()
  const { drops, loading, error } = useDrops({ ownerId: user?.id ?? undefined })
  const [filters, setFilters] = useState<DropsFilter | undefined>(undefined)
  const [sortBy, setSortBy] = useState<SortBy>('created')
  const [synthesizeOpen, setSynthesizeOpen] = useState(false)

  const availableTags = useMemo(() => {
    const set = new Set<string>()
    drops.forEach((d) => d.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [drops])

  const myDrops = useMemo(() => {
    if (!user?.id) return []
    let list = [...drops]
    if (filters?.tag) {
      list = list.filter((d) => d.tags.includes(filters.tag!))
    }
    const range = filters?.datePreset ? getDateRangeFromPreset(filters.datePreset) : null
    if (range) {
      list = list.filter((d) => {
        const t = new Date(d.createdAt).getTime()
        return t >= range.from && t <= range.to
      })
    }
    list.sort((a, b) => {
      const aTime = sortBy === 'updated' ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime()
      const bTime = sortBy === 'updated' ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime()
      return bTime - aTime
    })
    return list
  }, [drops, user?.id, filters?.tag, filters?.datePreset, sortBy])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          My drops
        </h1>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <GalleryFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableTags={availableTags}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            aria-label="Sort by"
          >
            <option value="created">Recently uploaded</option>
            <option value="updated">Recently edited</option>
          </select>
          <button
            type="button"
            onClick={() => setSynthesizeOpen(true)}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Synthesize my work
          </button>
        </div>
      </div>
      <SynthesizeModal
        open={synthesizeOpen}
        onClose={() => setSynthesizeOpen(false)}
        userId={user?.id}
      />

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          role="alert"
        >
          {error.message}
        </div>
      )}

      {!error && !loading && myDrops.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 py-16 dark:border-zinc-600 dark:bg-zinc-800/50">
          <p className="text-zinc-600 dark:text-zinc-400">
            {drops.length === 0
              ? "You haven't uploaded any drops yet."
              : 'No drops match your filters.'}
          </p>
          {drops.length === 0 && (
            <Link
              to="/upload"
              className="mt-4 text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
            >
              Create your first drop
            </Link>
          )}
        </div>
      )}

      <GalleryGrid drops={myDrops} loading={loading} />
    </div>
  )
}
