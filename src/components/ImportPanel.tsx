import { useMemo, useState } from 'react'
import { useAppStore } from '@/app/store'
import { importParsedPlaces, type ImportOutcome } from '@/data/importService'
import { parseTakeoutCsv, parseLabeledPlaces } from '@/import/takeout/parse'
import { parseSavedPosts } from '@/import/instagram/parse'
import type { ParsedPlace, ParsedReel } from '@/data/types'
import { createReel, listReels } from '@/data/repository'

type Mode = 'takeout' | 'instagram'

export function ImportPanel({ onImported }: { onImported: () => void }) {
  const { setReels } = useAppStore()
  const [mode, setMode] = useState<Mode>('takeout')
  const [parsedPlaces, setParsedPlaces] = useState<ParsedPlace[]>([])
  const [parsedReels, setParsedReels] = useState<ParsedReel[]>([])
  const [fileName, setFileName] = useState('')
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null)
  const [busy, setBusy] = useState(false)

  const needsGeocode = useMemo(
    () => parsedPlaces.filter((p) => p.needsGeocode).length,
    [parsedPlaces],
  )

  async function handleFile(file: File) {
    setOutcome(null)
    const text = await file.text()
    setFileName(file.name)
    if (mode === 'instagram') {
      try {
        setParsedReels(parseSavedPosts(JSON.parse(text)))
      } catch {
        setParsedReels([])
      }
      setParsedPlaces([])
      return
    }
    setParsedReels([])
    if (file.name.endsWith('.json')) {
      let json: unknown = null
      try {
        json = JSON.parse(text)
      } catch {
        json = null
      }
      setParsedPlaces(json ? parseLabeledPlaces(json) : [])
    } else {
      const listName = file.name.replace(/\.csv$/i, '')
      setParsedPlaces(parseTakeoutCsv(text, listName))
    }
  }

  async function commitPlaces() {
    setBusy(true)
    try {
      const result = await importParsedPlaces(parsedPlaces)
      setOutcome(result)
      setParsedPlaces([])
      onImported()
    } finally {
      setBusy(false)
    }
  }

  async function commitReels() {
    setBusy(true)
    try {
      for (const reel of parsedReels) {
        await createReel({ place_id: null, url: reel.url, account: reel.account, saved_at: reel.saved_at })
      }
      setReels(await listReels())
      setParsedReels([])
      onImported()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <div className="section-head">
        <h3>Bulk import</h3>
      </div>
      <div className="tabs">
        <button
          type="button"
          className={mode === 'takeout' ? 'tab tab--active' : 'tab'}
          onClick={() => setMode('takeout')}
        >
          Google Takeout
        </button>
        <button
          type="button"
          className={mode === 'instagram' ? 'tab tab--active' : 'tab'}
          onClick={() => setMode('instagram')}
        >
          Instagram
        </button>
      </div>

      {mode === 'takeout' ? (
        <p className="field-hint">
          Upload <code>Saved Places.csv</code>, a list CSV, or <code>Labeled Places.json</code>.
          Coordinates are read from the URL; missing ones are geocoded (1 req/s).
        </p>
      ) : (
        <p className="field-hint">
          Upload <code>saved_posts.json</code> from Download Your Information. Reels arrive
          unpinned; assign them to places from the Reels list.
        </p>
      )}

      <label className="file-input">
        <input
          type="file"
          accept={mode === 'takeout' ? '.csv,.json' : '.json'}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
        <span>{fileName || 'Choose a file'}</span>
      </label>

      {mode === 'takeout' && parsedPlaces.length > 0 ? (
        <div className="preview">
          <div className="preview__meta">
            <strong>{parsedPlaces.length}</strong> places parsed
            {needsGeocode > 0 ? <span> · {needsGeocode} need geocoding</span> : null}
          </div>
          <ul className="preview__list">
            {parsedPlaces.slice(0, 50).map((place, index) => (
              <li key={`${place.name}-${index}`}>
                <span className="preview__name">{place.name}</span>
                <span className="preview__coord">
                  {place.lat != null && place.lng != null
                    ? `${place.lat.toFixed(3)}, ${place.lng.toFixed(3)}`
                    : 'no coords'}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn--secondary" disabled={busy} onClick={commitPlaces}>
            {busy ? 'Importing…' : `Import ${parsedPlaces.length} places`}
          </button>
        </div>
      ) : null}

      {mode === 'instagram' && parsedReels.length > 0 ? (
        <div className="preview">
          <div className="preview__meta">
            <strong>{parsedReels.length}</strong> reels parsed
          </div>
          <ul className="preview__list">
            {parsedReels.slice(0, 50).map((reel) => (
              <li key={reel.url}>
                <span className="preview__name">{reel.account ?? 'unknown'}</span>
                <span className="preview__coord">{reel.url.replace('https://www.instagram.com/', '')}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn--secondary" disabled={busy} onClick={commitReels}>
            {busy ? 'Saving…' : `Save ${parsedReels.length} reels`}
          </button>
        </div>
      ) : null}

      {outcome ? (
        <div className="outcome">
          Imported {outcome.created}, skipped {outcome.skippedDuplicates} duplicates,{' '}
          {outcome.needsGeocode} could not be located.
        </div>
      ) : null}
    </div>
  )
}
