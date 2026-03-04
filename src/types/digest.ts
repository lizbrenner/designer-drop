export interface DraftDigest {
  id: string
  periodStart: string
  periodEnd: string
  contentMd: string
  createdAt: string
  createdBy?: string
}

export interface Digest {
  id: string
  periodStart: string
  periodEnd: string
  contentMd: string
  publishedAt: string
  publishedBy?: string
}
