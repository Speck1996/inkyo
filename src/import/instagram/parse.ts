import type { ParsedReel } from '@/data/types'

type SavedPost = {
  title?: string
  media?: unknown
  creation_timestamp?: number
  string_map_data?: Record<string, { value?: string; href?: string; timestamp?: number }>
}

function firstHref(map: Record<string, { href?: string }> | undefined): string | undefined {
  if (!map) return undefined
  for (const key of Object.keys(map)) {
    const href = map[key]?.href
    if (href) return href
  }
  return undefined
}

function firstTimestamp(map: Record<string, { timestamp?: number }> | undefined): number | undefined {
  if (!map) return undefined
  for (const key of Object.keys(map)) {
    const ts = map[key]?.timestamp
    if (typeof ts === 'number') return ts
  }
  return undefined
}

export function parseSavedPosts(json: unknown): ParsedReel[] {
  if (json == null || typeof json !== 'object') return []
  const root = json as { saved_saved_posts?: unknown[] }
  const items = Array.isArray(root.saved_saved_posts) ? root.saved_saved_posts : []
  const results: ParsedReel[] = []

  for (const raw of items as SavedPost[]) {
    const href = firstHref(raw.string_map_data)
    if (!href) continue
    const timestamp = firstTimestamp(raw.string_map_data) ?? raw.creation_timestamp
    results.push({
      url: href,
      account: raw.title,
      saved_at: timestamp != null ? new Date(timestamp * 1000).toISOString() : undefined,
    })
  }
  return results
}

export function parseSavedCollections(json: unknown): { name: string; urls: string[] }[] {
  if (json == null || typeof json !== 'object') return []
  const root = json as { saved_saved_collections?: unknown[] }
  const items = Array.isArray(root.saved_saved_collections) ? root.saved_saved_collections : []
  const results: { name: string; urls: string[] }[] = []

  for (const raw of items as {
    title?: string
    string_map_data?: Record<string, { href?: string }>
    media?: { string_map_data?: Record<string, { href?: string }> }[]
  }[]) {
    const name = raw.title ?? 'Collection'
    const urls: string[] = []
    const direct = firstHref(raw.string_map_data)
    if (direct) urls.push(direct)
    results.push({ name, urls })
  }
  return results
}
