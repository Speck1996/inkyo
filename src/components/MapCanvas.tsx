import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { buildUkiyoStyle, JAPAN_BOUNDS } from '@/map/ukiyoStyle'
import { placesToGeoJson } from '@/map/placesGeoJson'
import { useAppStore } from '@/app/store'
import type { Place } from '@/data/types'

export type MapCanvasProps = {
  places: Place[]
  route?: [number, number][]
  selectedPlaceId?: string | null
  onSelectPlace?: (id: string | null) => void
}

const EMPTY_ROUTE = { type: 'FeatureCollection' as const, features: [] }

export function MapCanvas({ places, route, selectedPlaceId, onSelectPlace }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const placesRef = useRef<Place[]>(places)
  const routeRef = useRef<[number, number][] | undefined>(route)
  const selectedRef = useRef<string | null | undefined>(selectedPlaceId)
  const selectRef = useRef(onSelectPlace)
  const [failed, setFailed] = useState(false)
  const showMarkers = useAppStore((s) => s.showArtLayer)

  placesRef.current = places
  routeRef.current = route
  selectedRef.current = selectedPlaceId
  selectRef.current = onSelectPlace

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: buildUkiyoStyle(),
        bounds: JAPAN_BOUNDS,
        fitBoundsOptions: { padding: 32, duration: 0 },
        maxBounds: [
          [JAPAN_BOUNDS[0][0] - 4, JAPAN_BOUNDS[0][1] - 4],
          [JAPAN_BOUNDS[1][0] + 4, JAPAN_BOUNDS[1][1] + 4],
        ],
        attributionControl: { compact: true },
      })
    } catch (error) {
      console.error('[inkyo map] failed to initialize', error)
      setFailed(true)
      return
    }

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')
    mapRef.current = map

    map.on('error', (event) => {
      console.error('[inkyo map]', event.error)
    })

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)

    const syncData = () => {
      const placeSource = map.getSource('inkyo-places') as maplibregl.GeoJSONSource | undefined
      placeSource?.setData(placesToGeoJson(placesRef.current, selectedRef.current))
      const routeSource = map.getSource('inkyo-route') as maplibregl.GeoJSONSource | undefined
      const currentRoute = routeRef.current
      routeSource?.setData(
        currentRoute && currentRoute.length >= 2
          ? {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: currentRoute },
            }
          : EMPTY_ROUTE,
      )
    }

    map.on('load', () => {
      map.addSource('inkyo-route', { type: 'geojson', data: EMPTY_ROUTE })
      map.addLayer(
        {
          id: 'inkyo-route-line',
          type: 'line',
          source: 'inkyo-route',
          paint: {
            'line-color': '#c1352f',
            'line-width': 3,
            'line-dasharray': [2, 1.5],
            'line-opacity': 0.9,
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        },
        'inkyo-place-halo',
      )
      syncData()
      map.resize()
    })

    map.on('click', 'inkyo-place-circles', (event) => {
      const id = event.features?.[0]?.properties?.id
      if (typeof id === 'string') selectRef.current?.(id)
    })
    map.on('mouseenter', 'inkyo-place-circles', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'inkyo-place-circles', () => {
      map.getCanvas().style.cursor = ''
    })

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const source = map.getSource('inkyo-places') as maplibregl.GeoJSONSource | undefined
    source?.setData(placesToGeoJson(places, selectedPlaceId))
  }, [places, selectedPlaceId])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedPlaceId || !map.isStyleLoaded()) return
    const place = places.find((p) => p.id === selectedPlaceId)
    if (place) {
      map.flyTo({ center: [place.lng, place.lat], zoom: Math.max(map.getZoom(), 11), duration: 700 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlaceId])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const source = map.getSource('inkyo-route') as maplibregl.GeoJSONSource | undefined
    if (!source) return
    source.setData(
      route && route.length >= 2
        ? {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: route },
          }
        : EMPTY_ROUTE,
    )
  }, [route])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    for (const id of ['inkyo-place-halo', 'inkyo-place-circles', 'inkyo-place-labels']) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', showMarkers ? 'visible' : 'none')
      }
    }
  }, [showMarkers])

  if (failed) {
    return (
      <div className="map-error">
        <div>
          <h2>Map unavailable</h2>
          <p>
            This browser could not create a WebGL context. Enable hardware acceleration or try
            another browser. Your places and planner still work.
          </p>
        </div>
      </div>
    )
  }

  return <div ref={containerRef} className="map-canvas" />
}
