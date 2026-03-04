const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

export interface UploadResult {
  url: string
  thumbnailUrl?: string
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  const url = new URL(`${API_BASE}/upload`, window.location.origin)
  const res = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
    // Do not set Content-Type; browser sets multipart/form-data with boundary
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message ?? 'Upload failed')
  }
  return res.json() as Promise<UploadResult>
}
