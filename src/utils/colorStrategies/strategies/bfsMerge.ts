/**
 * 策略：BFS 区域合并
 *
 * 先用 Lab 欧几里得距离匹配每个像素，再对整个网格执行
 * BFS 自适应区域合并 —— 识别相邻的相似颜色连通区域，
 * 将碎片/噪声颜色合并到邻近的主导颜色区域。
 *
 * 阈值自适应：通过分析相邻区域间的 Lab 距离分布，
 * 自动找到"相似"与"不同"的分界点，无需手动调参。
 */
import type { BeadColor, PixelInfo } from '@/types'
import { registerStrategy } from '../registry'
import { rgbToLab } from '../labUtils'
import { bfsMerge, type BfsMergeOptions } from '@/utils/bfsMerge'

// ---- 基础匹配（Lab 欧几里得，保持与默认策略一致） ----

function match(r: number, g: number, b: number, palette: BeadColor[]): BeadColor {
  const [L, A, B] = rgbToLab(r, g, b)
  let closest = palette[0]
  let minDist = Infinity
  for (const c of palette) {
    const [cL, cA, cB] = rgbToLab(c.r, c.g, c.b)
    const dL = L - cL
    const dA = A - cA
    const dB = B - cB
    const dist = dL * dL + dA * dA + dB * dB
    if (dist < minDist) {
      minDist = dist
      closest = c
    }
  }
  return closest
}

// ---- 后处理包装（将通用 options 转为 bfsMerge 专用参数） ----

function postProcess(
  pixels: PixelInfo[],
  width: number,
  height: number,
  options?: Record<string, unknown>,
): PixelInfo[] {
  const bfsOpts: BfsMergeOptions = {}
  if (options?.threshold != null) {
    bfsOpts.threshold = Number(options.threshold)
  }
  return bfsMerge(pixels, width, height, bfsOpts)
}

registerStrategy({
  id: 'bfs-merge',
  name: 'BFS 区域合并',
  description: 'Lab匹配后用BFS自动识别相邻相似区域并合并，阈值自适应',
  match,
  postProcess,
  /** 后处理默认参数：threshold=-1 表示自动（自适应），用户可覆盖为正值 */
  postProcessDefaults: { threshold: -1 },
})
