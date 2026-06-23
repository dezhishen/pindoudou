<template>
  <div class="flex flex-col min-h-screen bg-gray-100">
    <header class="bg-gradient-to-r from-primary to-green-400 text-white py-3 shadow-md">
      <div class="px-3 flex items-center justify-between">
        <h1 class="text-lg font-bold flex items-center gap-2"><span class="text-xl">🧩</span>拼豆图案生成器</h1>
        <div class="flex items-center gap-2">
          <button v-if="result" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/30 bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition" @click="showUploadModal = true">🔄 重新上传</button>
          <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/30 bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition" @click="openHistory">📋 历史</button>
        </div>
      </div>
    </header>

    <main class="flex-1 py-2 px-3 w-full">
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
        {{ error }}
        <div class="mt-3"><button class="btn btn-outline" @click="error = ''">关闭</button></div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-2 items-start relative">
        <div v-if="loading" class="absolute inset-0 z-30 flex items-center justify-center bg-white/70 rounded-2xl">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
            <p class="text-sm text-gray-500">{{ loadingText }}</p>
          </div>
        </div>
        <div class="flex flex-col gap-3 sticky top-4">
          <div class="card">
            <template v-if="imagePreviewUrl">
              <h3 class="text-sm font-medium mb-2">🖼️ 原图</h3>
              <div class="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                <img :src="imagePreviewUrl" alt="原图" class="max-w-full h-auto block" />
              </div>
            </template>
            <template v-else>
              <ImageUploader @file-selected="handleFile" />
            </template>
          </div>
          <div class="card">
            <h3 class="text-sm font-medium mb-2">🎯 颜色匹配策略</h3>
            <div class="flex flex-col gap-1">
              <label v-for="s in strategies" :key="s.id"
                class="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition text-xs"
                :class="currentId === s.id ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'"
              >
                <input type="radio" :value="s.id" :checked="currentId === s.id"
                  class="accent-primary"
                  @change="currentId === s.id || setStrategy(s.id)" />
                <div class="flex flex-col min-w-0">
                  <span class="font-medium">{{ s.name }}</span>
                  <span class="text-[10px] text-gray-400 leading-tight">{{ s.description }}</span>
                </div>
              </label>
            </div>
          </div>
          <div v-if="transparentIndices.length > 0" class="card">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium">🔲 透明填充</h3>
              <span class="text-xs text-gray-400">{{ transparentIndices.length }} 颗</span>
            </div>
            <div class="flex gap-1.5 flex-wrap">
              <button v-for="c in fillPresets" :key="c"
                class="w-8 h-8 rounded-lg border-2 transition cursor-pointer"
                :class="fillColor === c ? 'border-primary scale-110' : 'border-gray-200 hover:border-gray-400'"
                :style="{ background: c }"
                @click="changeFillColor(c)" />
              <label class="relative w-8 h-8 rounded-lg border-2 border-gray-200 overflow-hidden cursor-pointer hover:border-gray-400 flex items-center justify-center text-xs text-gray-400">
                <input type="color" class="absolute inset-0 opacity-0 cursor-pointer" :value="fillColor" @input="changeFillColor(($event.target as HTMLInputElement).value)" />
                🎨
              </label>
            </div>
          </div>
          <div v-if="result" class="card">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium">🎨 颜色用量</h3>
              <button class="text-xs text-gray-400 border border-gray-200 rounded px-2 py-0.5 hover:border-primary hover:text-primary transition" @click="drawerOpen = !drawerOpen">{{ drawerOpen ? '收起 ▲' : '全部 ▼' }}</button>
            </div>
            <div class="flex flex-wrap gap-1">
              <div v-for="c in (colorInfo || []).slice(0, drawerOpen ? undefined : 8)" :key="c.color.code" class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 cursor-pointer hover:bg-green-50 text-xs" :title="`${c.color.name}: ${c.count}颗`" @click="selectColorInGrid(c.color.code)">
                <span class="w-3 h-3 rounded-sm border border-black/10 flex-shrink-0" :style="{ background: c.color.hex }" />
                <span class="font-semibold text-primary text-xs">{{ c.count }}</span>
              </div>
            </div>
            <div v-if="drawerOpen && colorInfo" class="mt-2 flex flex-col gap-0.5 max-h-44 overflow-y-auto">
              <div v-for="c in colorInfo" :key="c.color.code" class="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 text-xs" @click="selectColorInGrid(c.color.code)">
                <span class="w-3 h-3 rounded-sm border border-black/10" :style="{ background: c.color.hex }" />
                <span class="flex-1 font-medium">{{ c.color.name }}</span>
                <span class="text-gray-400">{{ c.color.hex }}</span>
                <span class="font-semibold text-primary">{{ c.count }}颗</span>
              </div>
            </div>
          </div>
          <div v-if="result" class="card flex flex-col gap-2">
            <div class="relative flex">
              <button class="btn btn-primary flex-1 rounded-r-none justify-center" @click="downloadGrid">
                📥 下载 PNG
              </button>
              <button class="btn btn-primary rounded-l-none border-l border-white/30 px-2.5" @click="showDownloadMenu = !showDownloadMenu">
                <span class="text-[10px]">▼</span>
              </button>
              <div v-if="showDownloadMenu" class="fixed inset-0 z-40" @click="showDownloadMenu = false" />
              <div v-if="showDownloadMenu" class="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <button class="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2 transition" @click="downloadSVGGrid(); showDownloadMenu = false">
                  📐 下载 SVG 矢量图
                </button>
              </div>
            </div>
            <button class="btn btn-outline btn-block" @click="copyPaletteText">📋 复制颜色清单</button>
            <button class="btn btn-ghost btn-block" @click="resetAll">🔄 重新上传</button>
          </div>
        </div>
        <div class="min-w-0">
          <div class="bg-white rounded-2xl shadow-sm p-2">
            <BeadGrid ref="gridRef" :pixels="result?.pixels ?? []" :cols="result?.width ?? 0" :rows="result?.height ?? 0" :strategy-id="currentId" @update-info="onGridInfo" />
          </div>
        </div>
      </div>
    </main>

    <!-- 上传弹框 -->
    <Teleport to="body">
      <div v-if="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showUploadModal = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 class="text-base font-bold">📤 上传图片</h3>
            <button class="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 text-lg transition" @click="showUploadModal = false">✕</button>
          </div>
          <div class="p-4">
            <ImageUploader @file-selected="onModalUpload" />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 历史记录弹框 -->
    <Teleport to="body">
      <div v-if="showHistory" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showHistory = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
            <h3 class="text-base font-bold">📋 历史记录</h3>
            <button class="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 text-lg transition" @click="showHistory = false">✕</button>
          </div>
          <div class="p-4 overflow-y-auto flex-1">
            <div v-if="historyList.length === 0" class="text-center py-10 text-gray-400">
              <span class="text-4xl block mb-2">📭</span>
              <p class="text-sm">暂无历史记录</p>
            </div>
            <div v-else class="flex flex-col gap-2">
              <div v-for="h in historyList" :key="h.id"
                class="flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-green-50 cursor-pointer transition"
                @click="loadHistory(h.id); showHistory = false">
                <img :src="h.thumbnail" class="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-gray-50 shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium truncate">{{ h.fileName }}</p>
                  <p class="text-[10px] text-gray-400">{{ h.width }}×{{ h.height }} · {{ formatTime(h.timestamp) }}</p>
                </div>
                <span class="text-[10px] text-gray-400">{{ h.originalWidth }}×{{ h.originalHeight }}</span>
              </div>
            </div>
          </div>
          <div v-if="historyList.length > 0" class="px-4 py-2 border-t border-gray-100 shrink-0">
            <button class="text-xs text-red-400 hover:text-red-600 transition" @click="clearAllHistory">清空全部历史</button>
          </div>
        </div>
      </div>
    </Teleport>

    <footer class="text-center py-3 text-xs text-gray-400 border-t border-gray-200 bg-white">🧩 拼豆图案生成器 &copy; {{ new Date().getFullYear() }}</footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ImageUploader from '@/components/ImageUploader.vue'
