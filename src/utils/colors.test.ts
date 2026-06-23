import { describe, it, expect } from 'vitest'
import { findClosestBeadColor, computeColorInfo, allBeadColors } from '@/utils/colors'
import { getMatchFn, defaultStrategyId } from '@/utils/colorStrategies'
import type { ColorStrategyId } from '@/types'

describe('Color matching', () => {
  const strategyIds: ColorStrategyId[] = ['euclidean-rgb', 'weighted-rgb', 'lab-euclidean', 'cie76', 'cie2000']

  it('allBeadColors has expected colors', () => {
    expect(allBeadColors.length).toBeGreaterThan(30)
    expect(allBeadColors[0]).toHaveProperty('name')
    expect(allBeadColors[0]).toHaveProperty('code')
    expect(allBeadColors[0]).toHaveProperty('r')
    expect(allBeadColors[0]).toHaveProperty('hex')
  })

  it('finds white for pure white RGB', () => {
    for (const sid of strategyIds) {
      const result = findClosestBeadColor(255, 255, 255, sid)
      expect(result.code).toBe('WHITE')
    }
  })

  it('finds black for pure black RGB', () => {
    for (const sid of strategyIds) {
      const result = findClosestBeadColor(0, 0, 0, sid)
      expect(result.code).toBe('BLACK')
    }
  })

  it('finds red for pure red RGB', () => {
    for (const sid of strategyIds) {
      const result = findClosestBeadColor(237, 28, 36, sid)
      expect(result.code).toBe('RED')
    }
  })

  it('default strategy is lab-euclidean', () => {
    expect(defaultStrategyId).toBe('lab-euclidean')
  })

  it('all strategies return valid BeadColor', () => {
    const colors = [[128, 128, 128], [255, 200, 100], [63, 72, 204]]
    for (const sid of strategyIds) {
      for (const [r, g, b] of colors) {
        const result = findClosestBeadColor(r, g, b, sid)
        expect(result).toBeDefined()
        expect(result.code).toBeTruthy()
        expect(result.r).toBeGreaterThanOrEqual(0)
        expect(result.r).toBeLessThanOrEqual(255)
      }
    }
  })
})

describe('computeColorInfo', () => {
  it('returns empty for empty input', () => {
    expect(computeColorInfo([])).toEqual([])
  })

  it('counts colors correctly', () => {
    const px = [
      { x: 0, y: 0, color: allBeadColors[0] },
      { x: 1, y: 0, color: allBeadColors[0] },
      { x: 2, y: 0, color: allBeadColors[1] },
    ]
    const info = computeColorInfo(px)
    expect(info).toHaveLength(2)
    expect(info[0].count).toBe(2)
    expect(info[1].count).toBe(1)
  })

  it('sorts by count descending', () => {
    const px = [
      { x: 0, y: 0, color: allBeadColors[0] },
      { x: 1, y: 0, color: allBeadColors[1] },
      { x: 2, y: 0, color: allBeadColors[1] },
      { x: 3, y: 0, color: allBeadColors[1] },
    ]
    const info = computeColorInfo(px)
    expect(info[0].count).toBe(3)
  })
})
