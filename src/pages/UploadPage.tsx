import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DropForm } from '@/components/drop/DropForm'
import { UploadZone } from '@/components/upload/UploadZone'
import { useCreateDrop } from '@/hooks/useCreateDrop'
import type { CreateDropInput, DropType } from '@/types/drop'
import { DROP_TYPES } from '@/lib/constants'

export function UploadPage() {
  const navigate = useNavigate()
  const { create, loading, error } = useCreateDrop()
  const [step, setStep] = useState<'type' | 'media' | 'form'>('type')
  const [selectedType, setSelectedType] = useState<DropType>('screenshot')
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    // In a real app you would upload the file to your backend and get a URL.
    const url = URL.createObjectURL(file)
    setMediaUrl(url)
    setStep('form')
  }

  const handleUrlSubmit = (url: string) => {
    setMediaUrl(url)
    setStep('form')
  }

  const handleSubmit = async (values: CreateDropInput) => {
    const payload: CreateDropInput = {
      ...values,
      type: selectedType,
      ...(selectedType === 'screen_recording' && mediaUrl && { videoUrl: mediaUrl, thumbnailUrl: mediaUrl }),
      ...(selectedType === 'screenshot' && mediaUrl && { imageUrl: mediaUrl, thumbnailUrl: mediaUrl }),
      ...(selectedType === 'url' && mediaUrl && { url: mediaUrl }),
    }
    const drop = await create(payload)
    navigate(`/drops/${drop.id}`)
  }

  if (step === 'type') {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          New drop
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          What are you sharing?
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {DROP_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setSelectedType(value)
                setStep('media')
              }}
              className="rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'media') {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          type="button"
          onClick={() => setStep('type')}
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Add your {selectedType === 'url' ? 'link' : 'file'}
        </h1>
        <UploadZone
          accept={selectedType === 'screen_recording' ? 'video' : selectedType === 'screenshot' ? 'image' : 'all'}
          onFileSelect={handleFileSelect}
          onUrlSubmit={selectedType === 'url' ? handleUrlSubmit : undefined}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={() => setStep('media')}
        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← Back
      </button>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Details
      </h1>
      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          role="alert"
        >
          {error.message}
        </div>
      )}
      <DropForm
        initialValues={{
          type: selectedType,
          title: '',
          description: '',
          tags: [],
          mentionedUsers: [],
          project: '',
          labels: [],
          visibility: 'public',
        }}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
        isLoading={loading}
        submitLabel="Create drop"
      />
    </div>
  )
}
