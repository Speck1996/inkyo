import type { Place } from '@/data/types'

export type RouteLeg = {
  fromPlaceId: string
  toPlaceId: string
  distanceMeters: number
  durationSeconds: number
}

export type RouteResult = {
  coordinates: [number, number][]
  legs: RouteLeg[]
  totalDistanceMeters: number
  totalDurationSeconds: number
}

const OSRM_BASE = 'https://router.project-osrm.org'

export async function routeThroughPlaces(places: Place[]): Promise<RouteResult | null> {
  if (places.length < 2) return null
  const coords = places.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson`
  const response = await fetch(url)
  if (!response.ok) return null
  const data = (await response.json()) as {
    routes?: {
      geometry?: { coordinates?: [number, number][] }
      legs?: { distance: number; duration: number }[]
      distance: number
      duration: number
    }[]
  }
  const route = data.routes?.[0]
  if (!route) return null

  const legs: RouteLeg[] = (route.legs ?? []).map((leg, index) => ({
    fromPlaceId: places[index].id,
    toPlaceId: places[index + 1]?.id ?? '',
    distanceMeters: leg.distance,
    durationSeconds: leg.duration,
  }))

  return {
    coordinates: route.geometry?.coordinates ?? [],
    legs,
    totalDistanceMeters: route.distance,
    totalDurationSeconds: route.duration,
  }
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}
