import { Link } from 'react-router-dom'
import type { Drop } from '@/types/drop'
import { formatDate } from '@/lib/formatDate'
import { cn } from '@/lib/utils'

interface DropCardProps {
  drop: Drop
  className?: string
}

export function DropCard({ drop, className }: DropCardProps) {
  const thumbnailUrl = drop.thumbnailUrl ?? drop.imageUrl ?? undefined
  const isVideo = drop.type === 'screen_recording'

  return (
    <Link
      to={`/drops/${drop.id}`}
      className={cn(
        'group block overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900',
        className
      )}
    >
      <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800">
        {thumbnailUrl ? (
          isVideo ? (
            <video
              src={drop.videoUrl}
              poster={thumbnailUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          )
        ) : drop.type === 'url' && drop.url ? (
          <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-700">
            <span className="text-4xl text-zinc-400">🔗</span>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            No preview
          </div>
        )}
        {(drop.visibility === 'private' || drop.visibility === 'draft') && (
          <span className="absolute right-2 top-2 rounded bg-zinc-900/70 px-2 py-0.5 text-xs font-medium text-white">
            {drop.visibility === 'draft' ? 'Draft' : 'Private'}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 font-medium text-zinc-900 dark:text-zinc-50">
          {drop.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{drop.ownerDisplayName}</span>
          <span>·</span>
          <time dateTime={drop.createdAt}>{formatDate(drop.createdAt, { relative: true })}</time>
        </div>
        {drop.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {drop.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
