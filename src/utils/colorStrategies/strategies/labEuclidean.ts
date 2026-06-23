/**
 * 策略：CIELAB 欧几里得距离
 *
 * 将 sRGB 转换到感知均匀的 CIELAB 空间后计算欧几里得距离，
 * 对各类颜色还原度大幅优于 RGB 空间。
 *
 * ★ 默认策略
 */
import type { BeadColor } from '@/types'
import { registerStrategy } from '../registry'
import { rgbToLab } from '../labUtils'

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

registerStrategy({
  id: 'lab-euclidean',
  name: 'Lab 欧几里得',
  description: '转换到CIELAB感知均匀空间后计算距离，还原度大幅提升',
  match,
})
