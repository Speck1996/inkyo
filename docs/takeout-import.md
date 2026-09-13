# Google Takeout Import

## What to export

1. Go to `takeout.google.com`, deselect all.
2. Select **Maps (your places)** (may also appear as **Saved**).
3. Export once, `.zip`, download and extract.

## Files

| File | Contents |
|---|---|
| `Saved Places.csv` | Starred/saved places |
| `<List Name>.csv` | One per custom list |
| `Labeled Places.json` | GeoJSON for Home/Work/etc. |
| `Reviews.json` | Reviews (optional) |

CSV columns: `Title,Note,URL,Comment`. **No coordinates** — they must be
extracted from the `URL` or geocoded.

## Coordinate extraction

Google Maps URLs embed coordinates in several forms. Try in order:

| Form | Example |
|---|---|
| At-sign | `.../@35.6812,139.7671,15z` |
| Bang-3d/4d | `...!3d35.6812!4d139.7671` |
| Query | `?q=35.6812,139.7671` |
| ll param | `?ll=35.6812,139.7671` |
| CID | `?cid=1234567890` (needs lookup, skip in v1) |

If none match, queue for geocoding.

## Geocoding fallback

Use Nominatim (`https://nominatim.openstreetmap.org/search`):

- 1 request/second maximum.
- Set a descriptive `User-Agent` / `Referer`.
- Cache results in Dexie so re-imports are free.
- On failure, insert the place with `lat/lng = NaN` and flag it for manual placement.

## Parser contract

Keep parsing pure and testable:

```ts
parseTakeoutCsv(csv: string, listName?: string): ParsedPlace[]
parseLabeledPlaces(json: unknown): ParsedPlace[]
extractCoordsFromUrl(url: string): { lat: number; lng: number } | null
```

`ParsedPlace` mirrors the `places` row minus ids/timestamps. The import UI then
shows a review table: dedupe by name+coords, let the user edit category/tags,
skip rows, and confirm before committing to Dexie.

## Dedupe

Two passes:

1. Exact: same normalized name + coordinates within ~30 m.
2. Fuzzy: same normalized name within ~200 m (warn, let the user merge).
