/**
 * 策略：CIE76 ΔE
 *
 * 经典 ΔE76 色差公式，在 CIELAB 空间使用加权欧几里得距离。
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
    const dist = Math.sqrt(dL * dL + dA * dA + dB * dB)
    if (dist < minDist) {
      minDist = dist
      closest = c
    }
  }
  return closest
}

registerStrategy({
  id: 'cie76',
  name: 'CIE76 ΔE',
  description: '经典ΔE76色差公式，Lab空间加权距离',
  match,
})
