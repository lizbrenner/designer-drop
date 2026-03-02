import type { Drop } from '@/types/drop'
import { cn } from '@/lib/utils'

interface MediaPreviewProps {
  drop: Drop
  className?: string
  /** If true, show full-size (e.g. detail page). Default false (card thumbnail). */
  fullSize?: boolean
}

export function MediaPreview({ drop, className, fullSize }: MediaPreviewProps) {
  const thumbnailUrl = drop.thumbnailUrl ?? drop.imageUrl ?? undefined
  const isVideo = drop.type === 'screen_recording'

  if (drop.type === 'url' && drop.url) {
    return (
      <a
        href={drop.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800',
          className
        )}
      >
        <span className="text-2xl">🔗</span>
        <span className="truncate text-sm font-medium text-blue-600 underline dark:text-blue-400">
          {drop.url}
        </span>
      </a>
    )
  }

  if (isVideo && drop.videoUrl) {
    return (
      <div className={cn('overflow-hidden rounded-lg bg-black', className)}>
        <video
          src={drop.videoUrl}
          poster={thumbnailUrl}
          controls
          className={cn('w-full', fullSize ? 'max-h-[70vh]' : 'aspect-video')}
        />
      </div>
    )
  }

  if (drop.imageUrl) {
    return (
      <div className={cn('overflow-hidden rounded-lg', className)}>
        <img
          src={drop.imageUrl}
          alt={drop.title}
          className={cn(
            'w-full object-contain',
            fullSize ? 'max-h-[70vh]' : 'aspect-video object-cover'
          )}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex aspect-video items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800',
        className
      )}
    >
      No preview
    </div>
  )
}
