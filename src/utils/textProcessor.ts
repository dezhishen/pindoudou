import type { RawPixel } from '@/types'

export interface TextRenderOptions {
  text: string
  fontFamily: string
  fontSize: number
  /** 单字颜色映射: 字符索引 → hex 颜色 */
  charColors?: Record<number, string>
  /** 渐变色: { start, end } 对全部文字做渐变 */
  gradient?: { start: string; end: string }
  /** 默认颜色（无渐变且未指定单字颜色时使用） */
  defaultColor?: string
  /** 背景色 */
  bgColor?: string
  /** 最大宽度限制（像素），0 = 不限制 */
  maxWidth?: number
}

const DEFAULT_COLOR = '#000000'
const DEFAULT_BG = '#FFFFFF'
const RENDER_SCALE = 2 // 2倍分辨率渲染，提升清晰度

/**
 * 将文字渲染为像素数据，支持多行、自动裁剪空白边距
 */
export async function renderTextToPixels(options: TextRenderOptions): Promise<{
  pixels: RawPixel[]
  width: number
  height: number
}> {
  const {
    text,
    fontFamily,
    fontSize,
    charColors = {},
    gradient,
    defaultColor = DEFAULT_COLOR,
    bgColor = DEFAULT_BG,
    maxWidth = 0,
  } = options

  if (!text) return { pixels: [], width: 0, height: 0 }

  // 标准化换行符
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const scaledFontSize = fontSize * RENDER_SCALE

  const lines = normalizedText.split('\n')
  const lineHeight = Math.ceil(scaledFontSize * 1.25)

  // 测量每行宽度
  const measureCanvas = document.createElement('canvas')
  const measureCtx = measureCanvas.getContext('2d')!
  measureCtx.font = `${scaledFontSize}px ${fontFamily}`

  const lineWidths: number[] = lines.map(line => {
    if (!line) return scaledFontSize * 0.3
    const chars = [...line]
    let w = 0
    for (let i = 0; i < chars.length; i++) {
      w += Math.ceil(measureCtx.measureText(chars[i]).width)

    }
    return w
  })

  const contentWidth = Math.max(...lineWidths, 1)
  const totalHeight = lineHeight * lines.length
  const paddingX = scaledFontSize
  const paddingY = Math.ceil(scaledFontSize * 0.5)

  let canvasWidth = contentWidth + paddingX * 2
  if (maxWidth > 0 && canvasWidth > maxWidth * RENDER_SCALE) canvasWidth = maxWidth * RENDER_SCALE
  const canvasHeight = totalHeight + paddingY * 2

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')!

  // 背景
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 文字渲染
  ctx.font = `${scaledFontSize}px ${fontFamily}`
  ctx.textBaseline = 'top'

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    if (!line) continue

    const chars = [...line]
    const lw = lineWidths[li]
    const xStart = paddingX + Math.max(0, Math.floor((contentWidth - lw) / 2))
    const yPos = paddingY + li * lineHeight

    // 全局字符索引
    let gi = 0
    for (let pl = 0; pl < li; pl++) gi += [...lines[pl]].length

    let xOffset = xStart
    for (let ci = 0; ci < chars.length; ci++) {
      const ch = chars[ci]
      const chW = Math.ceil(measureCtx.measureText(ch).width)

      let color: string
      if (charColors[gi]) {
        color = charColors[gi]
      } else if (gradient) {
        const allChars = [...normalizedText.replace(/\n/g, '')]
        const t = allChars.length > 1 ? gi / (allChars.length - 1) : 0
        color = interpolateColor(gradient.start, gradient.end, t)
      } else {
        color = defaultColor
      }

      if (xOffset + chW <= canvasWidth) {
        ctx.fillStyle = color
        ctx.fillText(ch, xOffset, yPos)
        xOffset += chW
      }
      gi++
    }
  }

  // 提取像素
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
  const data = imageData.data

  const bgR = parseInt(bgColor.slice(1, 3), 16)
  const bgG = parseInt(bgColor.slice(3, 5), 16)
  const bgB = parseInt(bgColor.slice(5, 7), 16)
  const tolerance = 10

  // 找内容边界，加保护
  let minX = canvasWidth, minY = canvasHeight, maxX = 0, maxY = 0
  let hasContent = false

  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const idx = (y * canvasWidth + x) * 4
      const r = data[idx], g = data[idx + 1], b = data[idx + 2]
      if (Math.abs(r - bgR) > tolerance || Math.abs(g - bgG) > tolerance || Math.abs(b - bgB) > tolerance) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
        hasContent = true
      }
    }
  }

  if (!hasContent) return { pixels: [], width: 0, height: 0 }

  // 保留至少半个字号的边距
  const guard = Math.ceil(scaledFontSize * 0.15)
  minX = Math.max(0, minX - guard)
  minY = Math.max(0, minY - guard)
  maxX = Math.min(canvasWidth - 1, maxX + guard)
  maxY = Math.min(canvasHeight - 1, maxY + guard)

  // 降采样
  const srcW = maxX - minX + 1
  const srcH = maxY - minY + 1
  const dstW = Math.ceil(srcW / RENDER_SCALE)
  const dstH = Math.ceil(srcH / RENDER_SCALE)

  const pixels: RawPixel[] = []
  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0
      const sy = minY + y * RENDER_SCALE
      const sx = minX + x * RENDER_SCALE
      for (let dy = 0; dy < RENDER_SCALE; dy++) {
        for (let dx = 0; dx < RENDER_SCALE; dx++) {
          const px = sx + dx, py = sy + dy
          if (px >= 0 && px < canvasWidth && py >= 0 && py < canvasHeight) {
            const idx = (py * canvasWidth + px) * 4
            rSum += data[idx]; gSum += data[idx + 1]; bSum += data[idx + 2]
            count++
          }
        }
      }
      if (count > 0) {
        pixels.push({ x, y, r: Math.round(rSum / count), g: Math.round(gSum / count), b: Math.round(bSum / count) })
      } else {
        pixels.push({ x, y, r: bgR, g: bgG, b: bgB })
      }
    }
  }

  return { pixels, width: dstW, height: dstH }
}

