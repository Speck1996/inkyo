# Inkyo — Agent Guide

Apple-minimal ukiyo-e Japan trip-planning web app. Read
`.opencode/skills/inkyo/SKILL.md` for the project brief, and
`.opencode/skills/modern-ui/SKILL.md` for the UI design system. This file is the
short working agreement.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build -> dist/
npm run preview    # serve build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest unit tests
```

Always run `npm run lint && npm run typecheck` before considering a task done.

## Ground rules

- **Modern, clean, Apple-minimal UI.** Read the `modern-ui` skill before any UI
  work. Map is the hero; chrome floats, blur, and collapses.
- **Readability first.** Mute decoration before text contrast. Never let the
  ukiyo-e styling hurt legibility.
- **Local-first.** Dexie/IndexedDB owns the data. Supabase is optional sync.
  The app must work logged-out and offline.
- **$0 hosting.** Cloudflare Pages + R2 + Supabase free. No paid APIs, no
  Google Maps JS API.
- **No secrets in client.** Only the Supabase anon key is public.
- **Tokens, not literals.** Colors/type/spacing/radii/shadows come from
  `src/design/tokens.ts` and its generated CSS variables.
- **No comments unless necessary** and no emojis in files.

## Conventions

- TypeScript strict; prefer `type` over `interface` for data shapes.
- Domain ids are uuid strings; timestamps are ISO 8601 strings.
- Every synced row: `id`, `user_id`, `updated_at`, `deleted_at` (soft delete).
- Files in `src/data` own persistence; components never touch Dexie directly.
- Importers are pure parse functions (`parseX(input): ParsedPlace[]`) plus a UI
  review step; keep parsing testable in `vitest`.
- Saving a place: paste a Google Maps/Instagram link or raw `lat, lng`; parsing
  lives in `src/data/linkParser.ts`.

## Key reference docs

- `docs/data-model.md`
- `docs/takeout-import.md`
- `docs/instagram-import.md`
- `docs/tiles-pipeline.md`
- `docs/deployment.md`
