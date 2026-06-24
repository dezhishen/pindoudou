import type { DisplayBead } from './useBeadGrid'

export interface CyberPreviewOptions {
  /** 单元格像素尺寸 */
  cellSize: number
  /** 网格列数 */
  cols: number
  /** 网格行数 */
  rows: number
  /** 霓虹发光强度 (0-50) */
  glowIntensity?: number
  /** 扫描线不透明度 (0-1) */
  scanlineOpacity?: number
  /** 暗角强度 (0-1) */
  vignetteStrength?: number
  /** 豆子圆角程度 (0-1): 0=方形, 0.2=微圆, 1=圆形 */
  beadRoundness?: number
}

const DEFAULT_OPTIONS: Required<Omit<CyberPreviewOptions, 'cellSize' | 'cols' | 'rows'>> = {
  glowIntensity: 10,
  scanlineOpacity: 0.05,
  vignetteStrength: 0.45,
  beadRoundness: 0.2,
}

/** 确定性伪随机 (基于坐标) */
function seededRandom(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635
  h = ((h >> 13) ^ h) * 1274126177
  return ((h >> 17) ^ h) / 2147483648 + 0.5
}

/**
 * 绘制圆角方形路径（模拟烫后融合的豆子形状）
 * roundness: 0=纯方形, 1=最大限度圆角
 */
function roundedSquarePath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number, roundness: number,
) {
  const r = size * 0.48 * roundness  // 最大圆角为边长一半（此时接近圆）
  if (r <= 0.5) {
    ctx.rect(x, y, size, size)
    return
  }
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + size - r, y)
  ctx.arcTo(x + size, y, x + size, y + r, r)
  ctx.lineTo(x + size, y + size - r)
  ctx.arcTo(x + size, y + size, x + size - r, y + size, r)
  ctx.lineTo(x + r, y + size)
  ctx.arcTo(x, y + size, x, y + r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

/**
 * 赛博朋克风格拼豆预览渲染器
 * 模拟烫画机烫平后的真实效果：豆子紧密融合
 */
export function renderCyberPreview(
  beads: DisplayBead[],
  canvas: HTMLCanvasElement,
  options: CyberPreviewOptions,
) {
  const { cellSize, cols, rows, glowIntensity, scanlineOpacity, vignetteStrength, beadRoundness } = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  // 豆子尺寸略大于单元格，紧密融合无间隙
  const beadSize = cellSize * 1.06
  const beadOffset = (cellSize - beadSize) / 2  // 居中偏移（负值=豆子超出格子）
  const width = cols * cellSize
  const height = rows * cellSize

  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'

  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // ---- 1. 深色背景 ----
  ctx.fillStyle = '#0a0a0f'
  ctx.fillRect(0, 0, width, height)

  // ---- 2. 赛博网格线 ----
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.06)'
  ctx.lineWidth = 0.5
  for (let x = 0; x <= cols; x++) {
    ctx.beginPath(); ctx.moveTo(x * cellSize, 0); ctx.lineTo(x * cellSize, height); ctx.stroke()
  }
  for (let y = 0; y <= rows; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * cellSize); ctx.lineTo(width, y * cellSize); ctx.stroke()
  }

  // ---- 3. 查找表 ----
  const beadMap = new Map<string, DisplayBead>()
  for (const b of beads) {
    beadMap.set(`${b.displayX},${b.displayY}`, b)
  }

  // ---- 4. 霓虹发光底层 ----
  ctx.shadowBlur = glowIntensity
  for (const b of beads) {
    const bx = b.displayX * cellSize + beadOffset
    const by = b.displayY * cellSize + beadOffset
    ctx.shadowColor = b.color.hex
    ctx.fillStyle = b.color.hex
    ctx.beginPath()
    roundedSquarePath(ctx, bx, by, beadSize, beadRoundness)
    ctx.fill()
  }

  // ---- 5. 豆子主体 ----
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0

  const innerSize = beadSize - 1
  const innerOffset = beadOffset + 0.5

  for (const b of beads) {
    const bx = b.displayX * cellSize + innerOffset
    const by = b.displayY * cellSize + innerOffset

    // 主体颜色
    ctx.fillStyle = b.color.hex
    ctx.beginPath()
    roundedSquarePath(ctx, bx, by, innerSize, beadRoundness)
    ctx.fill()
  }

  // ---- 6. 融合缝线（不同颜色相邻处） ----
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 0.6
  for (const b of beads) {
    const bx = b.displayX * cellSize
    const by = b.displayY * cellSize

    const right = beadMap.get(`${b.displayX + 1},${b.displayY}`)
    if (right && right.color.code !== b.color.code) {
      ctx.beginPath()
      ctx.moveTo(bx + cellSize, by + 2)
      ctx.lineTo(bx + cellSize, by + cellSize - 2)
      ctx.stroke()
    }
    const below = beadMap.get(`${b.displayX},${b.displayY + 1}`)
    if (below && below.color.code !== b.color.code) {
      ctx.beginPath()
      ctx.moveTo(bx + 2, by + cellSize)
      ctx.lineTo(bx + cellSize - 2, by + cellSize)
      ctx.stroke()
    }
  }

  // ---- 7. 表面轻微纹理 ----
  ctx.fillStyle = 'rgba(255,255,255,0.015)'
  for (let i = 0; i < Math.floor(cols * rows * 0.6); i++) {
    const tx = seededRandom(i, 100) * width
    const ty = seededRandom(i, 101) * height
    const tr = seededRandom(i, 102) * cellSize * 0.1
    ctx.beginPath(); ctx.arc(tx, ty, tr, 0, Math.PI * 2); ctx.fill()
  }

  // ---- 8. 扫描线 ----
  if (scanlineOpacity > 0) {
    ctx.fillStyle = `rgba(0,0,0,${scanlineOpacity})`
    for (let y = 0; y < height; y += 3) {
      ctx.fillRect(0, y, width, 1)
    }
  }

  // ---- 9. 暗角 ----
  if (vignetteStrength > 0) {
    const cx = width / 2; const cy = height / 2
    const maxDist = Math.sqrt(cx * cx + cy * cy)
    const vigGrad = ctx.createRadialGradient(cx, cy, maxDist * 0.35, cx, cy, maxDist)
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)')
    vigGrad.addColorStop(0.55, 'rgba(0,0,0,0)')
    vigGrad.addColorStop(1, `rgba(0,0,0,${vignetteStrength})`)
    ctx.fillStyle = vigGrad
    ctx.fillRect(0, 0, width, height)
  }

  // ---- 10. CRT 噪点 ----
  ctx.fillStyle = 'rgba(255,255,255,0.006)'
  for (let i = 0; i < Math.floor(width * height * 0.0002); i++) {
    ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1)
  }
}

/**
 * 将赛博预览画布导出为 PNG 并下载
 */
export function downloadCyberPNG(canvas: HTMLCanvasElement) {
  const link = document.createElement('a')
  link.download = `pindoudou-cyber-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
