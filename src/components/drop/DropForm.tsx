import { useState } from 'react'
import { TagInput, MentionInput } from './TagInput'
import { DROP_TYPES, VISIBILITY_OPTIONS } from '@/lib/constants'
import type { CreateDropInput, DropType, DropVisibility } from '@/types/drop'
import type { User } from '@/types/user'
import { searchUsers } from '@/api/users'
import { cn } from '@/lib/utils'

export interface DropFormValues extends Omit<CreateDropInput, 'mentionedUserIds'> {
  mentionedUsers: User[]
}

interface DropFormProps {
  initialValues?: Partial<DropFormValues> & { mentionedUserIds?: string[] }
  onSubmit: (values: CreateDropInput) => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  submitLabel?: string
}

const defaultValues: DropFormValues = {
  type: 'screenshot',
  title: '',
  description: '',
  tags: [],
  mentionedUsers: [],
  project: '',
  labels: [],
  visibility: 'public',
}

export function DropForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Create drop',
}: DropFormProps) {
  const [values, setValues] = useState<DropFormValues>({
    ...defaultValues,
    ...initialValues,
    mentionedUsers: initialValues?.mentionedUsers ?? [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (!values.title.trim()) err.title = 'Title is required'
    if (!values.type) err.type = 'Type is required'
    setErrors(err)
    if (Object.keys(err).length > 0) return
    await onSubmit({
      ...values,
      mentionedUserIds: values.mentionedUsers.map((u) => u.id),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Type
        </label>
        <select
          value={values.type}
          onChange={(e) => setValues((v) => ({ ...v, type: e.target.value as DropType }))}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {DROP_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Title *
        </label>
        <input
          type="text"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          placeholder="Give your drop a title"
          className={cn(
            'w-full rounded-md border bg-white px-3 py-2 text-sm dark:bg-zinc-800 dark:text-zinc-100',
            errors.title ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-600'
          )}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Description
        </label>
        <textarea
          value={values.description ?? ''}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value || undefined }))}
          placeholder="Optional description"
          rows={3}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Tags
        </label>
        <TagInput
          tags={values.tags}
          onTagsChange={(tags) => setValues((v) => ({ ...v, tags }))}
          placeholder="Add tags (e.g. onboarding, dashboard)"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Mention people
        </label>
        <MentionInput
          mentionedUsers={values.mentionedUsers}
          onMentionedUsersChange={(mentionedUsers) => setValues((v) => ({ ...v, mentionedUsers }))}
          onSearch={searchUsers}
          placeholder="Type to search users..."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Project
        </label>
        <input
          type="text"
          value={values.project ?? ''}
          onChange={(e) =>
            setValues((v) => ({ ...v, project: e.target.value || undefined }))
          }
          placeholder="e.g. Fusion, InField"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Labels
        </label>
        <TagInput
          tags={values.labels}
          onTagsChange={(labels) => setValues((v) => ({ ...v, labels }))}
          placeholder="e.g. button, navigation"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Visibility
        </label>
        <select
          value={values.visibility}
          onChange={(e) =>
            setValues((v) => ({ ...v, visibility: e.target.value as DropVisibility }))
          }
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {VISIBILITY_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
