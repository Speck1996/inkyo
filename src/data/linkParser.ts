import type { PlaceSource } from '@/data/types'
import { isValidCoord } from '@/data/id'

export type ParsedLink = {
  source: PlaceSource
  lat: number | null
  lng: number | null
  name: string | null
  url: string
}

export function isInstagramUrl(url: string): boolean {
  return /instagram\.com\/(reel|reels|p|tv)\//i.test(url)
}

export function isGoogleMapsUrl(url: string): boolean {
  return /(google\.[a-z.]+\/maps|maps\.google\.|goo\.gl\/maps|maps\.app\.goo\.gl)/i.test(url)
}

export function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  const patterns: RegExp[] = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]center=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]destination=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      const lat = Number(match[1])
      const lng = Number(match[2])
      if (isValidCoord(lat, lng)) return { lat, lng }
    }
  }
  return null
}

export function parseLatLng(input: string): { lat: number; lng: number } | null {
  const match = input.trim().match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/)
  if (!match) return null
  const lat = Number(match[1])
  const lng = Number(match[2])
  return isValidCoord(lat, lng) ? { lat, lng } : null
}

export function extractNameFromGoogleUrl(url: string): string | null {
  const placeMatch = url.match(/\/maps\/place\/([^/@?]+)/)
  if (placeMatch) {
    const decoded = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim()
    if (decoded && !/^-?\d/.test(decoded)) return decoded
  }
  const queryMatch = url.match(/[?&](?:q|query)=([^&]+)/)
  if (queryMatch) {
    const decoded = decodeURIComponent(queryMatch[1].replace(/\+/g, ' ')).trim()
    if (decoded && !parseLatLng(decoded)) return decoded
  }
  return null
}

export function parsePlaceLink(input: string): ParsedLink {
  const url = input.trim()

  if (isInstagramUrl(url)) {
    const coords = extractCoordsFromUrl(url)
    return {
      source: 'instagram',
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      name: null,
      url,
    }
  }

  if (isGoogleMapsUrl(url)) {
    const coords = extractCoordsFromUrl(url)
    return {
      source: 'google_maps',
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      name: extractNameFromGoogleUrl(url),
      url,
    }
  }

  const coords = parseLatLng(url)
  if (coords) {
    return { source: 'manual', lat: coords.lat, lng: coords.lng, name: null, url }
  }

  return { source: 'manual', lat: null, lng: null, name: null, url }
}
