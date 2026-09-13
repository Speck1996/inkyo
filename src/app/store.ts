import { create } from 'zustand'
import type { Place, Reel, Trip, TripDay } from '@/data/types'

type AppState = {
  places: Place[]
  reels: Reel[]
  selectedPlaceId: string | null
  activeTrip: Trip | null
  days: TripDay[]
  showArtLayer: boolean
  setPlaces: (places: Place[]) => void
  setReels: (reels: Reel[]) => void
  selectPlace: (id: string | null) => void
  setActiveTrip: (trip: Trip | null) => void
  setDays: (days: TripDay[]) => void
  toggleArtLayer: () => void
}

export const useAppStore = create<AppState>((set) => ({
  places: [],
  reels: [],
  selectedPlaceId: null,
  activeTrip: null,
  days: [],
  showArtLayer: true,
  setPlaces: (places) => set({ places }),
  setReels: (reels) => set({ reels }),
  selectPlace: (selectedPlaceId) => set({ selectedPlaceId }),
  setActiveTrip: (activeTrip) => set({ activeTrip }),
  setDays: (days) => set({ days }),
  toggleArtLayer: () => set((state) => ({ showArtLayer: !state.showArtLayer })),
}))
