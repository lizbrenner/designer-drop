import { useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_VIDEO_TYPES } from '@/lib/constants'

type AcceptType = 'image' | 'video' | 'all'

const MAX_LINKS = 5

interface UploadZoneProps {
  accept: AcceptType
  onFileSelect: (file: File) => void
  /** When provided and multiple files are selected, called with all files (parent can upload in sequence). */
  onFilesSelect?: (files: File[]) => void
  /** Max files when multiple is true (e.g. 5 for images/videos). */
  maxFiles?: number
  /** Single URL submit (one link). Prefer urls + onUrlAdd/onUrlRemove for multi-link UI. */
  onUrlSubmit?: (url: string) => void
  /** Current list of added links (for multi-link UI with remove). */
  urls?: string[]
  onUrlAdd?: (url: string) => void
  onUrlRemove?: (index: number) => void
  maxUrls?: number
  disabled?: boolean
  className?: string
}

const acceptMap: Record<AcceptType, string> = {
  image: ACCEPTED_IMAGE_TYPES.join(','),
  video: ACCEPTED_VIDEO_TYPES.join(','),
  all: [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(','),
}

const MAX_FILES = 5

export function UploadZone({
  accept,
  onFileSelect,
  onFilesSelect,
  maxFiles = MAX_FILES,
  onUrlSubmit,
  urls = [],
  onUrlAdd,
  onUrlRemove,
  maxUrls = MAX_LINKS,
  disabled,
  className,
}: UploadZoneProps) {
  const multiLink = Array.isArray(urls) && onUrlAdd != null && onUrlRemove != null
  const canAddMore = urls.length < maxUrls
  const inputRef = useRef<HTMLInputElement>(null)
  const allowMultipleFiles = accept === 'all' && maxFiles > 1

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return
      const files = Array.from(fileList).slice(0, maxFiles)
      if (files.length > 1 && onFilesSelect) {
        onFilesSelect(files)
      } else {
        files.forEach((file) => onFileSelect(file))
      }
    },
    [maxFiles, onFileSelect, onFilesSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (disabled) return
      processFiles(e.dataTransfer.files)
    },
    [disabled, processFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files)
      e.target.value = ''
    },
    [processFiles]
  )

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        className={cn(
          'flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50/50 transition-colors hover:border-zinc-400 hover:bg-zinc-100/50 dark:border-zinc-600 dark:bg-zinc-800/50 dark:hover:border-zinc-500 dark:hover:bg-zinc-800',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        aria-label="Upload file"
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptMap[accept]}
          multiple={allowMultipleFiles}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
        <span className="text-4xl text-zinc-400">📤</span>
        <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Drag and drop or click to upload
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          {accept === 'image' && 'PNG, JPEG, GIF, WebP'}
          {accept === 'video' && 'MP4, WebM'}
          {accept === 'all' && 'Images and videos'}
        </p>
        {accept === 'all' && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            You can add up to five images or videos.
          </p>
        )}
      </div>
      {(onUrlSubmit != null || multiLink) && (
        <div className="space-y-2">
          {multiLink &&
            urls.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white py-2 pl-3 pr-2 dark:border-zinc-600 dark:bg-zinc-800"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300" title={url}>
                  {url}
                </span>
                <button
                  type="button"
                  onClick={() => onUrlRemove(i)}
                  disabled={disabled}
                  className="shrink-0 rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                  aria-label="Remove link"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>
            ))}
          {(onUrlSubmit != null || (multiLink && canAddMore)) && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.currentTarget
                const input = form.querySelector<HTMLInputElement>('input[name="url"]')
                const url = input?.value?.trim()
                if (!url) return
                if (multiLink && canAddMore) {
                  onUrlAdd(url)
                } else if (onUrlSubmit) {
                  onUrlSubmit(url)
                }
                form.reset()
              }}
              className="flex gap-2"
            >
              <input
                type="url"
                name="url"
                placeholder="Add link"
                className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                type="submit"
                disabled={disabled || (multiLink && !canAddMore)}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                Add link
              </button>
            </form>
          )}
          {multiLink && maxUrls > 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              You can add up to five links.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