import BeadGrid from '@/components/BeadGrid.vue'
import { processImage } from '@/utils/imageProcessor'
import { saveHistory, getHistoryList, getHistoryRecord, clearHistory, type HistoryMeta } from '@/utils/history'
import type { ProcessResult, RawPixel, ColorStrategyId } from '@/types'
import type { BeadColor } from '@/types'
import { useColorStrategy } from '@/composables/useColorStrategy'

const loading = ref(false)
const loadingText = ref('')
const error = ref('')
const result = ref<ProcessResult | null>(null)
const imagePreviewUrl = ref('')
const drawerOpen = ref(false)
const showDownloadMenu = ref(false)
const showUploadModal = ref(false)
const showHistory = ref(false)
const historyList = ref<HistoryMeta[]>([])
const currentFileName = ref('')

const gridRef = ref<InstanceType<typeof BeadGrid>>()
const colorInfo = ref<{ color: BeadColor; count: number }[]>([])

const { currentId, strategies, setStrategy } = useColorStrategy()

const transparentIndices = ref<number[]>([])
const fillColor = ref('#FFFFFF')
const fillPresets = ['#FFFFFF', '#EEEEEE', '#CCCCCC', '#000000', '#FF0000', '#00AAFF', '#FFD700']

async function handleFile(file: File) {
  currentFileName.value = file.name
  imagePreviewUrl.value = URL.createObjectURL(file)
  await processAndSetResult(file)
}

