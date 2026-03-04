import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function Header() {
  const { user, isAuthenticated } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="flex h-14 w-full items-center px-4 md:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
          Designer Drop
        </Link>
        <nav className="flex flex-1 items-center justify-center gap-6 pl-8">
          <Link
            to="/"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Gallery
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/my-drops"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                My drops
              </Link>
              <Link
                to="/digest"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Digest
              </Link>
            </>
          )}
        </nav>
        {isAuthenticated && (
          <div className="flex shrink-0 items-center gap-4">
            <Link
              to="/upload"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Create Drop
            </Link>
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600'
                  )}
                  title={user.displayName}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    <Link
                      to="/synthesized"
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Synthesized work
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
