import type { FeatureCollection } from 'geojson'
import type { Place } from '@/data/types'

export function placesToGeoJson(places: Place[], selectedId?: string | null): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: places.map((place) => ({
      type: 'Feature',
      id: place.id,
      geometry: { type: 'Point', coordinates: [place.lng, place.lat] },
      properties: {
        id: place.id,
        name: place.name,
        glyph: place.category === 'shrine' ? '⛩' : '●',
        visited: place.visited,
        selected: place.id === selectedId,
        category: place.category ?? '',
      },
    })),
  }
}
