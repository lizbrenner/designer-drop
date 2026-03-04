import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DropDetail } from '@/components/drop/DropDetail'
import { DropForm } from '@/components/drop/DropForm'
import { UploadZone } from '@/components/upload/UploadZone'
import { useDrop } from '@/hooks/useDrop'
import { useCreateDrop } from '@/hooks/useCreateDrop'
import { useAuth } from '@/hooks/useAuth'
import { uploadFile } from '@/api/upload'
import type { CreateDropInput } from '@/types/drop'

export function DropDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { drop, loading, error, refetch } = useDrop(id)
  const { update, remove, loading: isMutating, error: saveError } = useCreateDrop()
  const [publishing, setPublishing] = useState(false)
  const [editLinks, setEditLinks] = useState<string[]>([])
  const [editMediaUrl, setEditMediaUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const editLinksInitialized = useRef(false)

  const isOwner = user?.id === drop?.ownerId
  const isDraftOrPrivate = drop ? (drop.visibility === 'draft' || drop.visibility === 'private') : false

  useEffect(() => {
    if (!id) editLinksInitialized.current = false
  }, [id])

  useEffect(() => {
    if (!drop || !isDraftOrPrivate || !isOwner || editLinksInitialized.current) return
    editLinksInitialized.current = true
    setEditLinks(drop.url ? [drop.url] : [])
  }, [drop, isDraftOrPrivate, isOwner])

  const handleDelete = async (dropId: string) => {
    await remove(dropId)
    navigate('/')
  }

  const handlePublish = async (dropId: string) => {
    setPublishing(true)
    try {
      await update(dropId, { visibility: 'public' })
      await refetch()
    } finally {
      setPublishing(false)
    }
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

  const handleEditFileSelect = async (file: File) => {
    setUploadError(null)
    setUploading(true)
    try {
      const { url, thumbnailUrl } = await uploadFile(file)
      setEditMediaUrl(thumbnailUrl ?? url)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleFormSubmit = async (values: CreateDropInput) => {
    if (!id) return
    await update(id, {
      title: values.title,
      description: values.description,
      url: editLinks[0] ?? values.url,
      tags: values.tags,
      mentionedUserIds: values.mentionedUserIds,
      project: values.project,
      labels: values.labels,
      visibility: values.visibility,
    })
    await refetch()
  }

  if (isDraftOrPrivate && isOwner) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {drop.visibility === 'draft' ? 'Edit draft' : 'Edit drop'}
        </h1>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Add media (optional)
          </p>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Drag and drop a file or add links. You can add or change this anytime before saving.
          </p>
          {uploadError && (
            <div
              className="mb-2 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
              role="alert"
            >
              {uploadError}
            </div>
          )}
          <UploadZone
            accept="all"
            onFileSelect={handleEditFileSelect}
            urls={editLinks}
            onUrlAdd={(url) => setEditLinks((prev) => (prev.length < 5 ? [...prev, url] : prev))}
            onUrlRemove={(index) => setEditLinks((prev) => prev.filter((_, i) => i !== index))}
            maxUrls={5}
            disabled={uploading}
          />
          {uploading && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Uploading…</p>
          )}
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Details
          </p>
          {saveError && (
            <div
              className="mb-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
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
              url: editLinks[0] ?? drop.url ?? '',
              tags: drop.tags,
              mentionedUsers: drop.mentionedUsers ?? [],
              project: drop.project,
              labels: drop.labels,
              visibility: drop.visibility,
            }}
            onSubmit={handleFormSubmit}
            onCancel={() => navigate('/')}
            onDeleteDraft={async () => {
              if (confirm('Delete this draft?')) await handleDelete(id!)
            }}
            onPublish={() => handlePublish(id!)}
            isPublishing={publishing}
            isLoading={isMutating}
            submitLabel="Save Draft"
            hideType
            hideLink
          />
        </div>
      </div>
    )
  }

  return (
    <DropDetail
      drop={drop}
      onDelete={isOwner ? handleDelete : undefined}
      onPublish={isOwner ? handlePublish : undefined}
      isDeleting={isMutating}
      isPublishing={publishing}
    />
  )
}
