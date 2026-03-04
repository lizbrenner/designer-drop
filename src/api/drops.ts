import { api } from './client'
import type { Drop, CreateDropInput, UpdateDropInput, DropsFilter } from '@/types/drop'

function getDateRangeFromPreset(preset: string): { dateFrom: string; dateTo: string } | null {
  const now = new Date()
  const to = now.toISOString().slice(0, 10)
  const day = 24 * 60 * 60 * 1000
  let fromDate: Date
  switch (preset) {
    case '3d':
      fromDate = new Date(now.getTime() - 3 * day)
      break
    case '7d':
      fromDate = new Date(now.getTime() - 7 * day)
      break
    case '30d':
      fromDate = new Date(now.getTime() - 30 * day)
      break
    case '180d':
      fromDate = new Date(now.getTime() - 180 * day)
      break
    default:
      return null
  }
  return { dateFrom: fromDate.toISOString().slice(0, 10), dateTo: to }
}

export async function getDrops(filters?: DropsFilter): Promise<Drop[]> {
  const params: Record<string, string> = {}
  if (filters?.tag) params.tag = filters.tag
  if (filters?.mentionedUserId) params.mentionedUserId = filters.mentionedUserId
  if (filters?.project) params.project = filters.project
  if (filters?.datePreset && filters.datePreset !== 'all') {
    const range = getDateRangeFromPreset(filters.datePreset)
    if (range) {
      params.dateFrom = range.dateFrom
      params.dateTo = range.dateTo
    }
  } else {
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom
    if (filters?.dateTo) params.dateTo = filters.dateTo
  }
  if (filters?.includePrivate) params.includePrivate = 'true'
  if (filters?.forYou) params.forYou = 'true'
  if (filters?.userId) params.userId = filters.userId
  if (filters?.ownerId) params.ownerId = filters.ownerId
  try {
    return await api.get<Drop[]>('/drops', { params })
  } catch {
    return []
  }
}

export function getDrop(id: string): Promise<Drop> {
  return api.get<Drop>(`/drops/${id}`)
}

export function createDrop(input: CreateDropInput): Promise<Drop> {
  return api.post<Drop>('/drops', input)
}

export function updateDrop(id: string, input: UpdateDropInput): Promise<Drop> {
  return api.put<Drop>(`/drops/${id}`, input)
}

export function deleteDrop(id: string): Promise<void> {
  return api.delete(`/drops/${id}`)
}

export interface RelatedDrop {
  drop: Drop
  score?: number
  reason?: string
}

export function getRelatedDrops(id: string, limit?: number): Promise<RelatedDrop[]> {
  const params: Record<string, string> = {}
  if (limit != null) params.limit = String(limit)
  try {
    return api.get<RelatedDrop[]>(`/drops/${id}/related`, { params })
  } catch {
    return []
  }
}
