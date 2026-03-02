import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Gallery' },
  { to: '/upload', label: 'Upload' },
  { to: '/my-drops', label: 'My drops' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden w-52 shrink-0 border-r border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 md:block">
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              location.pathname === to
                ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
