import type { RawPixel, PixelInfo } from '@/types'

/**
 * 从图片 Blob 生成拼豆像素数据（纯前端实现）
 * @param blob    图片数据（裁剪后的 blob 或原始文件）
 * @param maxWidth  目标拼豆宽度（≤256）
 * @param bgColor   透明区域填充色（默认白色）
 */
export async function processImage(
  blob: Blob,
  maxWidth: number = 256,
  bgColor: string = '#FFFFFF',
): Promise<{
  pixels: (RawPixel & { beadColor: PixelInfo['color'] })[]
  /** 哪些索引在原始图片中是透明的 */
  transparentIndices: number[]
  width: number
  height: number
  originalWidth: number
  originalHeight: number
}> {
  const img = await loadImage(blob)
  const origW = img.naturalWidth
  const origH = img.naturalHeight
  const { w, h } = calcSize(origW, origH, maxWidth)

  // ---- 第 1 遍：检测透明像素 ----
  const alphaCanvas = document.createElement('canvas')
  alphaCanvas.width = w; alphaCanvas.height = h
  const alphaCtx = alphaCanvas.getContext('2d')!
  alphaCtx.drawImage(img, 0, 0, w, h)
  const alphaData = alphaCtx.getImageData(0, 0, w, h)
  const transparentIndices: number[] = []
  for (let i = 0; i < w * h; i++) {
    if (alphaData.data[i * 4 + 3] < 128) {
      transparentIndices.push(i)
    }
  }

  // ---- 第 2 遍：填充背景色后提取最终像素 ----
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  const pixels: (RawPixel & { beadColor: PixelInfo['color'] })[] = []

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      pixels.push({
        x, y,
        r: imageData.data[idx],
        g: imageData.data[idx + 1],
        b: imageData.data[idx + 2],
        beadColor: findClosestBeadColor(imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2]),
      })
    }
  }

  return {
    pixels,
    transparentIndices,
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
