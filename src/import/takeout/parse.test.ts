import { describe, expect, it } from 'vitest'
import { extractCoordsFromUrl, parseCsvRows, parseTakeoutCsv, parseLabeledPlaces } from './parse'

describe('extractCoordsFromUrl', () => {
  it('reads the at-sign form', () => {
    expect(extractCoordsFromUrl('https://www.google.com/maps/@35.6812,139.7671,15z')).toEqual({
      lat: 35.6812,
      lng: 139.7671,
    })
  })

  it('reads the bang-3d/4d form', () => {
    expect(
      extractCoordsFromUrl('https://www.google.com/maps/place/X/data=!3d35.6812!4d139.7671'),
    ).toEqual({ lat: 35.6812, lng: 139.7671 })
  })

  it('reads the query form', () => {
    expect(extractCoordsFromUrl('https://maps.google.com/?q=35.6812,139.7671')).toEqual({
      lat: 35.6812,
      lng: 139.7671,
    })
  })

  it('returns null when absent', () => {
    expect(extractCoordsFromUrl('https://maps.google.com/?cid=123')).toBeNull()
  })
})

describe('parseCsvRows', () => {
  it('handles quoted fields and commas', () => {
    const rows = parseCsvRows('Title,Note\n"Sushi, Tokyo",good\n')
    expect(rows).toEqual([
      ['Title', 'Note'],
      ['Sushi, Tokyo', 'good'],
    ])
  })

  it('handles escaped quotes', () => {
    const rows = parseCsvRows('Title\n"He said ""hi"""\n')
    expect(rows[1]).toEqual(['He said "hi"'])
  })
})

describe('parseTakeoutCsv', () => {
  it('parses takeout rows and extracts coords', () => {
    const csv = [
      'Title,Note,URL,Comment',
      'Senso-ji,Temple,"https://www.google.com/maps/@35.7148,139.7967,17z",',
      'No coords place,,https://maps.google.com/?cid=999,',
    ].join('\n')
    const places = parseTakeoutCsv(csv, 'Japan')
    expect(places).toHaveLength(2)
    expect(places[0]).toMatchObject({
      name: 'Senso-ji',
      lat: 35.7148,
      lng: 139.7967,
      source_list: 'Japan',
      needsGeocode: false,
    })
    expect(places[1].needsGeocode).toBe(true)
  })

  it('returns empty for a csv without a header', () => {
    expect(parseTakeoutCsv('nonsense')).toEqual([])
  })
})

describe('parseLabeledPlaces', () => {
  it('parses geojson features', () => {
    const json = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [139.7671, 35.6812] },
          properties: { name: 'Home', address: 'Tokyo' },
        },
      ],
    }
    const places = parseLabeledPlaces(json)
    expect(places).toHaveLength(1)
    expect(places[0]).toMatchObject({ name: 'Home', lat: 35.6812, lng: 139.7671 })
  })
})
