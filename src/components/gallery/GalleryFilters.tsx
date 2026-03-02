import type { DropsFilter } from '@/types/drop'
import { cn } from '@/lib/utils'

interface GalleryFiltersProps {
  filters: DropsFilter | undefined
  onFiltersChange: (f: DropsFilter | undefined) => void
  availableTags?: string[]
  className?: string
}

export function GalleryFilters({
  filters,
  onFiltersChange,
  availableTags = [],
  className,
}: GalleryFiltersProps) {
  const setTag = (tag: string | undefined) =>
    onFiltersChange(tag ? { ...filters, tag } : filters ? { ...filters, tag: undefined } : undefined)
  const setProject = (project: string | undefined) =>
    onFiltersChange(
      project ? { ...filters, project } : filters ? { ...filters, project: undefined } : undefined
    )
  const setDateFrom = (dateFrom: string | undefined) =>
    onFiltersChange(
      dateFrom ? { ...filters, dateFrom } : filters ? { ...filters, dateFrom: undefined } : undefined
    )
  const setDateTo = (dateTo: string | undefined) =>
    onFiltersChange(
      dateTo ? { ...filters, dateTo } : filters ? { ...filters, dateTo: undefined } : undefined
    )

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Tag</span>
        <select
          value={filters?.tag ?? ''}
          onChange={(e) => setTag(e.target.value || undefined)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">All</option>
          {availableTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Project</span>
        <input
          type="text"
          placeholder="Filter by project"
          value={filters?.project ?? ''}
          onChange={(e) => setProject(e.target.value || undefined)}
          className="w-36 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">From</span>
        <input
          type="date"
          value={filters?.dateFrom ?? ''}
          onChange={(e) => setDateFrom(e.target.value || undefined)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">To</span>
        <input
          type="date"
          value={filters?.dateTo ?? ''}
          onChange={(e) => setDateTo(e.target.value || undefined)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </label>
      {(filters?.tag || filters?.project || filters?.dateFrom || filters?.dateTo) && (
        <button
          type="button"
          onClick={() => onFiltersChange(undefined)}
          className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-400"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
