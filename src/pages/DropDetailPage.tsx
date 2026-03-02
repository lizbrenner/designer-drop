import { useParams, useNavigate } from 'react-router-dom'
import { DropDetail } from '@/components/drop/DropDetail'
import { useDrop } from '@/hooks/useDrop'
import { useCreateDrop } from '@/hooks/useCreateDrop'
import { useAuth } from '@/hooks/useAuth'

export function DropDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { drop, loading, error } = useDrop(id)
  const { remove, loading: isDeleting } = useCreateDrop()

  const handleDelete = async (dropId: string) => {
    await remove(dropId)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="aspect-video animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    )
  }

  if (error || !drop) {
    return (
      <div className="mx-auto max-w-3xl">
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          role="alert"
        >
          {error?.message ?? 'Drop not found'}
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 text-sm font-medium text-zinc-600 underline dark:text-zinc-400"
        >
          Back to gallery
        </button>
      </div>
    )
  }

  const isOwner = user?.id === drop.ownerId

  return (
    <DropDetail
      drop={drop}
      onDelete={isOwner ? handleDelete : undefined}
      isDeleting={isDeleting}
    />
  )
}
