import { api } from './client'
import type { Drop, CreateDropInput, UpdateDropInput, DropsFilter } from '@/types/drop'

export async function getDrops(filters?: DropsFilter): Promise<Drop[]> {
  const params: Record<string, string> = {}
  if (filters?.tag) params.tag = filters.tag
  if (filters?.mentionedUserId) params.mentionedUserId = filters.mentionedUserId
  if (filters?.project) params.project = filters.project
  if (filters?.dateFrom) params.dateFrom = filters.dateFrom
  if (filters?.dateTo) params.dateTo = filters.dateTo
  if (filters?.includePrivate) params.includePrivate = 'true'
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
