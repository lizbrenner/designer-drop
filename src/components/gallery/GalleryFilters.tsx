import type { DropsFilter, DatePreset } from '@/types/drop'
import { cn } from '@/lib/utils'

const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '3d', label: 'Last three days' },
  { value: '7d', label: 'Last week' },
  { value: '30d', label: 'Last month' },
  { value: '180d', label: 'Last six months' },
]

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
  const setDatePreset = (datePreset: DatePreset) =>
    onFiltersChange(
      filters ? { ...filters, datePreset, dateFrom: undefined, dateTo: undefined } : { datePreset }
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
        <span className="text-zinc-600 dark:text-zinc-400">Date</span>
        <select
          value={filters?.datePreset ?? 'all'}
          onChange={(e) => setDatePreset(e.target.value as DatePreset)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {DATE_PRESET_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {(filters?.tag || (filters?.datePreset && filters.datePreset !== 'all')) && (
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
