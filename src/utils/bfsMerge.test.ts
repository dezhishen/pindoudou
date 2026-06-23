import { describe, it, expect } from 'vitest'
import { bfsMerge, detectRegionsOnly } from '@/utils/bfsMerge'
import type { PixelInfo } from '@/types'
import { allBeadColors } from '@/utils/colors'

/** 辅助：根据颜色名查找 BeadColor */
function c(name: string) {
  const found = allBeadColors.find(b => b.name === name)
  if (!found) throw new Error(`Color not found: ${name}`)
  return { ...found }
}

/** 辅助：构建 2D 网格 → 一维 PixelInfo[] */
function grid(
  rows: string[][],
): { pixels: PixelInfo[]; width: number; height: number } {
  const height = rows.length
  const width = rows[0].length
  const pixels: PixelInfo[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      pixels.push({ x, y, color: c(rows[y][x]) })
    }
  }
  return { pixels, width, height }
}

/** 辅助：获取网格中指定位置的颜色名 */
function at(pixels: PixelInfo[], width: number, x: number, y: number): string {
  return pixels[y * width + x].color.name
}

// ============================================================
describe('bfsMerge', () => {
  it('空输入应原样返回', () => {
    const result = bfsMerge([], 0, 0)
    expect(result).toEqual([])
  })

  it('单色网格不产生合并', () => {
    const { pixels, width, height } = grid([
      ['白色', '白色'],
      ['白色', '白色'],
    ])
    const before = pixels.map(p => p.color.name)
    bfsMerge(pixels, width, height)
    expect(pixels.map(p => p.color.name)).toEqual(before)
  })

  it('双色棋盘格不应合并', () => {
    const { pixels, width, height } = grid([
      ['白色', '黑色'],
      ['黑色', '白色'],
    ])
    const before = pixels.map(p => p.color.name)
    bfsMerge(pixels, width, height)
    // 白色和黑色距离很大，不应合并
    expect(pixels.map(p => p.color.name)).toEqual(before)
  })

  it('两个大面积不同颜色不应合并', () => {
    // 左半红右半蓝，面积都很大且颜色差异大
    const { pixels, width, height } = grid([
      ['红色', '红色', '蓝色', '蓝色'],
      ['红色', '红色', '蓝色', '蓝色'],
    ])
    const before = pixels.map(p => p.color.name)
    bfsMerge(pixels, width, height)
    expect(pixels.map(p => p.color.name)).toEqual(before)
  })

  it('小碎片颜色应被合并到相邻大区域', () => {
    // 天蓝色大背景中有一个孤立的浅蓝色像素（二者 Lab 距离 ≈9，非常接近）
    const { pixels, width, height } = grid([
      ['天蓝色', '天蓝色', '天蓝色'],
      ['天蓝色', '浅蓝色', '天蓝色'],
      ['天蓝色', '天蓝色', '天蓝色'],
    ])
    bfsMerge(pixels, width, height)
    // 中央的浅蓝色应该被合并为天蓝色
    expect(at(pixels, width, 1, 1)).toBe('天蓝色')
  })

  it('相似相邻颜色区域应合并', () => {
    // 浅蓝色和天蓝色非常相似，相邻应合并
    const { pixels, width, height } = grid([
      ['浅蓝色', '浅蓝色', '天蓝色', '天蓝色'],
      ['浅蓝色', '浅蓝色', '天蓝色', '天蓝色'],
    ])
    bfsMerge(pixels, width, height)
    // 合并后应统一为一种颜色（较大区域的颜色主导）
    const names = new Set(pixels.map(p => p.color.name))
    expect(names.size).toBe(1)
  })

  it('3×1 长条相似色应合并', () => {
    const { pixels, width, height } = grid([
      ['浅蓝色', '天蓝色', '浅蓝色'],
    ])
    bfsMerge(pixels, width, height)
    const names = new Set(pixels.map(p => p.color.name))
    expect(names.size).toBeLessThanOrEqual(2)
  })

  it('不应破坏不相似区域', () => {
    // 红、绿、蓝三块不应互相合并
    const { pixels, width, height } = grid([
      ['红色', '红色', '绿色', '绿色'],
      ['红色', '红色', '绿色', '绿色'],
      ['蓝色', '蓝色', '蓝色', '蓝色'],
      ['蓝色', '蓝色', '蓝色', '蓝色'],
    ])
    bfsMerge(pixels, width, height)
    // 三块区域的主体颜色应保持不变
    expect(at(pixels, width, 0, 0)).toBe('红色')
    expect(at(pixels, width, 2, 0)).toBe('绿色')
    expect(at(pixels, width, 0, 2)).toBe('蓝色')
  })
})

// ============================================================
describe('detectRegionsOnly', () => {
  it('单色应返回 1 个区域', () => {
    const { pixels, width, height } = grid([
      ['白色', '白色'],
      ['白色', '白色'],
    ])
    const info = detectRegionsOnly(pixels, width, height)
    expect(info.regionCount).toBe(1)
    expect(info.regionSizes).toEqual([4])
  })

  it('棋盘格应返回多个区域', () => {
    const { pixels, width, height } = grid([
      ['白色', '黑色'],
      ['黑色', '白色'],
    ])
    const info = detectRegionsOnly(pixels, width, height)
    expect(info.regionCount).toBe(4)
  })

  it('大块中有一个孤立像素', () => {
    const { pixels, width, height } = grid([
      ['红色', '红色', '红色'],
      ['红色', '蓝色', '红色'],
      ['红色', '红色', '红色'],
    ])
    const info = detectRegionsOnly(pixels, width, height)
    expect(info.regionCount).toBe(2)
    expect(info.regionSizes).toContain(1)
    expect(info.regionSizes).toContain(8)
  })
})
