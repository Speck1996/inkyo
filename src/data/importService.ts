import { db } from './db'
import { createPlace, listPlaces } from './repository'
import { distanceMeters, isValidCoord, normalizeName } from './id'
import type { ParsedPlace, Place } from './types'

export type GeocodeResult = { lat: number; lng: number; label: string } | null

const NOMINATIM = 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'InkyoTripPlanner/0.1 (personal trip map)'

let lastRequestAt = 0

async function throttle() {
  const now = Date.now()
  const wait = Math.max(0, 1100 - (now - lastRequestAt))
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  lastRequestAt = Date.now()
}

export async function geocode(query: string): Promise<GeocodeResult> {
  const key = normalizeName(query)
  const cached = await db.geocodeCache.get(key)
  if (cached) return { lat: cached.lat, lng: cached.lng, label: cached.label }

  await throttle()
  const url = `${NOMINATIM}/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) return null
  const data = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>
  if (!data.length) return null
  const result = {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    label: data[0].display_name,
  }
  if (!isValidCoord(result.lat, result.lng)) return null
  await db.geocodeCache.put({ query: key, ...result })
  return result
}

export type ImportOutcome = {
  created: number
  skippedDuplicates: number
  needsGeocode: number
}

function findDuplicate(candidate: ParsedPlace, existing: Place[]): Place | undefined {
  if (candidate.lat == null || candidate.lng == null) {
    return existing.find((p) => normalizeName(p.name) === normalizeName(candidate.name))
  }
  return existing.find((p) => {
    if (normalizeName(p.name) !== normalizeName(candidate.name)) return false
    return distanceMeters(
      { lat: p.lat, lng: p.lng },
      { lat: candidate.lat as number, lng: candidate.lng as number },
    ) < 200
  })
}

export async function importParsedPlaces(parsed: ParsedPlace[]): Promise<ImportOutcome> {
  const existing = await listPlaces()
  let created = 0
  let skippedDuplicates = 0
  let needsGeocode = 0

  for (const candidate of parsed) {
    if (findDuplicate(candidate, existing)) {
      skippedDuplicates += 1
      continue
    }
    let { lat, lng } = candidate
    let address = candidate.address
    if ((lat == null || lng == null) && candidate.name) {
      const query = candidate.address ? `${candidate.name}, ${candidate.address}` : candidate.name
      const result = await geocode(query)
      if (result) {
        lat = result.lat
        lng = result.lng
        address = address ?? result.label
      }
    }
    if (lat == null || lng == null) {
      needsGeocode += 1
      continue
    }
    const place = await createPlace({
      name: candidate.name,
      lat,
      lng,
      address,
      notes: candidate.notes,
      category: undefined,
      tags: candidate.source_list ? [candidate.source_list] : [],
      source: candidate.source,
      source_url: candidate.source_url,
      source_list: candidate.source_list,
      visited: false,
    })
    existing.push(place)
    created += 1
  }

  return { created, skippedDuplicates, needsGeocode }
}
