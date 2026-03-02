export type DropType = 'screen_recording' | 'screenshot' | 'url'

export type DropVisibility = 'public' | 'private'

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

export interface DropsFilter {
  tag?: string
  mentionedUserId?: string
  project?: string
  dateFrom?: string
  dateTo?: string
  includePrivate?: boolean
}
