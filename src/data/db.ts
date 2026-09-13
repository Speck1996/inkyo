import Dexie, { type Table } from 'dexie'
import type {
  ItineraryItem,
  OutboxEntry,
  Place,
  Reel,
  SyncTable,
  Trip,
  TripDay,
} from './types'

export type GeocodeCacheEntry = {
  query: string
  lat: number
  lng: number
  label: string
}

export class InkyoDb extends Dexie {
  places!: Table<Place, string>
  reels!: Table<Reel, string>
  trips!: Table<Trip, string>
  days!: Table<TripDay, string>
  itinerary!: Table<ItineraryItem, string>
  outbox!: Table<OutboxEntry, number>
  geocodeCache!: Table<GeocodeCacheEntry, string>

  constructor() {
    super('inkyo')
    this.version(1).stores({
      places: 'id, updated_at, deleted_at, source, *tags, visited',
      reels: 'id, updated_at, deleted_at, place_id',
      trips: 'id, updated_at, deleted_at',
      days: 'id, trip_id, date, [trip_id+position]',
      itinerary: 'id, day_id, [day_id+position], place_id',
      outbox: '++id, table, row_id',
      geocodeCache: 'query',
    })
  }

  async enqueue(table: SyncTable, rowId: string, op: 'upsert' | 'delete') {
    await this.outbox.add({
      table,
      row_id: rowId,
      op,
      queued_at: new Date().toISOString(),
    })
  }
}

export const db = new InkyoDb()
