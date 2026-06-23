/**
 * 策略：CIEDE2000
 *
 * 业界金标准色差公式，最接近人眼感知，
 * 精度最高但计算量较大。
 */
import type { BeadColor } from '@/types'
import { registerStrategy } from '../registry'
import { rgbToLab, deg2rad } from '../labUtils'

function match(r: number, g: number, b: number, palette: BeadColor[]): BeadColor {
  const [L1, a1, b1] = rgbToLab(r, g, b)
  let closest = palette[0]
  let minDist = Infinity

  const C1 = Math.sqrt(a1 * a1 + b1 * b1)

  for (const c of palette) {
    const [L2, a2, b2] = rgbToLab(c.r, c.g, c.b)

    const C2 = Math.sqrt(a2 * a2 + b2 * b2)
    const Cb = (C1 + C2) / 2
    const CbPow7 = Math.pow(Cb, 7)
    const G = 0.5 * (1 - Math.sqrt(CbPow7 / (CbPow7 + 6103515625)))

    const a1p = a1 * (1 + G)
    const a2p = a2 * (1 + G)
    const C1p = Math.sqrt(a1p * a1p + b1 * b1)
    const C2p = Math.sqrt(a2p * a2p + b2 * b2)

    let h1p = Math.atan2(b1, a1p)
    if (h1p < 0) h1p += 2 * Math.PI
    let h2p = Math.atan2(b2, a2p)
    if (h2p < 0) h2p += 2 * Math.PI

    const dLp = L2 - L1
    const dCp = C2p - C1p

    let dhp: number
    if (C1p * C2p === 0) {
      dhp = 0
    } else {
      const dh = h2p - h1p
      if (Math.abs(dh) <= Math.PI) dhp = dh
      else if (dh > Math.PI) dhp = dh - 2 * Math.PI
      else dhp = dh + 2 * Math.PI
    }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp / 2)

    const Lbp = (L1 + L2) / 2
    const Cbp = (C1p + C2p) / 2

    let hbp: number
    if (C1p * C2p === 0) {
      hbp = h1p + h2p
    } else {
      const dh = Math.abs(h1p - h2p)
      if (dh <= Math.PI) hbp = (h1p + h2p) / 2
      else if (h1p + h2p < 2 * Math.PI) hbp = (h1p + h2p) / 2 + Math.PI
      else hbp = (h1p + h2p) / 2 - Math.PI
    }

    const T = 1
      - 0.17 * Math.cos(hbp - deg2rad(30))
      + 0.24 * Math.cos(2 * hbp)
      + 0.32 * Math.cos(3 * hbp + deg2rad(6))
      - 0.20 * Math.cos(4 * hbp - deg2rad(63))

    const dTheta = deg2rad(30) * Math.exp(-Math.pow((hbp * 180 / Math.PI - 275) / 25, 2))
    const CbpPow7b = Math.pow(Cbp, 7)
    const Rc = 2 * Math.sqrt(CbpPow7b / (CbpPow7b + 6103515625))
    const Sl = 1 + (0.015 * (Lbp - 50) * (Lbp - 50)) / Math.sqrt(20 + (Lbp - 50) * (Lbp - 50))
    const Sc = 1 + 0.045 * Cbp
    const Sh = 1 + 0.015 * Cbp * T
    const Rt = -Math.sin(2 * dTheta) * Rc

    const dE = Math.sqrt(
      (dLp / Sl) * (dLp / Sl) +
      (dCp / Sc) * (dCp / Sc) +
      (dHp / Sh) * (dHp / Sh) +
      Rt * (dCp / Sc) * (dHp / Sh),
    )

    if (dE < minDist) {
      minDist = dE
      closest = c
    }
  }

  return closest
}

registerStrategy({
  id: 'cie2000',
  name: 'CIEDE2000',
  description: '业界金标准，最接近人眼感知，精度最高但计算量较大',
  match,
})
