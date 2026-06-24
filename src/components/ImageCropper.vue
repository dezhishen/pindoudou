<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="$emit('cancel')">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh] overflow-hidden">
      <!-- 头部 -->
      <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <h3 class="text-base font-bold dark:text-white">✂️ {{ $t('crop.title') }}</h3>
        <button
          class="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg transition"
          @click="$emit('cancel')"
        >✕</button>
      </div>

      <!-- 裁剪区域 -->
      <div
        ref="containerRef"
        class="relative flex items-center justify-center bg-gray-200 dark:bg-gray-700 overflow-hidden select-none"
        :style="{ height: containerHeight + 'px' }"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend="onTouchEnd"
      >
        <canvas ref="canvasRef" />
      </div>

      <!-- 底部操作栏 -->
      <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700 shrink-0 gap-3">
        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{{ $t('crop.size') }}: {{ cropDisplayW }} × {{ cropDisplayH }}</span>
          <button
            class="px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-green-400 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-green-400 transition text-[11px]"
            @click="resetCrop"
          >{{ $t('crop.reset') }}</button>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-outline text-sm" @click="$emit('cancel')">{{ $t('crop.cancel') }}</button>
          <button class="btn btn-primary text-sm" @click="confirmCrop">{{ $t('crop.confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { $t } from '@/i18n'

const props = defineProps<{
  src: string
}>()

const emit = defineEmits<{
  (e: 'confirm', blob: Blob): void
  (e: 'cancel'): void
}>()

const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
const containerHeight = ref(450)

// 图片原始尺寸
let imgNaturalW = 0
let imgNaturalH = 0

// 图片在 canvas 上的绘制区域
let imgX = 0, imgY = 0, imgW = 0, imgH = 0

// 裁剪区域（canvas 坐标系）
let cropX = 0, cropY = 0, cropW = 0, cropH = 0

// 裁剪区域展示尺寸
const cropDisplayW = ref(0)
const cropDisplayH = ref(0)

// 交互状态
type DragMode = 'none' | 'new' | 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'resize-n' | 'resize-s' | 'resize-w' | 'resize-e'
let dragMode: DragMode = 'none'
let dragStartX = 0, dragStartY = 0
let dragStartCropX = 0, dragStartCropY = 0, dragStartCropW = 0, dragStartCropH = 0

const HANDLE_SIZE = 10
const MIN_CROP = 20

let imageLoaded = false
let rafId = 0

onMounted(async () => {
  await nextTick()
  loadAndDraw()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  cancelAnimationFrame(rafId)
})

watch(() => props.src, () => {
  imageLoaded = false
  loadAndDraw()
})

function onResize() {
  if (imageLoaded) draw()
}

function loadAndDraw() {
  const img = new Image()
  img.onload = () => {
    imgNaturalW = img.naturalWidth
    imgNaturalH = img.naturalHeight
    imageLoaded = true
    calcLayout()
    resetCrop()
    draw()
  }
  img.src = props.src
}

function calcLayout() {
  const container = containerRef.value
  if (!container) return
  const cw = container.clientWidth
  const ch = container.clientHeight

  const padding = 40
  const availW = cw - padding * 2
  const availH = ch - padding * 2

  const scale = Math.min(availW / imgNaturalW, availH / imgNaturalH, 1)
  imgW = Math.round(imgNaturalW * scale)
  imgH = Math.round(imgNaturalH * scale)
  imgX = Math.round((cw - imgW) / 2)
  imgY = Math.round((ch - imgH) / 2)
}

function resetCrop() {
  cropX = imgX + Math.round(imgW * 0.1)
  cropY = imgY + Math.round(imgH * 0.1)
  cropW = Math.round(imgW * 0.8)
  cropH = Math.round(imgH * 0.8)
  cropDisplayW.value = Math.round(cropW / imgW * imgNaturalW)
  cropDisplayH.value = Math.round(cropH / imgH * imgNaturalH)
  draw()
}

function draw() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const cw = container.clientWidth
  const ch = container.clientHeight
  const dpr = window.devicePixelRatio || 1

  canvas.width = cw * dpr
  canvas.height = ch * dpr
  canvas.style.width = cw + 'px'
  canvas.style.height = ch + 'px'

  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // 清空
  ctx.clearRect(0, 0, cw, ch)

  if (!imageLoaded) return

  // 绘制图片
  const img = new Image()
  img.src = props.src
  if (!img.complete) {
    // 图片还没加载完，等待
    img.onload = () => {
      ctx.drawImage(img, imgX, imgY, imgW, imgH)
      drawOverlay(ctx, cw, ch)
    }
    return
  }
  ctx.drawImage(img, imgX, imgY, imgW, imgH)

  drawOverlay(ctx, cw, ch)
}

function drawOverlay(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  // 半透明遮罩：用四条矩形覆盖 crop 外的区域
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  // 上
  ctx.fillRect(0, 0, cw, cropY)
  // 下
  ctx.fillRect(0, cropY + cropH, cw, ch - (cropY + cropH))
  // 左（中部）
  ctx.fillRect(0, cropY, cropX, cropH)
  // 右（中部）
  ctx.fillRect(cropX + cropW, cropY, cw - (cropX + cropW), cropH)

  // 裁剪框边框
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 3])
  ctx.strokeRect(cropX, cropY, cropW, cropH)
  ctx.setLineDash([])

  // 网格线（三分线）
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  for (let i = 1; i < 3; i++) {
    const gx = cropX + (cropW / 3) * i
    ctx.beginPath()
    ctx.moveTo(gx, cropY)
    ctx.lineTo(gx, cropY + cropH)
    ctx.stroke()
    const gy = cropY + (cropH / 3) * i
    ctx.beginPath()
    ctx.moveTo(cropX, gy)
    ctx.lineTo(cropX + cropW, gy)
    ctx.stroke()
  }
  ctx.setLineDash([])

  // 四角手柄
  const handles = [
    { x: cropX, y: cropY },           // NW
    { x: cropX + cropW, y: cropY },   // NE
    { x: cropX, y: cropY + cropH },   // SW
    { x: cropX + cropW, y: cropY + cropH }, // SE
  ]
  for (const h of handles) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.strokeRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
  }

  // 四边中点手柄
  const midHandles = [
    { x: cropX + cropW / 2, y: cropY },           // N
    { x: cropX + cropW / 2, y: cropY + cropH },   // S
    { x: cropX, y: cropY + cropH / 2 },            // W
    { x: cropX + cropW, y: cropY + cropH / 2 },   // E
  ]
  for (const h of midHandles) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.strokeRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
  }
}

