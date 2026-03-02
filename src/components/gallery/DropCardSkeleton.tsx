import { cn } from '@/lib/utils'

interface DropCardSkeletonProps {
  className?: string
}

export function DropCardSkeleton({ className }: DropCardSkeletonProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
        className
      )}
    >
      <div className="aspect-video w-full animate-pulse bg-zinc-200 dark:bg-zinc-700" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex gap-1 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-5 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
