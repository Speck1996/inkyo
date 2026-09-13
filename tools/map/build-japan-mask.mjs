import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../../src/map/japan-foreign-mask.json')

const SOURCE =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'

const NEIGHBORS = new Set(['South Korea', 'North Korea', 'China', 'Russia', 'Taiwan'])
const FOCUS = new Set(['Japan'])

function round(value, precision = 3) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function simplifyRing(ring, epsilon = 0.06) {
  if (ring.length <= 4) return ring
  const result = [ring[0]]
  for (let i = 1; i < ring.length - 1; i += 1) {
    const [px, py] = result[result.length - 1]
    const [x, y] = ring[i]
    if (Math.abs(x - px) + Math.abs(y - py) >= epsilon) result.push(ring[i])
  }
  result.push(ring[ring.length - 1])
  return result
}

function processGeometry(geometry) {
  const type = geometry.type
  const polygons = type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const out = []
  for (const polygon of polygons) {
    const rings = polygon.map((ring) => simplifyRing(ring).map(([lng, lat]) => [round(lng), round(lat)]))
    out.push(rings)
  }
  return type === 'Polygon'
    ? { type: 'Polygon', coordinates: out[0] }
    : { type: 'MultiPolygon', coordinates: out }
}

const response = await fetch(SOURCE)
if (!response.ok) throw new Error(`fetch failed: ${response.status}`)
const collection = await response.json()

const features = []
for (const feature of collection.features) {
  const name = feature.properties?.name ?? feature.properties?.NAME
  const isForeign = NEIGHBORS.has(name)
  const isFocus = FOCUS.has(name)
  if (!isForeign && !isFocus) continue
  features.push({
    type: 'Feature',
    properties: { name, foreign: isForeign },
    geometry: processGeometry(feature.geometry),
  })
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(
  OUT,
  JSON.stringify({ type: 'FeatureCollection', features }),
)
console.log(`Wrote ${features.length} features to ${OUT}`)