function isCJK(ch: string): boolean {
  const code = ch.codePointAt(0) || 0
  return (code >= 0x4E00 && code <= 0x9FFF)  // CJK统一汉字
    || (code >= 0x3400 && code <= 0x4DBF)      // CJK扩展A
    || (code >= 0x20000 && code <= 0x2A6DF)    // CJK扩展B
    || (code >= 0xF900 && code <= 0xFAFF)      // CJK兼容
    || (code >= 0x3040 && code <= 0x309F)      // 日文平假名
    || (code >= 0x30A0 && code <= 0x30FF)      // 日文片假名
    || (code >= 0xAC00 && code <= 0xD7AF)      // 韩文
}

/** 颜色插值 */
function interpolateColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16)
  const g1 = parseInt(c1.slice(3, 5), 16)
  const b1 = parseInt(c1.slice(5, 7), 16)
  const r2 = parseInt(c2.slice(1, 3), 16)
  const g2 = parseInt(c2.slice(3, 5), 16)
  const b2 = parseInt(c2.slice(5, 7), 16)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

/** 预定义字体列表 */
export const FONT_LIST = [
  { label: '黑体', value: 'SimHei, "Microsoft YaHei", sans-serif' },
  { label: '宋体', value: 'SimSun, "STSong", serif' },
  { label: '楷体', value: 'KaiTi, "STKaiti", serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", "PingFang SC", sans-serif' },
  { label: '等宽', value: '"Courier New", "Fira Code", monospace' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times', value: '"Times New Roman", serif' },
]

/** 预定义渐变方案 */
export const GRADIENT_PRESETS = [
  { label: '彩虹', start: '#FF0000', end: '#8B00FF' },
  { label: '日落', start: '#FF4500', end: '#FFD700' },
  { label: '海洋', start: '#00BFFF', end: '#000080' },
  { label: '森林', start: '#228B22', end: '#90EE90' },
  { label: '霓虹', start: '#FF00FF', end: '#00FFFF' },
  { label: '火焰', start: '#FF0000', end: '#FFA500' },
]

/** 预定义纯色方案 */
export const SOLID_COLOR_PRESETS = [
  '#000000', '#FF0000', '#FF6B00', '#FFD700', '#228B22',
  '#0066FF', '#8B00FF', '#FF1493', '#00CED1', '#FFFFFF',
]
