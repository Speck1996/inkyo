import { describe, expect, it } from 'vitest'
import { buildUkiyoStyle } from './ukiyoStyle'

describe('buildUkiyoStyle', () => {
  const style = buildUkiyoStyle()

  it('registers the places and mask geojson sources', () => {
    expect(style.sources['inkyo-places']).toBeDefined()
    expect(style.sources['inkyo-mask']).toBeDefined()
    expect(style.sources['openmaptiles']).toBeDefined()
  })

  it('recolors water to indigo', () => {
    const water = style.layers?.find((layer) => layer.id === 'water')
    expect(water).toBeDefined()
    expect(JSON.stringify(water?.paint)).toContain('#1b3a5c')
  })

  it('appends focus and place layers on top', () => {
    const ids = (style.layers ?? []).map((layer) => layer.id)
    expect(ids).toContain('inkyo-foreign-mask')
    expect(ids).toContain('inkyo-japan-coast')
    expect(ids).toContain('inkyo-place-circles')
    expect(ids).toContain('inkyo-place-labels')
    expect(ids[ids.length - 1]).toBe('inkyo-place-labels')
  })

  it('masks non-Japan land and outlines Japan', () => {
    const mask = style.layers?.find((layer) => layer.id === 'inkyo-foreign-mask')
    const coast = style.layers?.find((layer) => layer.id === 'inkyo-japan-coast')
    expect(JSON.stringify(mask)).toContain('foreign')
    expect(JSON.stringify(coast)).toContain('foreign')
  })

  it('gives labels a washi halo for readability', () => {
    const label = style.layers?.find((layer) => layer.id === 'inkyo-place-labels')
    expect(JSON.stringify(label?.paint)).toContain('#f4ecd8')
  })
})
