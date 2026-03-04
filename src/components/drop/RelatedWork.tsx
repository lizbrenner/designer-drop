import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRelatedDrops } from '@/api/drops'
import type { RelatedDrop } from '@/api/drops'
import { formatDate } from '@/lib/formatDate'

interface RelatedWorkProps {
  dropId: string
  limit?: number
}

export function RelatedWork({ dropId, limit = 5 }: RelatedWorkProps) {
  const [related, setRelated] = useState<RelatedDrop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getRelatedDrops(dropId, limit).then((data) => {
      if (!cancelled) {
        setRelated(data)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [dropId, limit])

  if (loading) return null
  if (related.length === 0) return null

  return (
    <section className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Related work
      </h2>
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        Similar topics and project
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {related.map(({ drop, reason }) => (
          <li key={drop.id}>
            <Link
              to={`/drops/${drop.id}`}
              className="block rounded-lg border border-zinc-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2">
                {drop.title}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {drop.ownerDisplayName} · {formatDate(drop.createdAt, { relative: true })}
              </p>
              {reason && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 italic">
                  {reason}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
