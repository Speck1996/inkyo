import { describe, expect, it } from 'vitest'
import { parseSavedPosts, parseSavedCollections } from './parse'

describe('parseSavedPosts', () => {
  it('extracts urls and timestamps', () => {
    const json = {
      saved_saved_posts: [
        {
          title: 'Someone',
          string_map_data: {
            'Saved on': { href: 'https://www.instagram.com/reel/ABC123/', timestamp: 1700000000 },
          },
        },
        {
          title: 'Other',
          string_map_data: {
            'Saved on': { href: 'https://www.instagram.com/p/XYZ789/', timestamp: 1700000100 },
          },
        },
      ],
    }
    const reels = parseSavedPosts(json)
    expect(reels).toHaveLength(2)
    expect(reels[0].url).toBe('https://www.instagram.com/reel/ABC123/')
    expect(reels[0].saved_at).toBe(new Date(1700000000 * 1000).toISOString())
  })

  it('skips entries without hrefs', () => {
    expect(parseSavedPosts({ saved_saved_posts: [{ title: 'x' }] })).toEqual([])
  })
})

describe('parseSavedCollections', () => {
  it('reads collection names and hrefs', () => {
    const json = {
      saved_saved_collections: [
        { title: 'Japan', string_map_data: { Name: { href: 'https://instagram.com/p/1' } } },
      ],
    }
    const collections = parseSavedCollections(json)
    expect(collections[0].name).toBe('Japan')
    expect(collections[0].urls).toEqual(['https://instagram.com/p/1'])
  })
})
