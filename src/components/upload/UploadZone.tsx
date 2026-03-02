import { useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_VIDEO_TYPES } from '@/lib/constants'

type AcceptType = 'image' | 'video' | 'all'

interface UploadZoneProps {
  accept: AcceptType
  onFileSelect: (file: File) => void
  onUrlSubmit?: (url: string) => void
  disabled?: boolean
  className?: string
}

const acceptMap: Record<AcceptType, string> = {
  image: ACCEPTED_IMAGE_TYPES.join(','),
  video: ACCEPTED_VIDEO_TYPES.join(','),
  all: [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(','),
}

export function UploadZone({
  accept,
  onFileSelect,
  onUrlSubmit,
  disabled,
  className,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) onFileSelect(file)
    },
    [disabled, onFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFileSelect(file)
      e.target.value = ''
    },
    [onFileSelect]
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
      </div>
      {onUrlSubmit && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            const input = form.querySelector<HTMLInputElement>('input[name="url"]')
            const url = input?.value?.trim()
            if (url) {
              onUrlSubmit(url)
              form.reset()
            }
          }}
          className="flex gap-2"
        >
          <input
            type="url"
            name="url"
            placeholder="Or paste a URL"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add URL
          </button>
        </form>
      )}
    </div>
  )
}
