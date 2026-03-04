import { useState } from 'react'
import { TagInput, MentionInput } from './TagInput'
import { DescriptionEditor } from './DescriptionEditor'
import { DROP_TYPES, VISIBILITY_OPTIONS, PRODUCT_AREAS, TITLE_MAX_LENGTH } from '@/lib/constants'
import type { CreateDropInput, DropType, DropVisibility } from '@/types/drop'
import type { User } from '@/types/user'
import { searchUsers } from '@/api/users'
import { cn } from '@/lib/utils'

export interface DropFormValues extends Omit<CreateDropInput, 'mentionedUserIds'> {
  mentionedUsers: User[]
  /** People who might find this drop helpful (merged with mentionedUsers into mentionedUserIds on submit). */
  mentionUsers?: User[]
}

interface DropFormProps {
  initialValues?: Partial<DropFormValues> & { mentionedUserIds?: string[] }
  onSubmit: (values: CreateDropInput) => void | Promise<void>
  onSaveDraft?: (values: CreateDropInput) => void | Promise<void>
  onCancel?: () => void
  onDeleteDraft?: () => void | Promise<void>
  onPublish?: () => void | Promise<void>
  isPublishing?: boolean
  isLoading?: boolean
  submitLabel?: string
  /** Hide the Type dropdown (e.g. when type is set from upload/media). */
  hideType?: boolean
  /** Hide the Link (URL) field (e.g. when links are added via UploadZone). */
  hideLink?: boolean
}

const defaultValues: DropFormValues = {
  type: 'screenshot',
  title: '',
  description: '',
  url: '',
  tags: [],
  mentionedUsers: [],
  mentionUsers: [],
  project: '',
  labels: [],
  visibility: 'public',
}

export function DropForm({
  initialValues,
  onSubmit,
  onSaveDraft,
  onCancel,
  onDeleteDraft,
  onPublish,
  isPublishing,
  isLoading,
  submitLabel = 'Create drop',
  hideType = false,
  hideLink = false,
}: DropFormProps) {
  const draftFooter = onDeleteDraft != null && onPublish != null
  const [values, setValues] = useState<DropFormValues>({
    ...defaultValues,
    ...initialValues,
    mentionedUsers: initialValues?.mentionedUsers ?? [],
    mentionUsers: initialValues?.mentionUsers ?? [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [savingDraft, setSavingDraft] = useState(false)

  const toPayload = (): CreateDropInput => {
    const contributorIds = (values.mentionedUsers ?? []).map((u) => u.id)
    const mentionIds = (values.mentionUsers ?? []).map((u) => u.id)
    const mentionedUserIds = [...new Set([...contributorIds, ...mentionIds])]
    return { ...values, mentionedUserIds }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (!values.title.trim()) err.title = 'Title is required'
    if (values.title.length > TITLE_MAX_LENGTH) err.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`
    if (!hideType && !values.type) err.type = 'Type is required'
    setErrors(err)
    if (Object.keys(err).length > 0) return
    await onSubmit(toPayload())
  }

  const handleSaveDraft = async () => {
    const err: Record<string, string> = {}
    if (!values.title.trim()) err.title = 'Title is required to save draft'
    if (values.title.length > TITLE_MAX_LENGTH) err.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`
    setErrors(err)
    if (Object.keys(err).length > 0) return
    if (!onSaveDraft) return
    setSavingDraft(true)
    try {
      await onSaveDraft({ ...toPayload(), visibility: 'draft' })
    } finally {
      setSavingDraft(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!hideType && (
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
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Title *
        </label>
        <input
          type="text"
          maxLength={TITLE_MAX_LENGTH}
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          placeholder="Give your drop a title"
          className={cn(
            'w-full rounded-md border bg-white px-3 py-2 text-sm dark:bg-zinc-800 dark:text-zinc-100',
            errors.title ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-600'
          )}
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {values.title.length}/{TITLE_MAX_LENGTH}
        </p>
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Description
        </label>
        <DescriptionEditor
          value={values.description ?? ''}
          onChange={(description) => setValues((v) => ({ ...v, description: description || undefined }))}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Contributors
        </label>
        <MentionInput
          mentionedUsers={values.mentionedUsers}
          onMentionedUsersChange={(mentionedUsers) => setValues((v) => ({ ...v, mentionedUsers }))}
          onSearch={searchUsers}
          placeholder="Tag other users as contributors..."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Mentions
        </label>
        <MentionInput
          mentionedUsers={values.mentionUsers ?? []}
          onMentionedUsersChange={(mentionUsers) => setValues((v) => ({ ...v, mentionUsers }))}
          onSearch={searchUsers}
          placeholder="Tag people who might find this drop helpful"
        />
      </div>

      {!hideLink && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Link (URL)
          </label>
          <input
            type="url"
            value={values.url ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, url: e.target.value || undefined }))}
            placeholder="https://..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      )}

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
          Product area
        </label>
        <select
          value={values.project ?? ''}
          onChange={(e) =>
            setValues((v) => ({ ...v, project: e.target.value || undefined }))
          }
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">Select product area</option>
          {PRODUCT_AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
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

      <div className="flex flex-nowrap items-center justify-between gap-2 pt-2">
        {draftFooter ? (
          <>
            <div className="flex shrink-0 gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={onDeleteDraft}
                disabled={isLoading}
                className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-800 dark:hover:bg-red-950 disabled:opacity-50"
              >
                Delete Draft
              </button>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {isLoading ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={onPublish}
                disabled={isLoading || isPublishing}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isPublishing ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
              )}
              {onSaveDraft && (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isLoading || savingDraft}
                  title="You can edit a saved draft before publishing."
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {savingDraft ? 'Saving draft…' : 'Save draft'}
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isLoading ? 'Saving...' : submitLabel}
            </button>
          </>
        )}
      </div>
    </form>
  )
}
