import { useMemo, useState } from 'react'
import { useAppStore } from '@/app/store'
import { createPlace, softDeletePlace } from '@/data/repository'
import { geocode } from '@/data/importService'
import { parsePlaceLink, parseLatLng, isInstagramUrl, isGoogleMapsUrl } from '@/data/linkParser'
import type { Place } from '@/data/types'
import { Icon } from '@/components/ui/Icon'

type Suggestion = { lat: number; lng: number; label: string }

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Manual',
  google_maps: 'Google Maps',
  google_takeout: 'Google Takeout',
  instagram: 'Instagram',
  google_mymaps: 'My Maps',
}

export function AddPlacePanel({ onChanged }: { onChanged: () => void }) {
  const { places, selectedPlaceId, selectPlace } = useAppStore()
  const [link, setLink] = useState('')
  const [name, setName] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [note, setNote] = useState('')
  const [source, setSource] = useState<Place['source']>('manual')
  const [sourceUrl, setSourceUrl] = useState<string | undefined>()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const detected = useMemo(() => (link ? parsePlaceLink(link) : null), [link])
  const hasCoords = parseLatLng(`${lat},${lng}`) != null
  const canSave = name.trim().length > 0 && hasCoords

  function handleLinkChange(value: string) {
    setLink(value)
    const parsed = parsePlaceLink(value)
    setSource(parsed.source)
    setSourceUrl(parsed.source === 'manual' ? undefined : parsed.url)
    if (parsed.lat != null && parsed.lng != null) {
      setLat(parsed.lat.toFixed(6))
      setLng(parsed.lng.toFixed(6))
    }
    if (parsed.name) setName(parsed.name)
    if (parsed.lat != null || isInstagramUrl(value)) setShowDetails(true)
  }

  async function search() {
    const q = query.trim() || name.trim()
    if (!q) return
    setSearching(true)
    try {
      const result = await geocode(q)
      setSuggestions(result ? [result] : [])
    } finally {
      setSearching(false)
    }
  }

  function applySuggestion(suggestion: Suggestion) {
    setLat(suggestion.lat.toFixed(6))
    setLng(suggestion.lng.toFixed(6))
    if (!name.trim()) setName(suggestion.label.split(',')[0].trim())
    setSuggestions([])
    setQuery('')
    setShowDetails(true)
  }

  async function save() {
    if (!canSave) return
    const coords = parseLatLng(`${lat},${lng}`)!
    await createPlace({
      name: name.trim(),
      lat: coords.lat,
      lng: coords.lng,
      address: undefined,
      notes: note.trim() || undefined,
      tags: [],
      source,
      source_url: sourceUrl,
      visited: false,
    })
    setLink('')
    setName('')
    setLat('')
    setLng('')
    setNote('')
    setSource('manual')
    setSourceUrl(undefined)
    setShowDetails(false)
    setSuggestions([])
    onChanged()
  }

  async function remove(place: Place) {
    await softDeletePlace(place.id)
    if (selectedPlaceId === place.id) selectPlace(null)
    onChanged()
  }

  const linkIcon = isInstagramUrl(link) ? 'instagram' : isGoogleMapsUrl(link) ? 'pin' : 'link'

  return (
    <div className="addplace">
      <section className="addplace__form">
        <div className="field-group">
          <label className="field-label" htmlFor="place-link">
            Paste a link
          </label>
          <div className="input-row">
            <span className="input-row__icon">
              <Icon name={linkIcon} size={17} />
            </span>
            <input
              id="place-link"
              className="input input--with-icon"
              placeholder="Google Maps or Instagram link, or 35.6, 139.7"
              value={link}
              onChange={(e) => handleLinkChange(e.target.value)}
              autoComplete="off"
            />
          </div>
          {detected && link ? (
            <p className="field-hint">
              {detected.lat != null
                ? `Detected ${SOURCE_LABEL[detected.source]} coordinates`
                : isInstagramUrl(link)
                  ? 'Instagram has no location. Search a place or paste the coordinates.'
                  : 'No coordinates found. Search a place or enter them manually.'}
            </p>
          ) : null}
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="place-name">
            Name
          </label>
          <input
            id="place-name"
            className="input"
            placeholder="e.g. Senso-ji"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="place-search">
            Find by name
          </label>
          <div className="input-row">
            <span className="input-row__icon">
              <Icon name="search" size={17} />
            </span>
            <input
              id="place-search"
              className="input input--with-icon"
              placeholder="Search a place in Japan"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void search()
              }}
            />
            <button type="button" className="btn btn--secondary btn--sm" disabled={searching} onClick={search}>
              {searching ? <Icon name="spinner" size={15} /> : 'Search'}
            </button>
          </div>
          {suggestions.length > 0 ? (
            <ul className="suggestions">
              {suggestions.map((s) => (
                <li key={s.label}>
                  <button type="button" className="suggestion" onClick={() => applySuggestion(s)}>
                    <Icon name="pin" size={15} />
                    <span>{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <button
          type="button"
          className="disclosure"
          aria-expanded={showDetails}
          onClick={() => setShowDetails((v) => !v)}
        >
          <Icon name={showDetails ? 'chevron' : 'chevron-right'} size={16} />
          Coordinates {lat && lng ? `· ${lat}, ${lng}` : ''}
        </button>

        {showDetails ? (
          <div className="coord-grid">
            <label className="field-group">
              <span className="field-label">Latitude</span>
              <input
                className="input"
                inputMode="decimal"
                placeholder="35.7148"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </label>
            <label className="field-group">
              <span className="field-label">Longitude</span>
              <input
                className="input"
                inputMode="decimal"
                placeholder="139.7967"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </label>
          </div>
        ) : null}

        <div className="field-group">
          <label className="field-label" htmlFor="place-note">
            Note <span className="field-label__opt">optional</span>
          </label>
          <textarea
            id="place-note"
            className="input input--area"
            rows={2}
            placeholder="Why you saved it"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button type="button" className="btn btn--primary btn--lg btn--block" disabled={!canSave} onClick={save}>
          <Icon name="plus" size={18} />
          Save place
        </button>
      </section>

      <section className="addplace__list">
        <div className="section-head">
          <h3>Saved places</h3>
          <span className="count">{places.length}</span>
        </div>
        {places.length === 0 ? (
          <div className="empty">
            <Icon name="pin" size={22} />
            <p>No places yet. Paste a link above to add your first.</p>
          </div>
        ) : (
          <ul className="place-list">
            {places.map((place) => (
              <li key={place.id}>
                <div className={place.id === selectedPlaceId ? 'place-row is-active' : 'place-row'}>
                  <button
                    type="button"
                    className="place-row__main"
                    onClick={() => selectPlace(place.id === selectedPlaceId ? null : place.id)}
                  >
                    <span className="place-row__marker">
                      <Icon name="pin" size={15} />
                    </span>
                    <span className="place-row__text">
                      <span className="place-row__name">{place.name}</span>
                      <span className="place-row__meta">
                        {SOURCE_LABEL[place.source] ?? place.source}
                        <span className="dot">·</span>
                        <span className="coord">
                          {place.lat.toFixed(3)}, {place.lng.toFixed(3)}
                        </span>
                      </span>
                    </span>
                  </button>
                  {place.source_url ? (
                    <a
                      className="icon-btn"
                      href={place.source_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open source"
                    >
                      <Icon name="link" size={15} />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    aria-label={`Delete ${place.name}`}
                    onClick={() => remove(place)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
