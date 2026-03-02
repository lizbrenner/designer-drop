import { useCallback, useState } from 'react'
import { createDrop, updateDrop, deleteDrop } from '@/api/drops'
import type { CreateDropInput, UpdateDropInput } from '@/types/drop'

export function useCreateDrop() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (input: CreateDropInput) => {
    setLoading(true)
    setError(null)
    try {
      return await createDrop(input)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to create drop'))
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(async (id: string, input: UpdateDropInput) => {
    setLoading(true)
    setError(null)
    try {
      return await updateDrop(id, input)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to update drop'))
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await deleteDrop(id)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to delete drop'))
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { create, update, remove, loading, error }
}
