import { useCallback, useState } from 'react'
import { MapCanvas } from '@/components/MapCanvas'
import { ImportPanel } from '@/components/ImportPanel'
import { AccountPanel } from '@/components/AccountPanel'
import { AddPlacePanel } from '@/components/AddPlacePanel'
import { ReelsPanel } from '@/components/ReelsPanel'
import { useInkyoData } from '@/app/useInkyoData'
import { useAppStore } from '@/app/store'
import { syncNow } from '@/sync/engine'
import { Icon } from '@/components/ui/Icon'

type Tab = 'places' | 'reels' | 'account' | 'import'

const TABS: { id: Tab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
  { id: 'places', label: 'Places', icon: 'pin' },
  { id: 'reels', label: 'Reels', icon: 'instagram' },
  { id: 'account', label: 'Account', icon: 'sync' },
]

export function App() {
  const { loading, error, refresh } = useInkyoData()
  const { places, selectedPlaceId, selectPlace, showArtLayer, toggleArtLayer } = useAppStore()
  const [tab, setTab] = useState<Tab>('places')
  const [panelOpen, setPanelOpen] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const handleChanged = useCallback(() => {
    refresh()
  }, [refresh])

  const selected = places.find((place) => place.id === selectedPlaceId) ?? null

  return (
    <div className="app">
      <div className="map-layer">
        <MapCanvas
          places={places}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={selectPlace}
        />
      </div>

      <div className="brand">
        <span className="brand__mark">印</span>
        <span className="brand__name">Inkyo</span>
      </div>

      <div className="topbar">
        <div className="topbar__actions">
          <button
            type="button"
            className="icon-btn"
            aria-label={showArtLayer ? 'Hide markers' : 'Show markers'}
            aria-pressed={!showArtLayer}
            onClick={toggleArtLayer}
          >
            <Icon name="layers" size={18} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Refresh shared map"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true)
              try {
                await syncNow()
                refresh()
              } finally {
                setSyncing(false)
              }
            }}
          >
            <Icon name={syncing ? 'spinner' : 'sync'} size={18} />
          </button>
        </div>
      </div>

      {selected ? (
        <div className="detail-card" role="dialog" aria-label={selected.name}>
          <button
            type="button"
            className="icon-btn detail-card__close"
            aria-label="Close"
            onClick={() => selectPlace(null)}
          >
            <Icon name="close" size={16} />
          </button>
          <div className="detail-card__marker">
            <Icon name="pin" size={18} />
          </div>
          <h2 className="detail-card__title">{selected.name}</h2>
          <p className="detail-card__meta">
            {selected.address ?? `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`}
          </p>
          {selected.notes ? <p className="detail-card__note">{selected.notes}</p> : null}
          {selected.source_url ? (
            <a
              className="btn btn--secondary btn--sm"
              href={selected.source_url}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="link" size={15} />
              Open source
            </a>
          ) : null}
        </div>
      ) : null}

      {!panelOpen ? (
        <button
          type="button"
          className="panel-launcher"
          aria-label="Open panel"
          onClick={() => setPanelOpen(true)}
        >
          <Icon name="panel" size={18} />
        </button>
      ) : (
        <aside className="panel" aria-label="Inkyo panel">
          <div className="panel__head">
            <div className="segmented" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  className={tab === t.id ? 'segment is-active' : 'segment'}
                  onClick={() => setTab(t.id)}
                >
                  <Icon name={t.icon} size={15} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="icon-btn panel__collapse"
              aria-label="Collapse panel"
              onClick={() => setPanelOpen(false)}
            >
              <Icon name="chevron" size={18} />
            </button>
          </div>

          <div className="panel__body">
            {error ? <div className="notice notice--error">{error}</div> : null}
            {loading && places.length === 0 ? <div className="skeleton" /> : null}

            {tab === 'places' ? (
              <>
                <AddPlacePanel onChanged={handleChanged} />
                <details className="advanced">
                  <summary>Advanced import</summary>
                  <p className="field-hint">
                    Bulk import Google Takeout CSVs or your Instagram saved posts.
                  </p>
                  <button
                    type="button"
                    className="btn btn--secondary btn--block"
                    onClick={() => setTab('import')}
                  >
                    Open bulk importer
                  </button>
                </details>
              </>
            ) : null}
            {tab === 'reels' ? <ReelsPanel onChanged={handleChanged} /> : null}
            {tab === 'account' ? <AccountPanel /> : null}
            {tab === 'import' ? (
              <div className="stack">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setTab('places')}
                >
                  <Icon name="chevron" size={15} />
                  Back to places
                </button>
                <ImportPanel onImported={handleChanged} />
              </div>
            ) : null}
          </div>
        </aside>
      )}

      <div className="paper-grain" aria-hidden="true" />
    </div>
  )
}
