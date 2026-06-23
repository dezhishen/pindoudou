/**
 * 策略：加权 RGB
 *
 * 提高绿色权重（R×2, G×4, B×3），模拟人眼对不同波长的敏感度差异。
 */
import type { BeadColor } from '@/types'
import { registerStrategy } from '../registry'

function match(r: number, g: number, b: number, palette: BeadColor[]): BeadColor {
  let closest = palette[0]
  let minDist = Infinity
  for (const c of palette) {
    const dr = (r - c.r) * 2
    const dg = (g - c.g) * 4
    const db = (b - c.b) * 3
    const dist = dr * dr + dg * dg + db * db
    if (dist < minDist) {
      minDist = dist
      closest = c
    }
  }
  return closest
}

registerStrategy({
  id: 'weighted-rgb',
  name: '加权 RGB',
  description: '提高绿色权重，模拟人眼敏感度，比纯RGB略好',
  match,
})
