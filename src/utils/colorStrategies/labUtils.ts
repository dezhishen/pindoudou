/**
 * sRGB ↔ CIELAB 色彩空间转换工具
 * 供 lab-euclidean、cie76、cie2000 策略共用
 */

// ---------- sRGB → Linear ----------
function srgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

// ---------- D65 白点 ----------
const D65_X = 0.95047
const D65_Y = 1.0
const D65_Z = 1.08883

// ---------- Linear RGB → XYZ ----------
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const rl = srgbToLinear(r)
  const gl = srgbToLinear(g)
  const bl = srgbToLinear(b)
  return [
    (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) * 100,
    (0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl) * 100,
    (0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl) * 100,
  ]
}

// ---------- XYZ → Lab ----------
function fLab(t: number): number {
  const delta = 6 / 29
  return t > delta * delta * delta
    ? Math.cbrt(t)
    : t / (3 * delta * delta) + 4 / 29
}

function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const fx = fLab(x / (D65_X * 100))
  const fy = fLab(y / (D65_Y * 100))
  const fz = fLab(z / (D65_Z * 100))
  return [
    116 * fy - 16,
    500 * (fx - fy),
    200 * (fy - fz),
  ]
}

// ---------- 公开 API ----------

/** sRGB(0-255) → CIELAB(L, a, b) */
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const [x, y, z] = rgbToXyz(r, g, b)
  return xyzToLab(x, y, z)
}

/** 角度转弧度 */
export function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180
}
