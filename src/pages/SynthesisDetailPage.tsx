import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getSynthesis } from '@/api/syntheses'
import type { UserSynthesis } from '@/api/syntheses'

function MdLink({ href, children }: { href?: string; children?: React.ReactNode }) {
  if (href?.startsWith('/')) {
    return <Link to={href}>{children}</Link>
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

const OUTPUT_LABELS: Record<string, string> = {
  colleague_update: 'Update for a colleague',
  performance_review: 'Professional milestone / performance review',
  other: 'Other',
}

export function SynthesisDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [synthesis, setSynthesis] = useState<UserSynthesis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    getSynthesis(id)
      .then(setSynthesis)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading || !id) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    )
  }

  if (error || !synthesis) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <p className="text-red-600 dark:text-red-400">{error ?? 'Not found'}</p>
        <Link to="/synthesized" className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100">
          Back to Synthesized work
        </Link>
      </div>
    )
  }

  const dateRange = `${new Date(synthesis.periodStart).toLocaleDateString()} – ${new Date(synthesis.periodEnd).toLocaleDateString()}`

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to="/synthesized"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Synthesized work
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {OUTPUT_LABELS[synthesis.outputType] ?? synthesis.outputType}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {dateRange}
        </p>
      </div>

      <div className="prose prose-sm max-w-none dark:prose-invert description-view">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{ a: ({ href, children }) => <MdLink href={href}>{children}</MdLink> }}
        >
          {synthesis.contentMd}
        </ReactMarkdown>
      </div>

      {synthesis.sourceDrops && synthesis.sourceDrops.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Sources</h2>
          <ul className="mt-2 space-y-1">
            {synthesis.sourceDrops.map((d) => (
              <li key={d.id}>
                <Link
                  to={`/drops/${d.id}`}
                  className="text-sm text-zinc-700 underline hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                >
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
