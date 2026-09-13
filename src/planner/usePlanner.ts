import { useCallback, useEffect, useState } from 'react'
import {
  createDay,
  createItineraryItem,
  createTrip,
  listDays,
  listItinerary,
} from '@/data/repository'
import type { ItineraryItem, Trip, TripDay } from '@/data/types'
import { useAppStore } from '@/app/store'
import { db } from '@/data/db'

export type PlannerState = {
  trip: Trip | null
  days: TripDay[]
  itemsByDay: Record<string, ItineraryItem[]>
  createTripWithDays: (title: string, startDate: string, dayCount: number) => Promise<void>
  loadTrip: (trip: Trip) => Promise<void>
  addPlaceToDay: (dayId: string, placeId: string) => Promise<void>
  refresh: () => Promise<void>
}

function addDays(startDate: string, count: number): string[] {
  const base = new Date(`${startDate}T00:00:00Z`)
  return Array.from({ length: count }, (_value, index) => {
    const date = new Date(base.getTime() + index * 86400000)
    return date.toISOString().slice(0, 10)
  })
}

export function usePlanner(): PlannerState {
  const { activeTrip, setActiveTrip, setDays } = useAppStore()
  const [itemsByDay, setItemsByDay] = useState<Record<string, ItineraryItem[]>>({})

  const loadItems = useCallback(async (days: TripDay[]) => {
    const entries = await Promise.all(
      days.map(async (day) => [day.id, await listItinerary(day.id)] as const),
    )
    setItemsByDay(Object.fromEntries(entries))
  }, [])

  const refresh = useCallback(async () => {
    if (!activeTrip) return
    const days = await listDays(activeTrip.id)
    setDays(days)
    await loadItems(days)
  }, [activeTrip, setDays, loadItems])

  const loadTrip = useCallback(
    async (trip: Trip) => {
      setActiveTrip(trip)
      const days = await listDays(trip.id)
      setDays(days)
      await loadItems(days)
    },
    [setActiveTrip, setDays, loadItems],
  )

  useEffect(() => {
    if (!activeTrip) return
    db.trips
      .orderBy('created_at')
      .reverse()
      .first()
      .then((trip) => {
        if (trip && !activeTrip) void loadTrip(trip)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createTripWithDays = useCallback(
    async (title: string, startDate: string, dayCount: number) => {
      const trip = await createTrip({ title, start_date: startDate })
      const dates = addDays(startDate, dayCount)
      for (let index = 0; index < dates.length; index += 1) {
        await createDay({ trip_id: trip.id, date: dates[index], position: index })
      }
      await loadTrip(trip)
    },
    [loadTrip],
  )

  const addPlaceToDay = useCallback(
    async (dayId: string, placeId: string) => {
      const current = itemsByDay[dayId] ?? []
      await createItineraryItem({
        day_id: dayId,
        place_id: placeId,
        position: current.length,
      })
      if (activeTrip) await refresh()
    },
    [itemsByDay, activeTrip, refresh],
  )

  return {
    trip: activeTrip,
    days: useAppStore((s) => s.days),
    itemsByDay,
    createTripWithDays,
    loadTrip,
    addPlaceToDay,
    refresh,
  }
}
