import { useParams, useNavigate } from 'react-router-dom'
import { DropForm } from '@/components/drop/DropForm'
import { useDrop } from '@/hooks/useDrop'
import { useCreateDrop } from '@/hooks/useCreateDrop'
import { useAuth } from '@/hooks/useAuth'
import type { CreateDropInput } from '@/types/drop'

export function EditDropPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { drop, loading, error } = useDrop(id)
  const { update, loading: isSaving, error: saveError } = useCreateDrop()

  const handleSubmit = async (values: CreateDropInput) => {
    if (!id) return
    await update(id, {
      title: values.title,
      description: values.description,
      tags: values.tags,
      mentionedUserIds: values.mentionedUserIds,
      project: values.project,
      labels: values.labels,
      visibility: values.visibility,
    })
    navigate(`/drops/${id}`)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-8 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    )
  }

  if (error || !drop) {
    return (
      <div className="mx-auto max-w-2xl">
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
  if (!isOwner) {
    navigate(`/drops/${id}`)
    return null
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit drop
      </h1>
      {saveError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          role="alert"
        >
          {saveError.message}
        </div>
      )}
      <DropForm
        initialValues={{
          type: drop.type,
          title: drop.title,
          description: drop.description,
          tags: drop.tags,
          mentionedUsers: drop.mentionedUsers ?? [],
          project: drop.project,
          labels: drop.labels,
          visibility: drop.visibility,
        }}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/drops/${id}`)}
        isLoading={isSaving}
        submitLabel="Save changes"
      />
    </div>
  )
}
