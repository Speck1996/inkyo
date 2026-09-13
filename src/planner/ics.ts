import type { ItineraryItem, Place, TripDay } from '@/data/types'

type IcsEvent = {
  uid: string
  start: Date
  end: Date
  summary: string
  description: string
  location: string
  lat?: number
  lng?: number
}

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

function toIcsDate(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  )
}

function escapeText(value: string): string {
  return value.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
}

function buildEvent(event: IcsEvent): string {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.uid}@inkyo`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(event.start)}`,
    `DTEND:${toIcsDate(event.end)}`,
    `SUMMARY:${escapeText(event.summary)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
  ]
  if (event.lat != null && event.lng != null) {
    lines.push(`GEO:${event.lat};${event.lng}`)
  }
  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

export function buildItineraryIcs(day: TripDay, items: ItineraryItem[], places: Place[]): string {
  const placeById = new Map(places.map((p) => [p.id, p]))
  const events: IcsEvent[] = []
  let cursor = 0

  for (const item of items) {
    const place = placeById.get(item.place_id)
    if (!place) continue
    const base = new Date(`${day.date}T09:00:00Z`)
    const startMinutes = item.start_time
      ? Number(item.start_time.split(':')[0]) * 60 + Number(item.start_time.split(':')[1])
      : 9 * 60 + cursor
    const duration = (item.duration_min ?? 60) * 60 * 1000
    const start = new Date(base.getTime() + startMinutes * 60 * 1000 - 9 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + duration)
    cursor += (item.duration_min ?? 60) + 30
    events.push({
      uid: item.id,
      start,
      end,
      summary: place.name,
      description: place.notes ?? '',
      location: place.address ?? `${place.lat}, ${place.lng}`,
      lat: place.lat,
      lng: place.lng,
    })
  }

  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Inkyo//Trip Planner//EN',
    'CALSCALE:GREGORIAN',
  ]
  const footer = ['END:VCALENDAR']
  return [...header, ...events.map(buildEvent), ...footer].join('\r\n')
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
