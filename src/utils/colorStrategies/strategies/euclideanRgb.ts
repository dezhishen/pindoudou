/**
 * 策略：RGB 欧几里得距离
 *
 * RGB 空间直接计算欧几里得距离的平方，速度最快，
 * 但对暗色区域偏差较大。
 */
import type { BeadColor } from '@/types'
import { registerStrategy } from '../registry'

function match(r: number, g: number, b: number, palette: BeadColor[]): BeadColor {
  let closest = palette[0]
  let minDist = Infinity
  for (const c of palette) {
    const dr = r - c.r
    const dg = g - c.g
    const db = b - c.b
    const dist = dr * dr + dg * dg + db * db
    if (dist < minDist) {
      minDist = dist
      closest = c
    }
  }
  return closest
}

registerStrategy({
  id: 'euclidean-rgb',
  name: 'RGB 欧几里得',
  description: 'RGB空间直接距离，速度快但对暗色区域偏差较大',
  match,
})
