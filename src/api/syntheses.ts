import { api } from './client'

export type SynthesisOutputType = 'colleague_update' | 'performance_review' | 'other'

export interface UserSynthesis {
  id: string
  userId: string
  periodStart: string
  periodEnd: string
  outputType: string
  contentMd: string
  sourceIds: string[]
  sourceDrops?: { id: string; title: string }[]
  createdAt: string
}

export interface CreateSynthesisInput {
  userId: string
  datePreset?: string
  periodStart?: string
  periodEnd?: string
  outputType?: SynthesisOutputType
  /** Include drops where user was mentioned as contributor (default true). */
  includeMentioned?: boolean
  /** When outputType is 'other', describe the type of output you want. */
  customOutputDescription?: string
}

export function listSyntheses(userId: string): Promise<UserSynthesis[]> {
  return api.get<UserSynthesis[]>('/syntheses', { params: { userId } })
}

export function getSynthesis(id: string): Promise<UserSynthesis> {
  return api.get<UserSynthesis>(`/syntheses/${id}`)
}

export function createSynthesis(input: CreateSynthesisInput): Promise<UserSynthesis> {
  return api.post<UserSynthesis>('/syntheses', input)
}
