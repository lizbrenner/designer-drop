import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DropForm } from '@/components/drop/DropForm'
import { UploadZone } from '@/components/upload/UploadZone'
import { useCreateDrop } from '@/hooks/useCreateDrop'
import { uploadFile } from '@/api/upload'
import type { CreateDropInput, DropType } from '@/types/drop'

export function UploadPage() {
  const navigate = useNavigate()
  const { create, loading, error } = useCreateDrop()
  const [selectedType, setSelectedType] = useState<DropType>('screenshot')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [links, setLinks] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (file: File) => {
    setUploadError(null)
    setUploading(true)
    try {
      const { url, thumbnailUrl } = await uploadFile(file)
      const resolved = thumbnailUrl ?? url
      setMediaUrls((prev) => (prev.length < 5 ? [...prev, resolved] : prev))
      setSelectedType(file.type.startsWith('video/') ? 'screen_recording' : 'screenshot')
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleFilesSelect = async (files: File[]) => {
    setUploadError(null)
    setUploading(true)
    try {
      for (const file of files) {
        const { url, thumbnailUrl } = await uploadFile(file)
        const resolved = thumbnailUrl ?? url
        setMediaUrls((prev) => (prev.length < 5 ? [...prev, resolved] : prev))
        setSelectedType(file.type.startsWith('video/') ? 'screen_recording' : 'screenshot')
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleUrlAdd = (url: string) => {
    setLinks((prev) => (prev.length < 5 ? [...prev, url] : prev))
    setSelectedType('url')
    setUploadError(null)
  }

  const handleUrlRemove = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  const buildPayload = (values: CreateDropInput): CreateDropInput => {
    const firstLink = links[0]
    const primaryMedia = mediaUrls[0]
    return {
      ...values,
      type: selectedType,
      ...(selectedType === 'screen_recording' && primaryMedia && { videoUrl: primaryMedia, thumbnailUrl: primaryMedia }),
      ...(selectedType === 'screenshot' && primaryMedia && { imageUrl: primaryMedia, thumbnailUrl: primaryMedia }),
      ...(selectedType === 'url' && firstLink && { url: firstLink }),
    }
  }

  const handleSubmit = async (values: CreateDropInput) => {
    const payload = buildPayload(values)
    const drop = await create(payload)
    navigate(`/drops/${drop.id}`)
  }

  const handleSaveDraft = async (values: CreateDropInput) => {
    const payload = buildPayload(values)
    await create(payload)
    navigate('/my-drops')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        New drop
      </h1>
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Add media
        </p>
        {uploadError && (
          <div
            className="mb-2 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
            role="alert"
          >
            {uploadError}
          </div>
        )}
        <UploadZone
          accept="all"
          onFileSelect={handleFileSelect}
          onFilesSelect={handleFilesSelect}
          maxFiles={5}
          urls={links}
          onUrlAdd={handleUrlAdd}
          onUrlRemove={handleUrlRemove}
          maxUrls={5}
          disabled={uploading}
        />
        {uploading && (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Uploading…</p>
        )}
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Details
        </p>
        {error && (
          <div
            className="mb-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
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
            url: links[0] ?? '',
            tags: [],
            mentionedUsers: [],
            project: '',
            labels: [],
            visibility: 'public',
          }}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          onCancel={() => navigate('/')}
          isLoading={loading}
          submitLabel="Publish Drop"
          hideType
          hideLink
        />
      </div>
    </div>
  )
}
