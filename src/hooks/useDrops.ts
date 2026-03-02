import { useCallback, useEffect, useState } from 'react'
import { getDrops } from '@/api/drops'
import type { Drop } from '@/types/drop'
import type { DropsFilter } from '@/types/drop'

export function useDrops(initialFilters?: DropsFilter) {
  const [drops, setDrops] = useState<Drop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [filters, setFilters] = useState<DropsFilter | undefined>(initialFilters)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDrops(filters)
      setDrops(data)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load drops'))
      setDrops([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { drops, loading, error, refetch, filters, setFilters }
}
