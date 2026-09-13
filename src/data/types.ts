export type PlaceSource = 'manual' | 'google_takeout' | 'google_maps' | 'instagram' | 'google_mymaps'

export type Place = {
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

export type Reel = {
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

export type Trip = {
  id: string
  user_id: string | null
  title: string
  start_date: string
  notes?: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type TripDay = {
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

export type ItineraryItem = {
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

export type SyncTable = 'places' | 'reels' | 'trips' | 'days' | 'itinerary'

export type OutboxEntry = {
  id?: number
  table: SyncTable
  row_id: string
  op: 'upsert' | 'delete'
  queued_at: string
}

export type ParsedPlace = {
  name: string
  lat: number | null
  lng: number | null
  address?: string
  notes?: string
  source: PlaceSource
  source_url?: string
  source_list?: string
  needsGeocode: boolean
}

export type ParsedReel = {
  url: string
  account?: string
  saved_at?: string
}
