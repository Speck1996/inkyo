# Inkyo Data Model

Shared public map: Dexie/IndexedDB is the local cache and works offline;
Supabase is the shared source of truth that all visitors read and write. Every
row carries `id`, `user_id` (nullable — anonymous writes have none),
`updated_at` (ISO 8601), `deleted_at` (ISO 8601 or null; soft delete).

There is **no per-user scoping**: the map is public and anyone may create,
edit, or delete places and reels (`supabase/migrations/0002_shared_map.sql`).

## Tables

### places
A saved location from any source.

```ts
type PlaceSource = 'manual' | 'google_takeout' | 'instagram' | 'google_mymaps'

type Place = {
  id: string
  user_id: string | null
  name: string
  name_ja?: string
  lat: number
  lng: number
  address?: string
  category?: string
  tags: string[]
  notes?: string
  source: PlaceSource
  source_url?: string
  source_list?: string
  visited: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}
```

### reels
An Instagram (or other) link pinned to a place. `place_id` is null until the
user completes the pin flow.

```ts
type Reel = {
  id: string
  user_id: string | null
  place_id: string | null
  url: string
  account?: string
  caption?: string
  thumbnail?: string
  saved_at?: string
  note?: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}
```

### trips
```ts
type Trip = {
  id: string
  user_id: string | null
  title: string
  start_date: string
  notes?: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}
```

### days
```ts
type TripDay = {
  id: string
  user_id: string | null
  trip_id: string
  date: string
  position: number
  title?: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}
```

### itinerary
Ordered stops within a day.

```ts
type ItineraryItem = {
  id: string
  user_id: string | null
  day_id: string
  place_id: string
  position: number
  start_time?: string
  duration_min?: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}
```

### outbox (local only)
Pending mutations for sync.

```ts
type OutboxEntry = {
  id?: number
  table: 'places' | 'reels' | 'trips' | 'days' | 'itinerary'
  row_id: string
  op: 'upsert' | 'delete'
  queued_at: string
}
```

## Dexie schema (version 1)

```
places:    id, updated_at, deleted_at, source, *tags, visited
reels:     id, updated_at, deleted_at, place_id
trips:     id, updated_at, deleted_at
days:      id, trip_id, date, [trip_id+position]
itinerary: id, day_id, [day_id+position], place_id
outbox:    ++id, table, row_id
```

## Sync rules

1. Writes go to Dexie first, always. UI never waits on network.
2. Each write enqueues an outbox entry and calls `schedulePublish()` (~1s
   debounce) which flushes the outbox and pulls remote changes.
3. `pullShared()` reads changes since `last_pulled_at` **including soft-deleted
   rows** (so deletions propagate), and applies last-write-wins on `updated_at`.
4. Deletes are soft: set `deleted_at`, never hard-delete synced rows.
5. Anonymous writes are allowed and stored with `user_id = null`.
