import { describe, expect, it } from 'vitest'
import {
  extractCoordsFromUrl,
  extractNameFromGoogleUrl,
  isGoogleMapsUrl,
  isInstagramUrl,
  parseLatLng,
  parsePlaceLink,
} from './linkParser'

describe('isInstagramUrl', () => {
  it('detects reels and posts', () => {
    expect(isInstagramUrl('https://www.instagram.com/reel/ABC123/')).toBe(true)
    expect(isInstagramUrl('https://www.instagram.com/p/XYZ/')).toBe(true)
    expect(isInstagramUrl('https://example.com/reel/ABC')).toBe(false)
  })
})

describe('isGoogleMapsUrl', () => {
  it('detects maps hosts', () => {
    expect(isGoogleMapsUrl('https://www.google.com/maps/@35.6,139.7,15z')).toBe(true)
    expect(isGoogleMapsUrl('https://maps.google.com/?cid=1')).toBe(true)
    expect(isGoogleMapsUrl('https://maps.app.goo.gl/abc')).toBe(true)
  })
})

describe('extractCoordsFromUrl', () => {
  it('handles at-sign, bang, and q forms', () => {
    expect(extractCoordsFromUrl('https://www.google.com/maps/@35.6812,139.7671,15z')).toEqual({
      lat: 35.6812,
      lng: 139.7671,
    })
    expect(extractCoordsFromUrl('https://x/!3d35.1!4d139.2')).toEqual({ lat: 35.1, lng: 139.2 })
    expect(extractCoordsFromUrl('https://maps.google.com/?q=35.1,139.2')).toEqual({
      lat: 35.1,
      lng: 139.2,
    })
  })
})

describe('parseLatLng', () => {
  it('parses comma and space separated pairs', () => {
    expect(parseLatLng('35.6812, 139.7671')).toEqual({ lat: 35.6812, lng: 139.7671 })
    expect(parseLatLng('35.6812 139.7671')).toEqual({ lat: 35.6812, lng: 139.7671 })
    expect(parseLatLng('not coords')).toBeNull()
    expect(parseLatLng('999, 999')).toBeNull()
  })
})

describe('extractNameFromGoogleUrl', () => {
  it('reads the place segment', () => {
    expect(
      extractNameFromGoogleUrl('https://www.google.com/maps/place/Senso-ji/@35.7,139.7,17z'),
    ).toBe('Senso-ji')
    expect(extractNameFromGoogleUrl('https://www.google.com/maps/place/Sushi+Daiwa/')).toBe(
      'Sushi Daiwa',
    )
    expect(extractNameFromGoogleUrl('https://maps.google.com/?q=35.1,139.2')).toBeNull()
  })
})

describe('parsePlaceLink', () => {
  it('parses a google maps link with coords and name', () => {
    const parsed = parsePlaceLink(
      'https://www.google.com/maps/place/Senso-ji/@35.7148,139.7967,17z',
    )
    expect(parsed).toMatchObject({
      source: 'google_maps',
      lat: 35.7148,
      lng: 139.7967,
      name: 'Senso-ji',
    })
  })

  it('parses an instagram link without coords', () => {
    const parsed = parsePlaceLink('https://www.instagram.com/reel/ABC123/')
    expect(parsed).toMatchObject({ source: 'instagram', lat: null, lng: null })
  })

  it('parses raw coordinates as a manual place', () => {
    expect(parsePlaceLink('35.0, 135.0')).toMatchObject({
      source: 'manual',
      lat: 35,
      lng: 135,
    })
  })
})
