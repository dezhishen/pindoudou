/**
 * BFS 区域合并算法 —— 自动识别相邻的相似颜色区域并合并
 *
 * 两阶段：
 *   Phase 1: BFS 找出所有连通区域（相同拼豆颜色的 4-邻接连通分量）
 *   Phase 2: 自适应阈值判断相邻区域是否相似，将相似的小区域合并到大区域
 *
 * 阈值自适应策略：
 *   收集所有相邻区域对在 CIELAB 空间的颜色距离，
 *   通过分析距离分布自动找到"相似"与"不同"的分界点（最大间隙法），
 *   对无显著间隙的图像回退到基于百分位的阈值。
 */
import type { PixelInfo, BeadColor } from '@/types'
import { rgbToLab } from './colorStrategies/labUtils'

// ============================================================
//  类型定义
// ============================================================

interface Cell {
  x: number
  y: number
}

interface Region {
  id: number
  cells: Cell[]
  size: number
  /** 区域内像素的平均 CIELAB 颜色 */
  avgLab: [number, number, number]
  /** 区域当前使用的拼豆颜色 */
  beadColor: BeadColor
}

interface AdjacentPair {
  a: number
  b: number
  dist: number
}

// ============================================================
//  公开 API
// ============================================================

/** BFS 合并的可选参数 */
export interface BfsMergeOptions {
  /**
   * 手动阈值（CIELAB ΔE 距离）。
   * - 正值：直接使用该值作为合并阈值（越大越激进，合并越多）
   * - 0 或负值/未提供：自动计算自适应阈值
   */
  threshold?: number
}

/**
 * BFS 区域合并
 *
 * @param pixels   已匹配拼豆颜色的像素数组（会被原地修改）
 * @param width    网格宽度
 * @param height   网格高度
 * @param options  可选参数（如手动阈值）
 * @returns        合并后的像素数组（同传入引用）
 */
export function bfsMerge(
  pixels: PixelInfo[],
  width: number,
  height: number,
  options?: BfsMergeOptions,
): PixelInfo[] {
  if (pixels.length === 0 || width <= 0 || height <= 0) return pixels

  // ---------- Phase 1: BFS 连通区域检测 ----------
  const regions = detectRegions(pixels, width, height)

  // 只有一个区域，无需合并
  if (regions.length <= 1) return pixels

  // ---------- Phase 2: 自适应阈值 & 区域合并 ----------
  const pairs = buildAdjacency(regions, width, height)
  if (pairs.length === 0) return pixels

  const threshold =
    options?.threshold != null && options.threshold > 0
      ? options.threshold
      : computeAdaptiveThreshold(pairs)

  // 按距离升序合并（最相似的先合并）
  mergeRegions(regions, pairs, threshold, pixels, width)

  return pixels
}

/**
 * 计算自适应阈值（不执行合并），供 UI 展示参考值
 */
export function getAdaptiveThreshold(
  pixels: PixelInfo[],
  width: number,
  height: number,
): number | null {
  if (pixels.length === 0 || width <= 0 || height <= 0) return null
  const regions = detectRegions(pixels, width, height)
  if (regions.length <= 1) return null
  const pairs = buildAdjacency(regions, width, height)
  if (pairs.length === 0) return null
  return computeAdaptiveThreshold(pairs)
}

/**
 * 仅检测区域（不执行合并），用于调试/分析
 */
export function detectRegionsOnly(
  pixels: PixelInfo[],
  width: number,
  height: number,
): { regionCount: number; regionSizes: number[] } {
  const regions = detectRegions(pixels, width, height)
  return {
    regionCount: regions.length,
    regionSizes: regions.map(r => r.size).sort((a, b) => b - a),
  }
}

// ============================================================
//  Phase 1: BFS 连通区域检测
// ============================================================

function detectRegions(
  pixels: PixelInfo[],
  width: number,
  height: number,
): Region[] {
  const visited = new Uint8Array(width * height)
  const regions: Region[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (visited[idx]) continue

      const targetCode = pixels[idx].color.code
      const region: Region = {
        id: regions.length,
        cells: [],
        size: 0,
        avgLab: [0, 0, 0],
        beadColor: pixels[idx].color,
      }

      // BFS
      const queue: Cell[] = [{ x, y }]
      visited[idx] = 1

      while (queue.length > 0) {
        const cell = queue.shift()!
        region.cells.push(cell)
        region.size++

        const c = pixels[cell.y * width + cell.x].color
        const [l, a, b] = rgbToLab(c.r, c.g, c.b)
        region.avgLab[0] += l
        region.avgLab[1] += a
        region.avgLab[2] += b

        // 4-邻接
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nx = cell.x + dx
          const ny = cell.y + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          const nidx = ny * width + nx
          if (!visited[nidx] && pixels[nidx].color.code === targetCode) {
            visited[nidx] = 1
            queue.push({ x: nx, y: ny })
          }
        }
      }

      region.avgLab[0] /= region.size
      region.avgLab[1] /= region.size
      region.avgLab[2] /= region.size

      regions.push(region)
    }
  }

  return regions
}

// ============================================================
//  Phase 2a: 构建区域邻接图
// ============================================================

