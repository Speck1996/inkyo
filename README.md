# Inkyo

Ukiyo-e styled Japan trip planner. Local-first map of saved places and Instagram
reels, with a drag-and-drop day planner. Hosted free on Cloudflare Pages + R2,
optional sync via Supabase.

## Quick start

```bash
npm install
npm run dev
```

The app works offline with no configuration. To enable sync, copy `.env.example`
to `.env.local` and add Supabase keys.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build -> dist/
npm run preview    # serve build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest
```

## Features

- Ukiyo-e MapLibre style over free OpenFreeMap vector tiles
- Import Google Maps saved places (Takeout CSV/JSON), auto coordinate + geocode
- Import Instagram saved posts and pin reels to places manually
- Drag-and-drop day planner with OSRM route lines, travel times, ICS export
- Local-first Dexie storage; optional Supabase magic-link sync
- PWA, offline-capable

## Docs

- `docs/data-model.md`
- `docs/takeout-import.md`
- `docs/instagram-import.md`
- `docs/tiles-pipeline.md`
- `docs/deployment.md`

See `.opencode/skills/inkyo/SKILL.md` for the full project brief.
