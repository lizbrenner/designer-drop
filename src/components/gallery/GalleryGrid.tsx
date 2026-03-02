import { DropCard } from './DropCard'
import { DropCardSkeleton } from './DropCardSkeleton'
import type { Drop } from '@/types/drop'
import { cn } from '@/lib/utils'

interface GalleryGridProps {
  drops: Drop[]
  loading?: boolean
  className?: string
}

export function GalleryGrid({ drops, loading, className }: GalleryGridProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <DropCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {drops.map((drop) => (
        <DropCard key={drop.id} drop={drop} />
      ))}
    </div>
  )
}