// ---- 鼠标事件 ----

function getEventPos(e: MouseEvent | Touch): { x: number; y: number } {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function getDragMode(x: number, y: number): DragMode {
  const margin = HANDLE_SIZE + 4
  // 角落
  if (Math.abs(x - cropX) <= margin && Math.abs(y - cropY) <= margin) return 'resize-nw'
  if (Math.abs(x - (cropX + cropW)) <= margin && Math.abs(y - cropY) <= margin) return 'resize-ne'
  if (Math.abs(x - cropX) <= margin && Math.abs(y - (cropY + cropH)) <= margin) return 'resize-sw'
  if (Math.abs(x - (cropX + cropW)) <= margin && Math.abs(y - (cropY + cropH)) <= margin) return 'resize-se'
  // 边
  if (Math.abs(x - (cropX + cropW / 2)) <= margin && Math.abs(y - cropY) <= margin) return 'resize-n'
  if (Math.abs(x - (cropX + cropW / 2)) <= margin && Math.abs(y - (cropY + cropH)) <= margin) return 'resize-s'
  if (Math.abs(x - cropX) <= margin && Math.abs(y - (cropY + cropH / 2)) <= margin) return 'resize-w'
  if (Math.abs(x - (cropX + cropW)) <= margin && Math.abs(y - (cropY + cropH / 2)) <= margin) return 'resize-e'
  // 内部
  if (x > cropX && x < cropX + cropW && y > cropY && y < cropY + cropH) return 'move'
  // 外部
  if (x >= imgX && x <= imgX + imgW && y >= imgY && y <= imgY + imgH) return 'new'
  return 'none'
}

function onMouseDown(e: MouseEvent) {
  if (!imageLoaded) return
  const pos = getEventPos(e)
  dragMode = getDragMode(pos.x, pos.y)
  dragStartX = pos.x
  dragStartY = pos.y
  dragStartCropX = cropX
  dragStartCropY = cropY
  dragStartCropW = cropW
  dragStartCropH = cropH
}

function onMouseMove(e: MouseEvent) {
  if (!imageLoaded) return
  const pos = getEventPos(e)

  // 更新鼠标样式
  const canvas = canvasRef.value
  if (canvas && dragMode === 'none') {
    const mode = getDragMode(pos.x, pos.y)
    const cursors: Record<string, string> = {
      'resize-nw': 'nw-resize', 'resize-se': 'se-resize',
      'resize-ne': 'ne-resize', 'resize-sw': 'sw-resize',
      'resize-n': 'n-resize', 'resize-s': 's-resize',
      'resize-w': 'w-resize', 'resize-e': 'e-resize',
      'move': 'move', 'new': 'crosshair', 'none': 'default',
    }
    canvas.style.cursor = cursors[mode] || 'default'
  }

  if (dragMode === 'none') return

  const dx = pos.x - dragStartX
  const dy = pos.y - dragStartY

  updateCropFromDrag(dx, dy)
  clampCrop()
  updateDisplaySize()
  draw()
}

function onMouseUp(_e: MouseEvent) {
  dragMode = 'none'
}

function updateCropFromDrag(dx: number, dy: number) {
  switch (dragMode) {
    case 'new': {
      cropX = Math.min(dragStartX, dragStartX + dx)
      cropY = Math.min(dragStartY, dragStartY + dy)
      cropW = Math.abs(dx)
      cropH = Math.abs(dy)
      break
    }
    case 'move': {
      cropX = dragStartCropX + dx
      cropY = dragStartCropY + dy
      break
    }
    case 'resize-nw':
      cropX = dragStartCropX + dx
      cropY = dragStartCropY + dy
      cropW = dragStartCropW - dx
      cropH = dragStartCropH - dy
      break
    case 'resize-ne':
      cropY = dragStartCropY + dy
      cropW = dragStartCropW + dx
      cropH = dragStartCropH - dy
      break
    case 'resize-sw':
      cropX = dragStartCropX + dx
      cropW = dragStartCropW - dx
      cropH = dragStartCropH + dy
      break
    case 'resize-se':
      cropW = dragStartCropW + dx
      cropH = dragStartCropH + dy
      break
    case 'resize-n':
      cropY = dragStartCropY + dy
      cropH = dragStartCropH - dy
      break
    case 'resize-s':
      cropH = dragStartCropH + dy
      break
    case 'resize-w':
      cropX = dragStartCropX + dx
      cropW = dragStartCropW - dx
      break
    case 'resize-e':
      cropW = dragStartCropW + dx
      break
  }
}

function clampCrop() {
  // 确保最小尺寸
  if (cropW < MIN_CROP) {
    if (dragMode.includes('w') || dragMode === 'resize-w') cropX = cropX + cropW - MIN_CROP
    cropW = MIN_CROP
  }
  if (cropH < MIN_CROP) {
    if (dragMode.includes('n') || dragMode === 'resize-n') cropY = cropY + cropH - MIN_CROP
    cropH = MIN_CROP
  }

  // 约束在图片范围内
  if (cropX < imgX) cropX = imgX
  if (cropY < imgY) cropY = imgY
  if (cropX + cropW > imgX + imgW) cropW = imgX + imgW - cropX
  if (cropY + cropH > imgY + imgH) cropH = imgY + imgH - cropY
}

function updateDisplaySize() {
  cropDisplayW.value = Math.round(cropW / imgW * imgNaturalW)
  cropDisplayH.value = Math.round(cropH / imgH * imgNaturalH)
}

// ---- 触摸事件 ----

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    const pos = getEventPos(e.touches[0])
    dragMode = getDragMode(pos.x, pos.y)
    dragStartX = pos.x
    dragStartY = pos.y
    dragStartCropX = cropX
    dragStartCropY = cropY
    dragStartCropW = cropW
    dragStartCropH = cropH
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 1 && dragMode !== 'none') {
    const pos = getEventPos(e.touches[0])
    const dx = pos.x - dragStartX
    const dy = pos.y - dragStartY
    updateCropFromDrag(dx, dy)
    clampCrop()
    updateDisplaySize()
    draw()
  }
}

function onTouchEnd() {
  dragMode = 'none'
}

// ---- 确认裁剪 ----

function confirmCrop() {
  if (!imageLoaded) return

  // 计算原始图片上的裁剪坐标
  const scaleX = imgNaturalW / imgW
  const scaleY = imgNaturalH / imgH

  const srcX = Math.round((cropX - imgX) * scaleX)
  const srcY = Math.round((cropY - imgY) * scaleY)
  const srcW = Math.round(cropW * scaleX)
  const srcH = Math.round(cropH * scaleY)

  // 创建离屏 canvas 进行裁剪
  const offCanvas = document.createElement('canvas')
  offCanvas.width = srcW
  offCanvas.height = srcH
  const offCtx = offCanvas.getContext('2d')!

  const img = new Image()
  img.onload = () => {
    offCtx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)
    offCanvas.toBlob((blob) => {
      if (blob) emit('confirm', blob)
    }, 'image/png')
  }
  img.src = props.src
}
</script>
