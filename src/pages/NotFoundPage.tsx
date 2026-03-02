import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        404 – Page not found
      </h1>
      <Link
        to="/"
        className="text-sm font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Back to gallery
      </Link>
    </div>
  )
}
