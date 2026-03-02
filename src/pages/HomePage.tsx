import { Link } from 'react-router-dom'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { GalleryFilters } from '@/components/gallery/GalleryFilters'
import { useDrops } from '@/hooks/useDrops'
import { useMemo } from 'react'

export function HomePage() {
  const { drops, loading, error, filters, setFilters } = useDrops()

  const availableTags = useMemo(() => {
    const set = new Set<string>()
    drops.forEach((d) => d.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [drops])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Gallery
        </h1>
        <GalleryFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableTags={availableTags}
        />
      </div>

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          role="alert"
        >
          {error.message}
        </div>
      )}

      {!error && !loading && drops.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 py-16 dark:border-zinc-600 dark:bg-zinc-800/50">
          <p className="text-zinc-600 dark:text-zinc-400">
            No drops yet. Upload the first one!
          </p>
          <Link
            to="/upload"
            className="mt-4 text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Upload a drop
          </Link>
        </div>
      )}

      <GalleryGrid drops={drops} loading={loading} />
    </div>
  )
}
