import { db } from '@/data/db'
import type { SyncTable } from '@/data/types'
import { supabase, isSyncConfigured } from './client'

const LAST_PULL_KEY = 'inkyo:last_pull'
const SYNC_TABLES: SyncTable[] = ['places', 'reels', 'trips', 'days', 'itinerary']

export type SyncResult = {
  pushed: number
  pulled: number
  skipped: boolean
}

function getLastPull(): string {
  return localStorage.getItem(LAST_PULL_KEY) ?? '1970-01-01T00:00:00.000Z'
}

function setLastPull(value: string) {
  localStorage.setItem(LAST_PULL_KEY, value)
}

async function sessionUserId(): Promise<string | null> {
  if (!supabase) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

async function pushOutbox(userId: string | null): Promise<number> {
  if (!supabase) return 0
  const entries = await db.outbox.orderBy('id').toArray()
  let pushed = 0
  for (const entry of entries) {
    const table = entry.table
    const local = await (db[table] as { get: (id: string) => Promise<unknown> }).get(entry.row_id)
    if (local) {
      const row = { ...(local as Record<string, unknown>), user_id: userId }
      const { error } = await supabase.from(table).upsert(row)
      if (error) throw error
      pushed += 1
    }
    if (entry.id != null) await db.outbox.delete(entry.id)
  }
  return pushed
}

async function pullShared(): Promise<number> {
  if (!supabase) return 0
  const since = getLastPull()
  let pulled = 0
  let newest = since
  for (const table of SYNC_TABLES) {
    const { data, error } = await supabase.from(table).select('*').gt('updated_at', since)
    if (error) throw error
    if (!data || data.length === 0) continue
    await db.transaction('rw', db[table], async () => {
      for (const remoteRow of data) {
        const row = remoteRow as { id: string; updated_at: string }
        const local = await (db[table] as { get: (id: string) => Promise<unknown> }).get(row.id)
        const localUpdated = (local as { updated_at?: string } | undefined)?.updated_at
        if (!localUpdated || localUpdated < row.updated_at) {
          await (db[table] as { put: (value: unknown) => Promise<unknown> }).put(remoteRow)
        }
        if (row.updated_at > newest) newest = row.updated_at
      }
    })
    pulled += data.length
  }
  setLastPull(newest)
  return pulled
}

export async function publishNow(): Promise<SyncResult> {
  if (!isSyncConfigured || !supabase) {
    return { pushed: 0, pulled: 0, skipped: true }
  }
  const userId = await sessionUserId()
  const pushed = await pushOutbox(userId)
  const pulled = await pullShared()
  return { pushed, pulled, skipped: false }
}

export async function refreshShared(): Promise<SyncResult> {
  if (!isSyncConfigured || !supabase) {
    return { pushed: 0, pulled: 0, skipped: true }
  }
  const pulled = await pullShared()
  return { pushed: 0, pulled, skipped: false }
}

export async function syncNow(): Promise<SyncResult> {
  return publishNow()
}

let publishTimer: ReturnType<typeof setTimeout> | null = null

export function schedulePublish(delay = 1000) {
  if (!isSyncConfigured) return
  if (publishTimer) clearTimeout(publishTimer)
  publishTimer = setTimeout(() => {
    publishTimer = null
    publishNow().catch((error) => console.error('[inkyo sync]', error))
  }, delay)
}
