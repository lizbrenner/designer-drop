import { api } from './client'
import type { User } from '@/types/user'

export async function searchUsers(query: string): Promise<User[]> {
  try {
    return await api.get<User[]>('/users/search', { params: { q: query } })
  } catch {
    return []
  }
}

export function getUser(id: string): Promise<User> {
  return api.get<User>(`/users/${id}`)
}
