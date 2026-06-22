import type { RawPixel, PixelInfo } from '@/types'
import { findClosestBeadColor } from './colors'

/**
 * 从图片 Blob 生成拼豆像素数据（纯前端实现）
 * @param blob    图片数据（裁剪后的 blob 或原始文件）
 * @param maxWidth  目标拼豆宽度（≤256）
 * @returns { pixels, width, height, originalWidth, originalHeight }
 */
export async function processImage(
  blob: Blob,
  maxWidth: number = 256,
): Promise<{
  pixels: (RawPixel & { beadColor: PixelInfo['color'] })[]
  width: number
  height: number
  originalWidth: number
  originalHeight: number
}> {
  // 加载图片
  const img = await loadImage(blob)
  const origW = img.naturalWidth
  const origH = img.naturalHeight

  // 保持宽高比计算缩放尺寸
  const { w, h } = calcSize(origW, origH, maxWidth)

  // 绘制到 canvas 并提取像素
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  const pixels: (RawPixel & { beadColor: PixelInfo['color'] })[] = []

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      const r = imageData.data[idx]
      const g = imageData.data[idx + 1]
      const b = imageData.data[idx + 2]

      pixels.push({
        x, y, r, g, b,
        beadColor: findClosestBeadColor(r, g, b),
      })
    }
  }

  return {
    pixels,
    width: w,
    height: h,
    originalWidth: origW,
    originalHeight: origH,
  }
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(blob)
  })
}

function calcSize(srcW: number, srcH: number, max: number) {
  if (srcW <= max && srcH <= max) return { w: srcW, h: srcH }
  const ratio = Math.min(max / srcW, max / srcH)
  let w = Math.round(srcW * ratio)
  let h = Math.round(srcH * ratio)
  if (w < 1) w = 1
  if (h < 1) h = 1
  return { w, h }
}
