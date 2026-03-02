import { Link } from 'react-router-dom'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { useDrops } from '@/hooks/useDrops'
import { useAuth } from '@/hooks/useAuth'

export function MyDropsPage() {
  const { user } = useAuth()
  const { drops, loading, error } = useDrops({ includePrivate: true })

  const myDrops = drops.filter((d) => d.ownerId === user?.id)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          My drops
        </h1>
        <Link
          to="/upload"
          className="text-sm font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Upload new
        </Link>
      </div>

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
            You haven&apos;t uploaded any drops yet.
          </p>
          <Link
            to="/upload"
            className="mt-4 text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Upload your first drop
          </Link>
        </div>
      )}

      <GalleryGrid drops={myDrops} loading={loading} />
    </div>
  )
}
