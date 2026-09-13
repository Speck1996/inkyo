# Inkyo Deployment — $0/month

Inkyo is a **shared public map**: anyone can view, add, and manage places and
reels, no account required. Supabase is the shared source of truth; the browser
keeps a local cache for instant/offline use.

## Components

| Piece | Service | Free limits |
|---|---|---|
| App | Cloudflare Pages | Unlimited static requests, 500 builds/mo, free SSL |
| Tiles | (none needed) | Uses OpenFreeMap public tiles |
| Data/Auth | Supabase | 500 MB DB, 1 GB storage, 50k MAU |

Optional: Cloudflare R2 if you later self-host custom illustrated tiles.

## Cloudflare Pages / Workers (GitHub)

This app is deployed as a **Worker with static assets** (the Cloudflare "Vite"
preset creates a Worker). Workers that only serve static assets **cannot have
build-time variables set in the dashboard**, so the public Supabase config is
committed in `.env.production` and baked in by Vite at build time.

1. Push the repo to GitHub.
2. Cloudflare Dashboard -> Workers & Pages -> Create -> Pages/Workers ->
   Connect to Git.
3. Framework preset **Vite**, build command `npm run build`, output `dist`.
4. `wrangler.jsonc` serves `dist/` with SPA fallback
   (`not_found_handling: single-page-application`). Do **not** add a
   `public/_redirects` SPA rule; it conflicts with this and causes an
   infinite-loop error at deploy.
5. Deploy. The free `*.workers.dev` (or `*.pages.dev`) domain is fine.

### Supabase config

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are read from
`.env.production` (committed, public values). The anon/publishable key is public
by design - it ships to every browser - and Row Level Security enforces access.
**Never** commit the `service_role` / secret key.

For local development, `.env.local` (gitignored) can override the same values.

## Supabase

1. Create a project (free).
2. SQL editor: run `supabase/migrations/0001_init.sql`, then
   `supabase/migrations/0002_shared_map.sql`.
3. Authentication -> Providers -> enable **Email** (magic link). Only needed so
   the owner can sign in; visitors do not need an account.
4. Authentication -> URL Configuration: set **Site URL** and **Redirect URLs**
   to `https://<project>.pages.dev/**` (add localhost for local testing).
5. Copy Project URL + anon key into the Pages env vars.

> **Open access.** `0002_shared_map.sql` makes `places` and `reels` publicly
> readable and writable, including anonymous insert/update/delete, and makes
> `user_id` nullable. Treat the data as public and unversioned: there is no
> moderation. Tighten the policies in that file if that ever changes.

Free projects **pause after 7 days of inactivity**; the first visit cold-starts.
Add a daily ping to `/rest/v1/` if that matters.

## Local development

```bash
cp .env.example .env.local   # fill Supabase keys to test shared sync
npm run dev
```

The app works with no `.env.local` (offline, local-only map).

## Data flow

- Writes go to Dexie first, then `schedulePublish()` flushes the outbox to
  Supabase (~1s debounce) and pulls remote changes.
- On load, Dexie renders instantly, then `refreshShared()` merges the shared map.
- `deleted_at` is pulled so deletions propagate between clients.

