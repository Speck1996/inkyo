import { db } from './db'
import { newId, nowIso } from './id'
import { schedulePublish } from '@/sync/engine'
import type { Place, Reel, Trip, TripDay, ItineraryItem } from './types'

export type NewPlace = Omit<Place, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'user_id'> & {
  user_id?: string | null
}

export async function createPlace(input: NewPlace): Promise<Place> {
  const now = nowIso()
  const place: Place = {
    ...input,
    id: newId(),
    user_id: input.user_id ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }
  await db.transaction('rw', db.places, db.outbox, async () => {
    await db.places.add(place)
    await db.enqueue('places', place.id, 'upsert')
    schedulePublish()
  })
  return place
}

export async function updatePlace(id: string, patch: Partial<Place>): Promise<void> {
  await db.transaction('rw', db.places, db.outbox, async () => {
    await db.places.update(id, { ...patch, updated_at: nowIso() })
    await db.enqueue('places', id, 'upsert')
    schedulePublish()
  })
}

export async function softDeletePlace(id: string): Promise<void> {
  await db.transaction('rw', db.places, db.outbox, async () => {
    await db.places.update(id, { deleted_at: nowIso(), updated_at: nowIso() })
    await db.enqueue('places', id, 'delete')
    schedulePublish()
  })
}

export async function listPlaces(): Promise<Place[]> {
  const all = await db.places.toArray()
  return all.filter((p) => p.deleted_at == null)
}

export type NewReel = Omit<Reel, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'user_id'> & {
  user_id?: string | null
}

export async function createReel(input: NewReel): Promise<Reel> {
  const now = nowIso()
  const reel: Reel = {
    ...input,
    id: newId(),
    user_id: input.user_id ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }
  await db.transaction('rw', db.reels, db.outbox, async () => {
    await db.reels.add(reel)
    await db.enqueue('reels', reel.id, 'upsert')
    schedulePublish()
  })
  return reel
}

export async function updateReel(id: string, patch: Partial<Reel>): Promise<void> {
  await db.transaction('rw', db.reels, db.outbox, async () => {
    await db.reels.update(id, { ...patch, updated_at: nowIso() })
    await db.enqueue('reels', id, 'upsert')
    schedulePublish()
  })
}

export async function listReels(): Promise<Reel[]> {
  const all = await db.reels.toArray()
  return all.filter((r) => r.deleted_at == null)
}

export async function softDeleteReel(id: string): Promise<void> {
  await db.transaction('rw', db.reels, db.outbox, async () => {
    await db.reels.update(id, { deleted_at: nowIso(), updated_at: nowIso() })
    await db.enqueue('reels', id, 'delete')
    schedulePublish()
  })
}

export type NewTrip = Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'user_id'> & {
  user_id?: string | null
}

export async function createTrip(input: NewTrip): Promise<Trip> {
  const now = nowIso()
  const trip: Trip = {
    ...input,
    id: newId(),
    user_id: input.user_id ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }
  await db.transaction('rw', db.trips, db.outbox, async () => {
    await db.trips.add(trip)
    await db.enqueue('trips', trip.id, 'upsert')
    schedulePublish()
  })
  return trip
}

export async function createDay(
  input: Omit<TripDay, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'user_id'> & {
    user_id?: string | null
  },
): Promise<TripDay> {
  const now = nowIso()
  const day: TripDay = {
    ...input,
    id: newId(),
    user_id: input.user_id ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }
  await db.transaction('rw', db.days, db.outbox, async () => {
    await db.days.add(day)
    await db.enqueue('days', day.id, 'upsert')
    schedulePublish()
  })
  return day
}

export async function listDays(tripId: string): Promise<TripDay[]> {
  const all = await db.days.where('trip_id').equals(tripId).toArray()
  return all
    .filter((d) => d.deleted_at == null)
    .sort((a, b) => a.position - b.position)
}

export async function createItineraryItem(
  input: Omit<ItineraryItem, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'user_id'> & {
    user_id?: string | null
  },
): Promise<ItineraryItem> {
  const now = nowIso()
  const item: ItineraryItem = {
    ...input,
    id: newId(),
    user_id: input.user_id ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }
  await db.transaction('rw', db.itinerary, db.outbox, async () => {
    await db.itinerary.add(item)
    await db.enqueue('itinerary', item.id, 'upsert')
    schedulePublish()
  })
  return item
}

export async function listItinerary(dayId: string): Promise<ItineraryItem[]> {
  const all = await db.itinerary.where('day_id').equals(dayId).toArray()
  return all
    .filter((i) => i.deleted_at == null)
    .sort((a, b) => a.position - b.position)
}

export async function updateItineraryItem(
  id: string,
  patch: Partial<ItineraryItem>,
): Promise<void> {
  await db.transaction('rw', db.itinerary, db.outbox, async () => {
    await db.itinerary.update(id, { ...patch, updated_at: nowIso() })
    await db.enqueue('itinerary', id, 'upsert')
    schedulePublish()
  })
}

export async function softDeleteItineraryItem(id: string): Promise<void> {
  await db.transaction('rw', db.itinerary, db.outbox, async () => {
    await db.itinerary.update(id, { deleted_at: nowIso(), updated_at: nowIso() })
    await db.enqueue('itinerary', id, 'delete')
    schedulePublish()
  })
}
