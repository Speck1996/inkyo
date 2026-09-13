import { useMemo, useState } from 'react'
import { useAppStore } from '@/app/store'
import { createReel, listReels, softDeleteReel, updateReel, createPlace } from '@/data/repository'
import { geocode } from '@/data/importService'
import { isInstagramUrl } from '@/data/linkParser'
import { Icon } from '@/components/ui/Icon'
import type { Place } from '@/data/types'

type Suggestion = { lat: number; lng: number; label: string }

export function ReelsPanel({ onChanged }: { onChanged: () => void }) {
  const { reels, places, setReels } = useAppStore()
  const [newUrl, setNewUrl] = useState('')
  const [query, setQuery] = useState('')
  const [activeReelId, setActiveReelId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [busy, setBusy] = useState(false)

  const unpinned = useMemo(() => reels.filter((reel) => reel.place_id == null), [reels])
  const pinned = useMemo(() => reels.filter((reel) => reel.place_id != null), [reels])
  const placeById = useMemo(() => new Map(places.map((p) => [p.id, p])), [places])

  async function addReel() {
    const url = newUrl.trim()
    if (!url) return
    await createReel({ place_id: null, url })
    setNewUrl('')
    setReels(await listReels())
    onChanged()
  }

  async function removeReel(id: string) {
    await softDeleteReel(id)
    setReels(await listReels())
    if (activeReelId === id) setActiveReelId(null)
    onChanged()
  }

  async function search() {
    if (!query.trim()) return
    setBusy(true)
    try {
      const result = await geocode(query)
      setSuggestions(result ? [result] : [])
    } finally {
      setBusy(false)
    }
  }

  async function pinToNewPlace(reelId: string, suggestion: Suggestion) {
    const place: Place = await createPlace({
      name: query || suggestion.label.split(',')[0],
      lat: suggestion.lat,
      lng: suggestion.lng,
      address: suggestion.label,
      tags: ['instagram'],
      source: 'instagram',
      visited: false,
    })
    await updateReel(reelId, { place_id: place.id })
    setActiveReelId(null)
    setSuggestions([])
    setQuery('')
    setReels(await listReels())
    onChanged()
  }

  async function pinToExistingPlace(reelId: string, placeId: string) {
    await updateReel(reelId, { place_id: placeId })
    setActiveReelId(null)
    setReels(await listReels())
    onChanged()
  }

  return (
    <div className="stack">
      <div className="section-head">
        <h3>Add a reel</h3>
      </div>
      <div className="input-row">
        <span className="input-row__icon">
          <Icon name="instagram" size={17} />
        </span>
        <input
          className="input input--with-icon"
          placeholder="Paste an Instagram reel link"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void addReel()
          }}
        />
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={!isInstagramUrl(newUrl)}
          onClick={addReel}
        >
          Add
        </button>
      </div>

      <div className="section-head">
        <h3>To pin</h3>
        <span className="count">{unpinned.length}</span>
      </div>
      {unpinned.length === 0 ? (
        <div className="empty">
          <Icon name="instagram" size={20} />
          <p>No unpinned reels. Paste a link above.</p>
        </div>
      ) : (
        <ul className="reel-list">
          {unpinned.map((reel) => (
            <li key={reel.id} className="reel">
              <a href={reel.url} target="_blank" rel="noreferrer" className="reel__link">
                {reel.account ?? reel.url.replace('https://www.instagram.com/', '')}
              </a>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setActiveReelId(activeReelId === reel.id ? null : reel.id)}
              >
                Pin
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                aria-label="Delete reel"
                onClick={() => removeReel(reel.id)}
              >
                <Icon name="trash" size={15} />
              </button>
              {activeReelId === reel.id ? (
                <div className="reel__pin">
                  <div className="input-row">
                    <input
                      className="input"
                      placeholder="Search a place"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void search()
                      }}
                    />
                    <button type="button" className="btn btn--secondary btn--sm" disabled={busy} onClick={search}>
                      {busy ? <Icon name="spinner" size={15} /> : 'Search'}
                    </button>
                  </div>
                  {suggestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion.label}
                      className="suggestion"
                      onClick={() => void pinToNewPlace(reel.id, suggestion)}
                    >
                      <Icon name="pin" size={15} />
                      <span>{suggestion.label}</span>
                    </button>
                  ))}
                  <label className="field">
                    <span>Or attach to an existing place</span>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) void pinToExistingPlace(reel.id, e.target.value)
                      }}
                    >
                      <option value="" disabled>
                        Select…
                      </option>
                      {places.map((place) => (
                        <option key={place.id} value={place.id}>
                          {place.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {pinned.length > 0 ? (
        <>
          <div className="section-head">
            <h3>Pinned</h3>
            <span className="count">{pinned.length}</span>
          </div>
          <ul className="reel-list">
            {pinned.map((reel) => (
              <li key={reel.id} className="reel">
                <span>{placeById.get(reel.place_id as string)?.name ?? 'Unknown place'}</span>
                <a href={reel.url} target="_blank" rel="noreferrer" className="reel__link">
                  Open
                </a>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  aria-label="Delete reel"
                  onClick={() => removeReel(reel.id)}
                >
                  <Icon name="trash" size={15} />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