function onModalUpload(file: File) {
  showUploadModal.value = false
  handleFile(file)
}

async function processAndSetResult(file: File) {
  loading.value = true; loadingText.value = '正在解析图片...'; error.value = ''
  try {
    const data = await processImage(file, 256, fillColor.value, currentId.value)
    result.value = {
      width: data.width, height: data.height,
      originalWidth: data.originalWidth, originalHeight: data.originalHeight,
      pixels: data.pixels.map(p => ({ x: p.x, y: p.y, r: p.r, g: p.g, b: p.b })),
    }
    transparentIndices.value = data.transparentIndices

    // 生成缩略图并保存历史
    const thumb = await createThumbnail(file)
    if (thumb) {
      await saveHistory({
        thumbnail: thumb,
        fileName: file.name,
        originalWidth: data.originalWidth,
        originalHeight: data.originalHeight,
        width: data.width,
        height: data.height,
        pixelsJson: JSON.stringify(result.value!.pixels),
        transparentIndicesJson: JSON.stringify(data.transparentIndices),
        strategyId: currentId.value,
        fillColor: fillColor.value,
      })
    }
  } catch (err: any) { error.value = err.message || '解析图片失败' }
  finally { loading.value = false }
}

/** 创建缩略图（max 200px，JPEG 压缩） */
function createThumbnail(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxSize = 200
      let w = img.width, h = img.height
      if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize } }
      else { if (h > maxSize) { w = w * maxSize / h; h = maxSize } }
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w)
      canvas.height = Math.round(h)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

function resetAll() {
  loading.value = false; error.value = ''; result.value = null; drawerOpen.value = false
  transparentIndices.value = []
  if (imagePreviewUrl.value) { URL.revokeObjectURL(imagePreviewUrl.value); imagePreviewUrl.value = '' }
  currentFileName.value = ''
  showUploadModal.value = true
}

async function openHistory() {
  historyList.value = await getHistoryList()
  showHistory.value = true
}

async function loadHistory(id: number) {
  const record = await getHistoryRecord(id)
  if (!record) return
  loading.value = true; loadingText.value = '正在加载历史记录...'; error.value = ''
  try {
    imagePreviewUrl.value = record.thumbnail
    currentFileName.value = record.fileName
    currentId.value = record.strategyId as ColorStrategyId
    fillColor.value = record.fillColor
    result.value = {
      width: record.width,
      height: record.height,
      originalWidth: record.originalWidth,
      originalHeight: record.originalHeight,
      pixels: JSON.parse(record.pixelsJson),
    }
    transparentIndices.value = JSON.parse(record.transparentIndicesJson)
  } catch (err: any) { error.value = '加载历史记录失败: ' + err.message }
  finally { loading.value = false }
}

async function clearAllHistory() {
  await clearHistory()
  historyList.value = []
}

function formatTime(ts: number) {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function changeFillColor(color: string) {
  fillColor.value = color
  if (!result.value || !result.value.pixels.length) return
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const newPixels = [...result.value.pixels]
  transparentIndices.value.forEach(idx => {
    newPixels[idx] = { ...newPixels[idx], r, g, b }
  })
  result.value = { ...result.value, pixels: newPixels }
}
function onGridInfo(info: { colorInfo: { color: BeadColor; count: number }[] }) { colorInfo.value = info.colorInfo }
function downloadGrid() { gridRef.value?.downloadPNG() }
function downloadSVGGrid() { gridRef.value?.downloadSVG() }
function copyPaletteText() { if (colorInfo.value.length) navigator.clipboard.writeText(colorInfo.value.map(c => `${c.color.name} (${c.color.hex}): ${c.count}颗`).join('\n')) }
function selectColorInGrid(code: string) { gridRef.value?.selectByColor(code) }
</script>
