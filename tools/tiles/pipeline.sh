#!/usr/bin/env bash
# Georeference + tile an illustrated map into a PMTiles archive for R2.
# Usage: ./pipeline.sh <input-image> <west> <north> <east> <south> [minzoom] [maxzoom] [outdir]
# Requires: gdal-bin (gdal_translate, gdal2tiles), pmtiles CLI.
set -euo pipefail

INPUT="${1:?input image required}"
WEST="${2:?west longitude required}"
NORTH="${3:?north latitude required}"
EAST="${4:?east longitude required}"
SOUTH="${5:?south latitude required}"
MINZOOM="${6:-4}"
MAXZOOM="${7:-14}"
OUTDIR="${8:-build/tiles}"

if ! command -v gdal_translate >/dev/null || ! command -v gdal2tiles.py >/dev/null; then
  echo "gdal-bin is required (gdal_translate, gdal2tiles.py)" >&2
  exit 1
fi

mkdir -p "$OUTDIR"
GEOTIFF="$OUTDIR/source_georef.tif"

echo "Georeferencing $INPUT -> $GEOTIFF"
gdal_translate \
  -a_srs EPSG:4326 \
  -a_ullr "$WEST" "$NORTH" "$EAST" "$SOUTH" \
  "$INPUT" "$GEOTIFF"

echo "Tiling $GEOTIFF (z$MINZOOM-$MAXZOOM)"
gdal2tiles.py -p raster --xyz -z "$MINZOOM-$MAXZOOM" --processes="$(nproc)" "$GEOTIFF" "$OUTDIR/raster"

if command -v pmtiles >/dev/null; then
  echo "Converting to PMTiles"
  pmtiles convert "$OUTDIR/raster" "$OUTDIR/japan-art.pmtiles"
  echo "Done: $OUTDIR/japan-art.pmtiles"
else
  echo "pmtiles CLI not found; skipping PMTiles conversion (raster tiles in $OUTDIR/raster)"
fi
