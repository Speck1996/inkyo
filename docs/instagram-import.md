# Instagram Import

## The constraint

Instagram offers no export for saves beyond Meta's **Download Your Information**.
The archive's `saved_posts.json` contains only:

- the account handle,
- a permalink to the post/reel,
- a timestamp for when it was saved.

No caption, no location, no media. Instagram's API cannot read your saved posts
or expose other users' post locations. Do not scrape.

## Import flow

1. User requests the archive: Accounts Center -> Your information and
   permissions -> Download your information -> select **Saved** -> **JSON**.
2. Upload `saved_posts.json` (and optionally `saved_collections.json`).
3. Parse to a list of `{ url, account, saved_at }`.
4. Present the **pin-to-map queue**: for each reel the user can:
   - search a place (Nominatim autocomplete) and pin,
   - click the map to create a new place at that point,
   - attach it to an existing place,
   - add a personal note,
   - skip / defer.
5. Store as `reels` rows; pinned ones surface as markers on the map.

## oEmbed

To show a thumbnail/embed, use Instagram's oEmbed endpoint where available. It
frequently requires a token and can fail; treat enrichment as best-effort and
fall back to a link card with the account handle and saved date.

## Browser-capture alternative (later)

A bookmarklet or extension that captures the current reel URL and its tagged
location while browsing is far more reliable than the export. Design the
`reels` table and pin flow so this can feed the same pipeline:

```ts
captureReel({ url, account, locationHint? }): Reel
```

## Parser contract

```ts
parseSavedPosts(json: unknown): ParsedReel[]
parseSavedCollections(json: unknown): { name: string; urls: string[] }[]
```

`ParsedReel = { url, account?, saved_at? }`. Keep pure and unit-tested.
