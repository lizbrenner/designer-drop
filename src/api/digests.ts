import { api } from './client'
import type { DraftDigest, Digest } from '@/types/digest'

export async function getDraftDigest(): Promise<DraftDigest | null> {
  try {
    return await api.get<DraftDigest | null>('/digests/draft')
  } catch {
    return null
  }
}

export function publishDigest(payload: { draftId?: string; periodEnd?: string }): Promise<Digest> {
  return api.post<Digest>('/digests/publish', payload)
}

export function generateDigest(): Promise<DraftDigest> {
  return api.post<DraftDigest>('/digests/generate')
}

export function regenerateDigest(): Promise<DraftDigest> {
  return api.post<DraftDigest>('/digests/regenerate')
}

export function getDigests(): Promise<Digest[]> {
  return api.get<Digest[]>('/digests')
}

/** Extract "Copy-paste for Slack" section from digest markdown for one-click copy */
export function extractSlackSection(contentMd: string): string {
  const match = contentMd.match(/(?:## Copy-paste for Slack\n)([\s\S]*?)(?=\n## |\n$|$)/i)
  return match ? match[1].trim() : ''
}
