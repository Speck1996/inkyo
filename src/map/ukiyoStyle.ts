import type { StyleSpecification, LayerSpecification } from 'maplibre-gl'
import { mapTokens, palette } from '@/design/tokens'
import base from './openfreemap-positron.json'
import foreignMask from './japan-foreign-mask.json'

type SymbolLayer = Extract<LayerSpecification, { type: 'symbol' }>

const baseStyle = base as unknown as StyleSpecification
const mask = foreignMask as GeoJSON.FeatureCollection

const landFill = '#ecdcb8'
const landMuted = '#e2d3ad'
const woodFill = '#c3cba6'
const sandFill = '#e6d4a8'
const buildingFill = '#dbc9a2'

function isType<T extends LayerSpecification['type']>(
  layer: LayerSpecification,
  type: T,
): layer is Extract<LayerSpecification, { type: T }> {
  return layer.type === type
}

function recolorWater(layers: LayerSpecification[]) {
  for (const layer of layers) {
    if (layer.id === 'background') {
      layer.paint = { 'background-color': landFill }
    }
    if (layer.id === 'park' && isType(layer, 'fill')) {
      layer.paint = { 'fill-color': woodFill }
    }
    if (layer.id === 'water' && isType(layer, 'fill')) {
      layer.paint = {
        'fill-antialias': true,
        'fill-color': palette.indigo,
        'fill-opacity': 0.94,
      }
    }
    if (layer.id.startsWith('landcover_wood') && isType(layer, 'fill')) {
      layer.paint = {
        'fill-color': woodFill,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0, 12, 0.8],
      }
    }
    if (layer.id.startsWith('landcover_') && isType(layer, 'fill')) {
      layer.paint = { 'fill-color': sandFill, 'fill-opacity': 0.55 }
    }
    if (layer.id === 'landuse_residential' && isType(layer, 'fill')) {
      layer.paint = {
        'fill-color': landMuted,
        'fill-opacity': ['interpolate', ['exponential', 0.6], ['zoom'], 8, 0.6, 9, 0.35],
      }
    }
    if (layer.id === 'waterway' && isType(layer, 'line')) {
      layer.paint = { 'line-color': palette.indigo, 'line-opacity': 0.65 }
    }
    if (layer.id === 'building' && isType(layer, 'fill')) {
      layer.paint = {
        'fill-antialias': true,
        'fill-color': buildingFill,
        'fill-outline-color': 'rgba(107, 90, 58, 0.35)',
        'fill-opacity': 0.9,
      }
    }
  }
}

function recolorRoads(layers: LayerSpecification[]) {
  const highwayClasses = ['highway_motorway', 'highway_major', 'highway_minor', 'highway_path']
  for (const layer of layers) {
    const isHighway = highwayClasses.some((prefix) => layer.id.startsWith(prefix))
    if (!isHighway || !isType(layer, 'line')) continue
    const isCasing = layer.id.endsWith('casing')
    const isMotorway = layer.id.includes('motorway')
    if (isCasing) {
      layer.paint = { 'line-color': mapTokens.roadCasing, 'line-opacity': 0.7 }
    } else {
      layer.paint = {
        ...layer.paint,
        'line-color': isMotorway ? palette.beni : palette.ochre,
        'line-opacity': 0.95,
      }
    }
  }
  for (const layer of layers) {
    if (layer.id.startsWith('railway') && isType(layer, 'line')) {
      layer.paint = { 'line-color': palette.sumi, 'line-opacity': 0.45 }
    }
    if (layer.id.startsWith('boundary_') && isType(layer, 'line')) {
      layer.paint = {
        ...layer.paint,
        'line-color': palette.sumi,
        'line-opacity': 0.28,
      }
    }
  }
}

function recolorLabels(layers: LayerSpecification[]) {
  for (const layer of layers) {
    if (layer.type !== 'symbol') continue
    const symbol = layer as SymbolLayer
    const isWater = layer.id.startsWith('water')
    symbol.paint = {
      ...symbol.paint,
      'text-color': isWater ? palette.washi : mapTokens.labelText,
      'text-halo-color': isWater ? palette.indigo : mapTokens.labelHalo,
      'text-halo-width': 2,
      'text-halo-blur': 0.6,
    }
  }
}

function focusLayers(): LayerSpecification[] {
  const maskFill: LayerSpecification = {
    id: 'inkyo-foreign-mask',
    type: 'fill',
    source: 'inkyo-mask',
    filter: ['==', ['get', 'foreign'], true],
    paint: {
      'fill-color': mapTokens.foreignFill,
      'fill-opacity': mapTokens.foreignOpacity,
    },
  }
  const japanCoast: LayerSpecification = {
    id: 'inkyo-japan-coast',
    type: 'line',
    source: 'inkyo-mask',
    filter: ['==', ['get', 'foreign'], false],
    paint: {
      'line-color': mapTokens.japanCoast,
      'line-opacity': 0.35,
      'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.8, 10, 1.6],
    },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  }
  return [maskFill, japanCoast]
}

function placeLayers(): LayerSpecification[] {
  const halo: LayerSpecification = {
    id: 'inkyo-place-halo',
    type: 'circle',
    source: 'inkyo-places',
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 8, 10, 13, 14, 16],
      'circle-color': 'rgba(193, 53, 47, 0.16)',
      'circle-blur': 1,
    },
  }
  const circle: LayerSpecification = {
    id: 'inkyo-place-circles',
    type: 'circle',
    source: 'inkyo-places',
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, ['case', ['get', 'selected'], 7, 5],
        10, ['case', ['get', 'selected'], 10, 7],
        14, ['case', ['get', 'selected'], 12, 8],
      ],
      'circle-color': palette.beni,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 1,
    },
  }
  const label: LayerSpecification = {
    id: 'inkyo-place-labels',
    type: 'symbol',
    source: 'inkyo-places',
    filter: ['==', ['geometry-type'], 'Point'],
    minzoom: 8,
    paint: {
      'text-color': mapTokens.labelText,
      'text-halo-color': mapTokens.labelHalo,
      'text-halo-width': 2.5,
      'text-halo-blur': 0.6,
    },
    layout: {
      'text-field': ['get', 'name'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 12, 14],
      'text-offset': [0, 1.4],
      'text-anchor': 'top',
      'text-optional': true,
      'text-font': ['Noto Sans Regular'],
    },
  }
  return [halo, circle, label]
}

export function buildUkiyoStyle(): StyleSpecification {
  const layers = (baseStyle.layers ?? []).map((layer) => structuredClone(layer))
  recolorWater(layers)
  recolorRoads(layers)
  recolorLabels(layers)

  return {
    ...baseStyle,
    sources: {
      ...baseStyle.sources,
      'inkyo-mask': { type: 'geojson', data: mask },
      'inkyo-places': {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    },
    layers: [...layers, ...focusLayers(), ...placeLayers()],
  }
}

export const JAPAN_CENTER: [number, number] = [137.0, 37.0]
export const JAPAN_ZOOM = 4.6
export const JAPAN_BOUNDS: [[number, number], [number, number]] = [
  [120.0, 22.0],
  [148.0, 48.0],
]

export type UkiyoStyle = ReturnType<typeof buildUkiyoStyle>
export { landFill, woodFill }
