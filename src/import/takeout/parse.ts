import type { ParsedPlace } from '@/data/types'
import { isValidCoord } from '@/data/id'
import { extractCoordsFromUrl } from '@/data/linkParser'

export { extractCoordsFromUrl }

export function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i]
    if (inQuotes) {
      if (char === '"') {
        if (csv[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && csv[i + 1] === '\n') i += 1
      row.push(field)
      field = ''
      if (row.some((cell) => cell.length > 0)) rows.push(row)
      row = []
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    if (row.some((cell) => cell.length > 0)) rows.push(row)
  }
  return rows
}

type HeaderIndex = {
  title: number
  note: number
  url: number
  comment: number
}

function findHeader(rows: string[][]): { headerIndex: HeaderIndex; dataRows: string[][] } | null {
  for (let i = 0; i < rows.length; i += 1) {
    const cells = rows[i].map((cell) => cell.trim().toLowerCase())
    const title = cells.indexOf('title')
    const url = cells.indexOf('url')
    if (title !== -1 && url !== -1) {
      return {
        headerIndex: {
          title,
          url,
          note: cells.indexOf('note'),
          comment: cells.indexOf('comment'),
        },
        dataRows: rows.slice(i + 1),
      }
    }
  }
  return null
}

export function parseTakeoutCsv(csv: string, listName?: string): ParsedPlace[] {
  const rows = parseCsvRows(csv)
  const header = findHeader(rows)
  if (!header) return []

  const { headerIndex, dataRows } = header
  const results: ParsedPlace[] = []
  for (const row of dataRows) {
    const name = (row[headerIndex.title] ?? '').trim()
    if (!name) continue
    const url = (row[headerIndex.url] ?? '').trim()
    const note = headerIndex.note >= 0 ? (row[headerIndex.note] ?? '').trim() : ''
    const comment = headerIndex.comment >= 0 ? (row[headerIndex.comment] ?? '').trim() : ''
    const coords = url ? extractCoordsFromUrl(url) : null
    results.push({
      name,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      notes: note || undefined,
      address: comment || undefined,
      source: 'google_takeout',
      source_url: url || undefined,
      source_list: listName,
      needsGeocode: coords == null,
    })
  }
  return results
}

type LabeledFeature = {
  type?: string
  geometry?: { type?: string; coordinates?: [number, number] }
  properties?: Record<string, unknown>
}

export function parseLabeledPlaces(json: unknown): ParsedPlace[] {
  if (json == null || typeof json !== 'object') return []
  const features = (json as { features?: LabeledFeature[] }).features
  if (!Array.isArray(features)) return []

  const results: ParsedPlace[] = []
  for (const feature of features) {
    const geometry = feature.geometry
    if (!geometry || geometry.type !== 'Point' || !geometry.coordinates) continue
    const [lng, lat] = geometry.coordinates
    if (!isValidCoord(lat, lng)) continue
    const props = feature.properties ?? {}
    const name =
      typeof props.name === 'string'
        ? props.name
        : typeof props.title === 'string'
          ? props.title
          : undefined
    if (!name) continue
    const address = typeof props.address === 'string' ? props.address : undefined
    const url = typeof props.google_maps_url === 'string' ? props.google_maps_url : undefined
    results.push({
      name,
      lat,
      lng,
      address,
      source: 'google_takeout',
      source_url: url,
      source_list: 'Labeled places',
      needsGeocode: false,
    })
  }
  return results
}
