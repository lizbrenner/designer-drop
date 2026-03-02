import type { DropType, DropVisibility } from '@/types/drop'

export const DROP_TYPES: { value: DropType; label: string }[] = [
  { value: 'screen_recording', label: 'Screen recording' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'url', label: 'URL' },
]

export const VISIBILITY_OPTIONS: { value: DropVisibility; label: string }[] = [
  { value: 'public', label: 'Public (Cognite users)' },
  { value: 'private', label: 'Private (only me)' },
]

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm']
