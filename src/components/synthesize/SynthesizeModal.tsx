import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSynthesis } from '@/api/syntheses'
import type { DatePreset } from '@/types/drop'
import type { SynthesisOutputType } from '@/api/syntheses'

const DATE_OPTIONS: { value: Exclude<DatePreset, 'all'>; label: string }[] = [
  { value: '3d', label: 'Last three days' },
  { value: '7d', label: 'Last week' },
  { value: '30d', label: 'Last month' },
  { value: '180d', label: 'Last six months' },
]

const OUTPUT_OPTIONS: { value: SynthesisOutputType; label: string }[] = [
  { value: 'colleague_update', label: 'Update for a colleague' },
  { value: 'performance_review', label: 'Professional milestone / performance review' },
  { value: 'other', label: 'Other' },
]

interface SynthesizeModalProps {
  open: boolean
  onClose: () => void
  userId: string | undefined
}

export function SynthesizeModal({ open, onClose, userId }: SynthesizeModalProps) {
  const navigate = useNavigate()
  const [datePreset, setDatePreset] = useState<Exclude<DatePreset, 'all'>>('7d')
  const [outputType, setOutputType] = useState<SynthesisOutputType>('colleague_update')
  const [includeMentioned, setIncludeMentioned] = useState(true)
  const [customOutputDescription, setCustomOutputDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!userId) return
    setError(null)
    setSubmitting(true)
    try {
      const synthesis = await createSynthesis({
        userId,
        datePreset,
        outputType,
        includeMentioned,
        ...(outputType === 'other' && customOutputDescription.trim() && { customOutputDescription: customOutputDescription.trim() }),
      })
      onClose()
      navigate(`/synthesized/${synthesis.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Synthesis failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="synthesize-title"
        className="relative w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <h2 id="synthesize-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Synthesize my work
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Generate a summary from your drops and work where you were tagged.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Time frame
            </label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as Exclude<DatePreset, 'all'>)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {DATE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={includeMentioned}
              onChange={(e) => setIncludeMentioned(e.target.checked)}
              className="mt-1 rounded border-zinc-300"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Include work where I&apos;ve contributed or been mentioned as a contributor in other people&apos;s drops
            </span>
          </label>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Output type
            </label>
            <select
              value={outputType}
              onChange={(e) => setOutputType(e.target.value as SynthesisOutputType)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {OUTPUT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {outputType === 'other' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Describe the type of output you want
              </label>
              <textarea
                value={customOutputDescription}
                onChange={(e) => setCustomOutputDescription(e.target.value)}
                placeholder="e.g. Executive summary for stakeholders, portfolio highlights for review..."
                rows={3}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          )}

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Synthesized outputs can be found in your admin panel.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !userId}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {submitting ? 'Synthesizing…' : 'Synthesize'}
          </button>
        </div>
      </div>
    </div>
  )
}
