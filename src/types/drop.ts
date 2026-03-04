export type DropType = 'screen_recording' | 'screenshot' | 'url'

export type DropVisibility = 'public' | 'private' | 'draft'

export interface MentionedUser {
  id: string
  displayName: string
  avatarUrl?: string
}

export interface Drop {
  id: string
  ownerId: string
  ownerDisplayName: string
  ownerAvatarUrl?: string
  type: DropType
  title: string
  description?: string
  videoUrl?: string
  imageUrl?: string
  url?: string
  thumbnailUrl?: string
  tags: string[]
  mentionedUserIds: string[]
  mentionedUsers?: MentionedUser[]
  project?: string
  labels: string[]
  createdAt: string
  updatedAt: string
  visibility: DropVisibility
}

export interface CreateDropInput {
  type: DropType
  title: string
  description?: string
  videoUrl?: string
  imageUrl?: string
  url?: string
  thumbnailUrl?: string
  tags: string[]
  mentionedUserIds: string[]
  project?: string
  labels: string[]
  visibility: DropVisibility
}

export interface UpdateDropInput {
  title?: string
  description?: string
  tags?: string[]
  mentionedUserIds?: string[]
  project?: string
  labels?: string[]
  visibility?: DropVisibility
}

export type DatePreset = 'all' | '3d' | '7d' | '30d' | '180d'

export interface DropsFilter {
  tag?: string
  mentionedUserId?: string
  project?: string
  dateFrom?: string
  dateTo?: string
  /** Preset date range; when set, API client derives dateFrom/dateTo from it. */
  datePreset?: DatePreset
  includePrivate?: boolean
  forYou?: boolean
  userId?: string
  /** When set, returns only this owner's drops (all visibilities, including drafts) for "My Drops" */
  ownerId?: string
}
