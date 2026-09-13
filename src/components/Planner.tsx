import { useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Place } from '@/data/types'
import { usePlanner } from '@/planner/usePlanner'
import { routeThroughPlaces, formatDistance, formatDuration } from '@/planner/routing'
import { buildItineraryIcs, downloadIcs } from '@/planner/ics'
import { db } from '@/data/db'

function DraggablePlace({ place }: { place: Place }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `place:${place.id}` })
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined
  return (
    <li ref={setNodeRef} style={style} className="place-chip" {...listeners} {...attributes}>
      <span className="place-chip__name">{place.name}</span>
      <span className="place-chip__cat">{place.category ?? place.source}</span>
    </li>
  )
}

function DayColumn({
  day,
  dayIndex,
  places,
  placeIds,
  onExport,
  routeInfo,
}: {
  day: { id: string; date: string; title?: string }
  dayIndex: number
  places: Place[]
  placeIds: string[]
  onExport: (dayId: string) => void
  routeInfo?: { distance: number; duration: number } | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${day.id}` })
  const placeById = useMemo(() => new Map(places.map((p) => [p.id, p])), [places])
  return (
    <div ref={setNodeRef} className={isOver ? 'day day--over' : 'day'}>
      <header className="day__header">
        <span className="day__index">Day {dayIndex + 1}</span>
        <span className="day__date">{day.date}</span>
      </header>
      <ul className="day__stops">
        {placeIds.map((id) => {
          const place = placeById.get(id)
          if (!place) return null
          return <li key={id}>{place.name}</li>
        })}
        {placeIds.length === 0 ? <li className="day__empty">Drop places here</li> : null}
      </ul>
      {routeInfo ? (
        <div className="day__route">
          {formatDistance(routeInfo.distance)} · {formatDuration(routeInfo.duration)}
        </div>
      ) : null}
      <button type="button" className="btn btn--ghost" onClick={() => onExport(day.id)}>
        Export .ics
      </button>
    </div>
  )
}

export function Planner({ places }: { places: Place[] }) {
  const { trip, days, itemsByDay, createTripWithDays, addPlaceToDay } = usePlanner()
  const [title, setTitle] = useState('Japan trip')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [dayCount, setDayCount] = useState(7)
  const [routeInfo, setRouteInfo] = useState<Record<string, { distance: number; duration: number }>>({})
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const placeId = String(active.id).replace('place:', '')
    const dayId = String(over.id).replace('day:', '')
    await addPlaceToDay(dayId, placeId)

    const orderedIds = [...(itemsByDay[dayId] ?? []).map((i) => i.place_id), placeId]
    const ordered = orderedIds
      .map((id) => places.find((p) => p.id === id))
      .filter((p): p is Place => Boolean(p))
    const route = await routeThroughPlaces(ordered)
    if (route) {
      setRouteInfo((prev) => ({
        ...prev,
        [dayId]: { distance: route.totalDistanceMeters, duration: route.totalDurationSeconds },
      }))
    }
  }

  async function handleExport(dayId: string) {
    const day = days.find((d) => d.id === dayId)
    if (!day) return
    const items = itemsByDay[dayId] ?? []
    const allPlaces = await db.places.toArray()
    const ics = buildItineraryIcs(day, items, allPlaces)
    downloadIcs(`inkyo-${day.date}.ics`, ics)
  }

  if (!trip) {
    return (
      <div className="stack">
        <h2 className="section-title">Day planner</h2>
        <p className="field-hint">Create a trip, then drag places onto days.</p>
        <label className="field">
          <span>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field">
          <span>Start date</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="field">
          <span>Days</span>
          <input
            type="number"
            min={1}
            max={30}
            value={dayCount}
            onChange={(e) => setDayCount(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void createTripWithDays(title, startDate, dayCount)}
        >
          Create trip
        </button>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="planner">
        <div className="planner__pool">
          <h3>{trip.title}</h3>
          <p className="field-hint">Drag a place onto a day.</p>
          <ul className="place-pool">
            {places.map((place) => (
              <DraggablePlace key={place.id} place={place} />
            ))}
          </ul>
        </div>
        <div className="planner__days">
          {days.map((day, index) => (
            <DayColumn
              key={day.id}
              day={day}
              dayIndex={index}
              places={places}
              placeIds={(itemsByDay[day.id] ?? []).map((item) => item.place_id)}
              onExport={handleExport}
              routeInfo={routeInfo[day.id]}
            />
          ))}
        </div>
      </div>
    </DndContext>
  )
}
