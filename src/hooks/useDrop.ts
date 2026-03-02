import { useCallback, useEffect, useState } from 'react'
import { getDrop } from '@/api/drops'
import type { Drop } from '@/types/drop'

export function useDrop(id: string | undefined) {
  const [drop, setDrop] = useState<Drop | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    if (!id) {
      setDrop(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getDrop(id)
      setDrop(data)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load drop'))
      setDrop(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { drop, loading, error, refetch }
}
