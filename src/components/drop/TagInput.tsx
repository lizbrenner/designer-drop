import { useCallback, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { User } from '@/types/user'

interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export function TagInput({ tags, onTagsChange, placeholder = 'Add tags...', className }: TagInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = useCallback(
    (tag: string) => {
      const t = tag.trim().toLowerCase()
      if (t && !tags.includes(t)) {
        onTagsChange([...tags, t])
        setValue('')
      }
    },
    [tags, onTagsChange]
  )

  const removeTag = useCallback(
    (index: number) => {
      onTagsChange(tags.filter((_, i) => i !== index))
    },
    [tags, onTagsChange]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(value)
    } else if (e.key === 'Backspace' && !value && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  return (
    <div
      className={cn(
        'flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-800',
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-sm dark:bg-zinc-700"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={(e) => {
              e.stopPropagation()
              removeTag(i)
            }}
            className="ml-0.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => value && addTag(value)}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
      />
    </div>
  )
}

interface MentionInputProps {
  mentionedUsers: User[]
  onMentionedUsersChange: (users: User[]) => void
  onSearch: (query: string) => Promise<User[]>
  placeholder?: string
  className?: string
}

export function MentionInput({
  mentionedUsers,
  onMentionedUsersChange,
  onSearch,
  placeholder = 'Type @ to mention...',
  className,
}: MentionInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch(query).then((users) => {
        setResults(users.filter((u) => !mentionedUsers.some((m) => m.id === u.id)))
        setOpen(true)
      })
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, mentionedUsers, onSearch])

  const addMention = (user: User) => {
    if (!mentionedUsers.some((m) => m.id === user.id)) {
      onMentionedUsersChange([...mentionedUsers, user])
    }
    setQuery('')
    setOpen(false)
  }

  const removeMention = (id: string) => {
    onMentionedUsersChange(mentionedUsers.filter((u) => u.id !== id))
  }

  return (
    <div className={cn('relative', className)}>
      <div className="flex flex-wrap gap-1.5 rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-600 dark:bg-zinc-800">
        {mentionedUsers.map((u) => (
          <span
            key={u.id}
            className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-sm dark:bg-blue-900/40"
          >
            @{u.displayName}
            <button
              type="button"
              aria-label={`Remove ${u.displayName}`}
              onClick={() => removeMention(u.id)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder={placeholder}
          className="min-w-[140px] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />
      </div>
      {open && results.length > 0 && (
        <ul
          className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
          role="listbox"
        >
          {results.map((u) => (
            <li key={u.id} role="option">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                onClick={() => addMention(u)}
              >
                {u.displayName}
                {u.email && <span className="ml-2 text-zinc-500">{u.email}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
