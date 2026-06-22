import type { BeadColor, RawPixel, PixelInfo } from '@/types'

// 标准拼豆颜色调色板（与后端 colors.go 一致）
export const allBeadColors: BeadColor[] = [
  { name: '白色', code: 'WHITE', r: 255, g: 255, b: 255, hex: '#FFFFFF' },
  { name: '奶油色', code: 'CREAM', r: 255, g: 253, b: 208, hex: '#FFFDD0' },
  { name: '浅粉色', code: 'LTPINK', r: 255, g: 182, b: 193, hex: '#FFB6C1' },
  { name: '粉色', code: 'PINK', r: 255, g: 105, b: 180, hex: '#FF69B4' },
  { name: '深粉色', code: 'DEEPINK', r: 219, g: 112, b: 147, hex: '#DB7093' },
  { name: '红色', code: 'RED', r: 237, g: 28, b: 36, hex: '#ED1C24' },
  { name: '深红色', code: 'DKRED', r: 185, g: 22, b: 22, hex: '#B91616' },
  { name: '栗色', code: 'MAROON', r: 128, g: 0, b: 0, hex: '#800000' },
  { name: '浅橙色', code: 'LTORANGE', r: 255, g: 200, b: 100, hex: '#FFC864' },
  { name: '橙色', code: 'ORANGE', r: 255, g: 127, b: 39, hex: '#FF7F27' },
  { name: '深橙色', code: 'DKRANGE', r: 255, g: 90, b: 0, hex: '#FF5A00' },
  { name: '浅黄色', code: 'LTYELLOW', r: 255, g: 255, b: 150, hex: '#FFFF96' },
  { name: '黄色', code: 'YELLOW', r: 255, g: 242, b: 0, hex: '#FFF200' },
  { name: '深黄色', code: 'DKYELLOW', r: 252, g: 210, b: 0, hex: '#FCD200' },
  { name: '浅绿色', code: 'LTGREEN', r: 144, g: 238, b: 144, hex: '#90EE90' },
  { name: '绿色', code: 'GREEN', r: 34, g: 177, b: 76, hex: '#22B14C' },
  { name: '深绿色', code: 'DKGREEN', r: 0, g: 128, b: 0, hex: '#008000' },
  { name: '青绿色', code: 'TEAL', r: 0, g: 128, b: 128, hex: '#008080' },
  { name: '浅蓝色', code: 'LTBLUE', r: 173, g: 216, b: 230, hex: '#ADD8E6' },
  { name: '天蓝色', code: 'SKYBLUE', r: 135, g: 206, b: 235, hex: '#87CEEB' },
  { name: '蓝色', code: 'BLUE', r: 63, g: 72, b: 204, hex: '#3F48CC' },
  { name: '深蓝色', code: 'DKBLUE', r: 0, g: 0, b: 139, hex: '#00008B' },
  { name: '靛蓝色', code: 'INDIGO', r: 75, g: 0, b: 130, hex: '#4B0082' },
  { name: '紫色', code: 'PURPLE', r: 163, g: 73, b: 164, hex: '#A349A4' },
  { name: '浅紫色', code: 'LTPURPLE', r: 200, g: 160, b: 210, hex: '#C8A0D2' },
  { name: '薰衣草', code: 'LAVENDER', r: 230, g: 200, b: 255, hex: '#E6C8FF' },
  { name: '棕色', code: 'BROWN', r: 139, g: 69, b: 19, hex: '#8B4513' },
  { name: '浅棕色', code: 'LTBROWN', r: 205, g: 133, b: 63, hex: '#CD853F' },
  { name: '深棕色', code: 'DKBROWN', r: 101, g: 55, b: 0, hex: '#653700' },
  { name: '灰色', code: 'GRAY', r: 128, g: 128, b: 128, hex: '#808080' },
  { name: '浅灰色', code: 'LTGRAY', r: 192, g: 192, b: 192, hex: '#C0C0C0' },
  { name: '深灰色', code: 'DKGRAY', r: 64, g: 64, b: 64, hex: '#404040' },
  { name: '黑色', code: 'BLACK', r: 0, g: 0, b: 0, hex: '#000000' },
  { name: '灰褐色', code: 'TAUPE', r: 168, g: 144, b: 120, hex: '#A89078' },
  { name: '橄榄绿', code: 'OLIVE', r: 128, g: 128, b: 0, hex: '#808000' },
  { name: '珊瑚色', code: 'CORAL', r: 255, g: 127, b: 127, hex: '#FF7F7F' },
  { name: '桃色', code: 'PEACH', r: 255, g: 218, b: 185, hex: '#FFDAB9' },
]

/** 欧几里得距离找到最接近的拼豆颜色 */
export function findClosestBeadColor(r: number, g: number, b: number): BeadColor {
  let closest = allBeadColors[0]
  let minDist = Infinity
  for (const c of allBeadColors) {
    const dr = r - c.r, dg = g - c.g, db = b - c.b
    const dist = dr * dr + dg * dg + db * db
    if (dist < minDist) { minDist = dist; closest = c }
  }
  return closest
}

/** 将原始像素数组转换为拼豆颜色像素数组 */
export function rawPixelsToBeadPixels(raw: RawPixel[]): PixelInfo[] {
  return raw.map(p => ({
    x: p.x,
    y: p.y,
    color: findClosestBeadColor(p.r, p.g, p.b),
  }))
}

/** 从拼豆像素统计颜色用量 */
export function computeColorInfo(pixels: PixelInfo[]): { color: BeadColor; count: number }[] {
  const map = new Map<string, { color: BeadColor; count: number }>()
  for (const p of pixels) {
    const entry = map.get(p.color.code)
    if (entry) {
      entry.count++
    } else {
      map.set(p.color.code, { color: p.color, count: 1 })
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

/**
 * 合并碎片颜色：将用量少于 threshold 的颜色合并到最近的颜色
 * @param pixels  像素数组（会被原地修改）
 * @param threshold  低于此比例的碎片颜色被合并（0~1）
 */
export function mergeFragmentedColors(pixels: PixelInfo[], threshold = 0.01): void {
  const total = pixels.length
  const info = computeColorInfo(pixels)
  const rare = info.filter(c => c.count / total < threshold)

  if (rare.length === 0) return

  const rareCodes = new Set(rare.map(c => c.color.code))
  const keepColors = info.filter(c => !rareCodes.has(c.color.code)).map(c => c.color)

  // 如果没有保留色，保留最多的那个
  if (keepColors.length === 0) {
    keepColors.push(info[0].color)
  }

  for (const p of pixels) {
    if (rareCodes.has(p.color.code)) {
      // 找最近的保留色
      let nearest = keepColors[0]
      let minDist = Infinity
      for (const c of keepColors) {
        const dr = p.color.r - c.r, dg = p.color.g - c.g, db = p.color.b - c.b
        const dist = dr * dr + dg * dg + db * db
        if (dist < minDist) { minDist = dist; nearest = c }
      }
      p.color = { ...nearest }
    }
  }
}