function buildAdjacency(
  regions: Region[],
  width: number,
  height: number,
): AdjacentPair[] {
  // 构建 cell → region 映射
  const cellToRegion = new Int32Array(width * height).fill(-1)
  for (const r of regions) {
    for (const c of r.cells) {
      cellToRegion[c.y * width + c.x] = r.id
    }
  }

  // 扫描所有水平 & 垂直邻接边，收集不同区域间的邻接对
  const pairSet = new Set<string>()
  const pairs: AdjacentPair[] = []

  const addPair = (ra: number, rb: number) => {
    if (ra === rb || ra < 0 || rb < 0) return
    const [min, max] = ra < rb ? [ra, rb] : [rb, ra]
    const key = `${min}-${max}`
    if (pairSet.has(key)) return
    pairSet.add(key)

    const [aL, aA, aB] = regions[ra].avgLab
    const [bL, bA, bB] = regions[rb].avgLab
    const dL = aL - bL
    const dA = aA - bA
    const dB = aB - bB
    const dist = Math.sqrt(dL * dL + dA * dA + dB * dB)

    pairs.push({ a: ra, b: rb, dist })
  }

  // 水平邻接
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      addPair(cellToRegion[y * width + x], cellToRegion[y * width + x + 1])
    }
  }

  // 垂直邻接
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width; x++) {
      addPair(cellToRegion[y * width + x], cellToRegion[(y + 1) * width + x])
    }
  }

  return pairs
}

// ============================================================
//  Phase 2b: 自适应阈值计算
// ============================================================

/**
 * 自适应阈值 —— 最大间隙法
 *
 * 将所有相邻区域对的 Lab 距离排序，在距离分布的下半部分寻找最大间隙，
 * 以该间隙作为"相似"与"不相似"的分界点。若无显著间隙则回退到中位数比例法。
 */
const MIN_THRESHOLD = 3    // 最小阈值，防止过度合并
const MAX_THRESHOLD = 18   // 最大阈值，防止合并不够

function computeAdaptiveThreshold(pairs: AdjacentPair[]): number {
  const distances = pairs.map(p => p.dist).sort((a, b) => a - b)

  // 只有一对相邻区域：如果距离不太大就合并
  if (distances.length === 1) {
    return Math.min(distances[0] * 1.2, MAX_THRESHOLD)
  }

  // ---- 策略 A: 最大间隙法（在下半部分寻找） ----
  const mid = Math.max(1, Math.floor(distances.length * 0.6))
  let maxGap = 0
  let gapThreshold = distances[0]

  for (let i = 1; i <= mid; i++) {
    const gap = distances[i] - distances[i - 1]
    if (gap > maxGap) {
      maxGap = gap
      gapThreshold = (distances[i] + distances[i - 1]) / 2
    }
  }

  // 如果找到显著间隙（> 平均间隙 × 2），使用间隙阈值
  const avgGap = (distances[mid] - distances[0]) / mid
  if (maxGap > avgGap * 2.0) {
    return clamp(gapThreshold, MIN_THRESHOLD, MAX_THRESHOLD)
  }

  // ---- 策略 B: 回退 —— 中位数比例法 ----
  const medianIdx = Math.floor(distances.length / 2)
  const median = distances[medianIdx]
  const fallback = median * 0.45

  return clamp(fallback, MIN_THRESHOLD, MAX_THRESHOLD)
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

// ============================================================
//  Phase 2c: 合并执行
// ============================================================

function mergeRegions(
  regions: Region[],
  pairs: AdjacentPair[],
  threshold: number,
  pixels: PixelInfo[],
  width: number,
): void {
  // 按距离升序排序
  const sorted = [...pairs].sort((a, b) => a.dist - b.dist)

  // Union-Find 追踪合并关系
  const parent = new Int32Array(regions.length)
  const finalColor = new Array<BeadColor | null>(regions.length).fill(null)
  for (let i = 0; i < regions.length; i++) {
    parent[i] = i
    finalColor[i] = regions[i].beadColor
  }

  function find(i: number): number {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]]
      i = parent[i]
    }
    return i
  }

  function union(ia: number, ib: number, dominantColor: BeadColor) {
    const ra = find(ia)
    const rb = find(ib)
    if (ra === rb) return
    // 小区域合并到大区域
    if (regions[ra].size >= regions[rb].size) {
      parent[rb] = ra
      finalColor[ra] = dominantColor
    } else {
      parent[ra] = rb
      finalColor[rb] = dominantColor
    }
  }

  // 合并相似区域
  for (const pair of sorted) {
    if (pair.dist > threshold) break // 已排序，后面距离更大

    const ra = find(pair.a)
    const rb = find(pair.b)
    if (ra === rb) continue

    // 以较大区域的颜色为主导
    const dominant =
      regions[pair.a].size >= regions[pair.b].size
        ? regions[pair.a].beadColor
        : regions[pair.b].beadColor

    union(pair.a, pair.b, dominant)
  }

  // 应用合并结果到像素
  for (const region of regions) {
    const root = find(region.id)
    const color = finalColor[root]
    if (!color || color.code === region.beadColor.code) continue

    for (const cell of region.cells) {
      pixels[cell.y * width + cell.x].color = { ...color }
    }
  }
}
