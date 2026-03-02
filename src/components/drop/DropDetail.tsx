import { Link, useNavigate } from 'react-router-dom'
import { MediaPreview } from './MediaPreview'
import { formatDateTime } from '@/lib/formatDate'
import { useAuth } from '@/hooks/useAuth'
import type { Drop } from '@/types/drop'

interface DropDetailProps {
  drop: Drop
  onDelete?: (id: string) => void | Promise<void>
  isDeleting?: boolean
}

export function DropDetail({ drop, onDelete, isDeleting }: DropDetailProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isOwner = user?.id === drop.ownerId

  const handleDelete = async () => {
    if (!onDelete || !confirm('Delete this drop?')) return
    await onDelete(drop.id)
    navigate('/')
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {drop.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{drop.ownerDisplayName}</span>
            <span>·</span>
            <time dateTime={drop.createdAt}>{formatDateTime(drop.createdAt)}</time>
            {drop.visibility === 'private' && (
              <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium dark:bg-zinc-700">
                Private
              </span>
            )}
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Link
              to={`/drops/${drop.id}/edit`}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-800 dark:hover:bg-red-950 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <MediaPreview drop={drop} fullSize />

      {drop.description && (
        <p className="text-zinc-700 dark:text-zinc-300">{drop.description}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {drop.tags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-zinc-100 px-2 py-0.5 text-sm text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
          >
            {tag}
          </span>
        ))}
      </div>

      {drop.mentionedUsers && drop.mentionedUsers.length > 0 && (
        <div>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Mentioned:{' '}
          </span>
          {drop.mentionedUsers.map((u) => (
            <span key={u.id} className="text-sm text-zinc-700 dark:text-zinc-300">
              @{u.displayName}{' '}
            </span>
          ))}
        </div>
      )}

      {drop.project && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Project: <span className="font-medium">{drop.project}</span>
        </p>
      )}

      {drop.labels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Labels:</span>
          {drop.labels.map((l) => (
            <span
              key={l}
              className="rounded border border-zinc-300 px-2 py-0.5 text-sm dark:border-zinc-600"
            >
              {l}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
