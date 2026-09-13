#!/usr/bin/env bash
# Upload tile artifacts to Cloudflare R2.
# Requires: wrangler CLI (npx wrangler), authenticated, and a bucket named inkyo-tiles.
set -euo pipefail

BUCKET="${R2_BUCKET:-inkyo-tiles}"
SRC="${1:-build/tiles}"

if [ ! -d "$SRC" ]; then
  echo "source directory not found: $SRC" >&2
  exit 1
fi

if [ -f "$SRC/japan-art.pmtiles" ]; then
  echo "Uploading PMTiles archive"
  npx wrangler r2 object put "$BUCKET/japan-art.pmtiles" --file "$SRC/japan-art.pmtiles" --content-type application/octet-stream
fi

if [ -d "$SRC/raster" ]; then
  echo "Uploading raster tiles"
  npx wrangler r2 object put "$BUCKET/raster" --file "$SRC/raster" --recursive
fi

echo "Upload complete. Bucket: $BUCKET"
