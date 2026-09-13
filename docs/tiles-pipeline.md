# Tiles Pipeline — Custom Illustrated Basemap

Goal: a full custom ukiyo-e illustrated map of Japan, served free from
Cloudflare R2, layered under legible vector labels/pins.

Strategy: **hybrid**. A custom ukiyo-e *vector style* (Phase 1, `ukiyoStyle.ts`)
is always the working base. Hand-painted / georeferenced raster art is added as
an overlay source and toggled on. Readability always wins.

## Paths

### A. Hand-painted raster
1. Produce/commission a high-resolution painting of Japan (or one per region).
2. Georeference in QGIS with ground control points, or set bounds with GDAL:
   ```
   gdal_translate -a_srs EPSG:4326 -a_ullr <west> <north> <east> <south> \
     art.png art_georef.tif
   ```
3. Build a warped, tiled pyramid:
   ```
   gdal2tiles.py -p raster --xyz -z 4-14 art_georef.tif tiles/
   ```
4. Optionally merge into a single PMTiles:
   ```
   pmtiles convert tiles/ japan-art.pmtiles
   ```
5. Upload to R2; add as a MapLibre raster/pmtiles source below labels.

### B. Custom vector style (active base)
Fork OpenFreeMap's style (already bundled as `openfreemap-positron.json`) and
recolor per `src/design/tokens.ts`. No art assets needed. Scales to all zooms.

### C. Historical map georeference
Georeference a public-domain Edo-period map (Wikimedia Commons, Library of
Congress, MET Open Access) and tile as in Path A. Authentic ukiyo-e at no art
cost; historical coastlines/roads must be reconciled with modern places.

## PMTiles in MapLibre

```ts
import { Protocol } from 'pmtiles'
const protocol = new Protocol()
maplibregl.addProtocol('pmtiles', protocol.tile)
// source url: 'pmtiles://https://tiles.example.com/japan-art.pmtiles'
```

## R2 layout

```
r2://inkyo-tiles/
  japan-art.pmtiles
  raster/{z}/{x}/{y}.png        # if not using pmtiles
  fonts/{fontstack}/{range}.pbf
  sprites/ukiyo
```

## CORS

R2 bucket must allow GET from the Pages origin (and localhost). Use an R2 custom
domain or a Worker; set `Access-Control-Allow-Origin`. See `docs/deployment.md`.

## Layer order (bottom to top)

1. Background land color
2. Illustrated art overlay (optional; low opacity so labels read)
3. Vector water/landcover/roads (readability)
4. Place/reel markers
5. Labels (washi halo)

Never place markers or labels beneath the art.

## Readability guardrails

- Art layer opacity <= 0.85, and dropped further under text.
- Label halo (washi) and ink text always on top.
- Texture layers (seigaiha, paper grain) are decorative and toggleable.
- Test at z4 (nation), z8 (region), z12 (city) with labels visible.
