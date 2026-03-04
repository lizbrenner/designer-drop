import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { listSyntheses } from '@/api/syntheses'
import { SynthesizeModal } from '@/components/synthesize/SynthesizeModal'
import type { UserSynthesis } from '@/api/syntheses'

const OUTPUT_LABELS: Record<string, string> = {
  colleague_update: 'Update for a colleague',
  performance_review: 'Professional milestone / performance review',
  other: 'Other',
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const e = new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return `${s} – ${e}`
}

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function SynthesizedPage() {
  const { user } = useAuth()
  const [syntheses, setSyntheses] = useState<UserSynthesis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [synthesizeOpen, setSynthesizeOpen] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    listSyntheses(user.id)
      .then(setSyntheses)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [user?.id])

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <p className="text-zinc-600 dark:text-zinc-400">Sign in to view your synthesized work.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Synthesized work
        </h1>
        <button
          type="button"
          onClick={() => setSynthesizeOpen(true)}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Synthesize work
        </button>
      </div>
      <SynthesizeModal
        open={synthesizeOpen}
        onClose={() => setSynthesizeOpen(false)}
        userId={user?.id}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {error.includes('user_syntheses') || error.includes('schema cache')
            ? "Synthesized work isn't set up yet. Run the database migration in Supabase (SQL Editor): see docs/supabase-user-syntheses-table.sql"
            : error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : syntheses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-12 dark:border-zinc-600 dark:bg-zinc-800/50">
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            AI collects and synthesizes activity from any work you&apos;ve uploaded or where you&apos;ve been identified as a relevant contributor, then compiles it into a clear overview. Once created, your synthesized reports will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Time frame</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Type</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Created</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300" />
              </tr>
            </thead>
            <tbody>
              {syntheses.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {formatDateRange(s.periodStart, s.periodEnd)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {OUTPUT_LABELS[s.outputType] ?? s.outputType}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">
                    {formatCreatedAt(s.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/synthesized/${s.id}`}
                      className="font-medium text-zinc-900 underline dark:text-zinc-100"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
