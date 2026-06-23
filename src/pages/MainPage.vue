<template>
  <main class="flex-1 py-2 px-3 w-full">
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
      {{ error }}
      <div class="mt-3"><button class="btn btn-outline" @click="error = ''">{{ $t('app.close') }}</button></div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-2 items-start relative">
      <div v-if="loading" class="absolute inset-0 z-30 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 rounded-2xl">
        <div class="flex flex-col items-center gap-3">
          <div class="w-10 h-10 border-4 border-gray-200 border-t-primary dark:border-gray-600 dark:border-t-green-400 rounded-full animate-spin" />
          <p class="text-sm text-gray-500 dark:text-gray-300">{{ loadingText }}</p>
        </div>
      </div>
      <div class="flex flex-col gap-3 sticky top-4">
        <div class="card">
          <template v-if="imagePreviewUrl">
            <h3 class="text-sm font-medium mb-2">🖼️ {{ $t('sidebar.original') }}</h3>
            <div class="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
              <img :src="imagePreviewUrl" :alt="$t('sidebar.altOriginal')" class="max-w-full h-auto block" />
            </div>
          </template>
          <template v-else>
            <ImageUploader @file-selected="handleFile" />
          </template>
        </div>
        <div class="card">
          <h3 class="text-sm font-medium mb-2">🎯 {{ $t('sidebar.strategy') }}</h3>
          <div class="flex flex-col gap-1">
            <label v-for="s in strategies" :key="s.id"
              class="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition text-xs"
              :class="currentId === s.id ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border border-gray-100 dark:bg-gray-700/50 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'"
            >
              <input type="radio" :value="s.id" :checked="currentId === s.id"
                class="accent-primary"
                @change="currentId === s.id || setStrategy(s.id)" />
              <div class="flex flex-col min-w-0">
                <span class="font-medium">{{ $t('strategy.' + s.id) }}</span>
                <span class="text-[10px] text-gray-400 leading-tight">{{ $t('strategy.' + s.id + 'Desc') }}</span>
              </div>
            </label>
          </div>
        </div>
        <div v-if="transparentIndices.length > 0" class="card">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium">🔲 {{ $t('sidebar.transparent') }}</h3>
            <span class="text-xs text-gray-400">{{ $t('sidebar.transparentCount', { count: transparentIndices.length }) }}</span>
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
            <h3 class="text-sm font-medium">🎨 {{ $t('sidebar.colorUsage') }}</h3>
            <button class="text-xs text-gray-400 border border-gray-200 rounded px-2 py-0.5 hover:border-primary hover:text-primary transition dark:border-gray-600 dark:hover:border-green-400 dark:hover:text-green-400" @click="drawerOpen = !drawerOpen">{{ drawerOpen ? $t('sidebar.collapse') : $t('sidebar.expand') }}</button>
          </div>
          <div class="flex flex-wrap gap-1">
            <div v-for="c in (colorInfo || []).slice(0, drawerOpen ? undefined : 8)" :key="c.color.code" class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 cursor-pointer hover:bg-green-50 text-xs" :title="$t('app.copyFormat', { name: c.color.name, hex: c.color.hex, count: c.count })" @click="selectColorInGrid(c.color.code)">
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
              📥 {{ $t('sidebar.downloadPNG') }}
            </button>
            <button class="btn btn-primary rounded-l-none border-l border-white/30 px-2.5" @click="showDownloadMenu = !showDownloadMenu">
              <span class="text-[10px]">▼</span>
            </button>
            <div v-if="showDownloadMenu" class="fixed inset-0 z-40" @click="showDownloadMenu = false" />
            <div v-if="showDownloadMenu" class="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <button class="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2 transition" @click="downloadSVGGrid(); showDownloadMenu = false">
                📐 {{ $t('sidebar.downloadSVG') }}
              </button>
            </div>
          </div>
          <button class="btn btn-outline btn-block" @click="copyPaletteText">📋 {{ $t('sidebar.copyPalette') }}</button>
          <button class="btn btn-ghost btn-block" @click="resetAll">🔄 {{ $t('app.reupload') }}</button>
        </div>
      </div>
      <div class="min-w-0">
        <div class="bg-white rounded-2xl shadow-sm p-2 dark:bg-gray-800">
          <BeadGrid ref="gridRef" :pixels="result?.pixels ?? []" :cols="result?.width ?? 0" :rows="result?.height ?? 0" :strategy-id="currentId" @update-info="onGridInfo" />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showUploadModal = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden dark:bg-gray-800">
          <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
            <h3 class="text-base font-bold dark:text-white">📤 {{ $t('upload.title') }}</h3>
            <button class="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg transition" @click="showUploadModal = false">{{ $t('upload.close') }}</button>
          </div>
          <div class="p-4">
            <ImageUploader @file-selected="onModalUpload" />
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showHistory" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showHistory = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col overflow-hidden dark:bg-gray-800">
          <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <h3 class="text-base font-bold dark:text-white">📋 {{ $t('history.title') }}</h3>
            <div class="flex items-center gap-2">
              <button v-if="checkedIds.size > 0" class="text-[10px] px-2 py-1 rounded bg-primary text-white hover:bg-primary-dark transition" @click="exportChecked">📤 {{ $t('history.export', { count: checkedIds.size }) }}</button>
              <label class="text-[10px] px-2 py-1 rounded border border-gray-300 text-gray-500 hover:border-primary hover:text-primary transition cursor-pointer">
                📥 {{ $t('history.import') }}
                <input type="file" accept=".json" class="hidden" @change="onImportFile" />
              </label>
              <button class="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg transition" @click="showHistory = false">{{ $t('upload.close') }}</button>
            </div>
          </div>
          <div class="p-4 overflow-y-auto flex-1">
            <div v-if="historyList.length === 0" class="text-center py-10 text-gray-400">
              <span class="text-4xl block mb-2">📭</span>
              <p class="text-sm">{{ $t('history.empty') }}</p>
              <p class="text-xs mt-1">{{ $t('history.emptyHint') }}</p>
            </div>
            <div v-else class="flex flex-col gap-2">
              <div v-for="h in historyList" :key="h.id"
                class="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-primary/30 transition group dark:border-gray-700 dark:hover:border-green-400/30">
                <input type="checkbox" :checked="checkedIds.has(h.id)" class="w-3.5 h-3.5 shrink-0 accent-primary"
                  @click.stop @change="toggleCheck(h.id)" />
                <img :src="h.thumbnail" class="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-gray-50 shrink-0 cursor-pointer" @click="loadHistory(h.id); showHistory = false" />
                <div class="flex-1 min-w-0 cursor-pointer" @click="loadHistory(h.id); showHistory = false">
                  <p class="text-xs font-medium truncate">{{ h.fileName }}</p>
                  <p class="text-[10px] text-gray-400">{{ h.width }}×{{ h.height }} · {{ formatTime(h.timestamp) }}</p>
                </div>
                <span class="text-[10px] text-gray-400 shrink-0">{{ h.originalWidth }}×{{ h.originalHeight }}</span>
                <button class="text-sm shrink-0 transition opacity-40 group-hover:opacity-100"
                  :class="h.favorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'"
                  :title="h.favorite ? $t('history.unfav') : $t('history.fav')"
                  @click.stop="toggleFav(h.id)">{{ h.favorite ? '⭐' : '☆' }}</button>
              </div>
            </div>
          </div>
          <div v-if="historyList.length > 0" class="px-4 py-2 border-t border-gray-100 dark:border-gray-700 shrink-0 flex items-center justify-between">
            <button class="text-xs text-red-400 hover:text-red-600 transition" @click="clearAllHistory">{{ $t('history.clear') }}</button>
            <span v-if="historyFavCount > 0" class="text-[10px] text-yellow-500">⭐ {{ $t('history.favCount', { count: historyFavCount }) }}</span>
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ImageUploader from '@/components/ImageUploader.vue'
import BeadGrid from '@/components/BeadGrid.vue'
import { processImage } from '@/utils/imageProcessor'
import { saveHistory, getHistoryList, getHistoryRecord, clearHistory, toggleFavorite, exportRecords, importRecords, type HistoryMeta } from '@/utils/history'
import { showToast, showConfirm } from '@/composables/useNotify'
import { $t } from '@/i18n'
import type { ProcessResult, ColorStrategyId } from '@/types'
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
const checkedIds = ref<Set<number>>(new Set())
const historyFavCount = ref(0)
let currentFileName = ''

function toggleCheck(id: number) {
  const s = new Set(checkedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  checkedIds.value = s
}

const gridRef = ref<InstanceType<typeof BeadGrid>>()
const colorInfo = ref<{ color: BeadColor; count: number }[]>([])
const { currentId, strategies, setStrategy } = useColorStrategy()
const transparentIndices = ref<number[]>([])
const fillColor = ref('#FFFFFF')
const fillPresets = ['#FFFFFF', '#EEEEEE', '#CCCCCC', '#000000', '#FF0000', '#00AAFF', '#FFD700']

async function handleFile(file: File) {
  currentFileName = file.name
  imagePreviewUrl.value = URL.createObjectURL(file)
  await processAndSetResult(file)
}

function onModalUpload(file: File) {
  showUploadModal.value = false
  handleFile(file)
}

async function processAndSetResult(file: File) {
  loading.value = true; loadingText.value = $t('app.loading'); error.value = ''
  try {
    const data = await processImage(file, 256, fillColor.value, currentId.value)
    result.value = {
      width: data.width, height: data.height,
      originalWidth: data.originalWidth, originalHeight: data.originalHeight,
      pixels: data.pixels.map(p => ({ x: p.x, y: p.y, r: p.r, g: p.g, b: p.b })),
    }
    transparentIndices.value = data.transparentIndices
    const thumb = await createThumbnail(file)
    if (thumb) {
      await saveHistory({
        thumbnail: thumb, fileName: file.name,
        originalWidth: data.originalWidth, originalHeight: data.originalHeight,
        width: data.width, height: data.height,
        pixelsJson: JSON.stringify(result.value!.pixels),
        transparentIndicesJson: JSON.stringify(data.transparentIndices),
        strategyId: currentId.value, fillColor: fillColor.value,
      })
    }
  } catch (err: any) { error.value = (err.message || $t('app.unknownError')) }
  finally { loading.value = false }
}

function createThumbnail(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxSize = 200
      let w = img.width, h = img.height
      if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize } }
      else { if (h > maxSize) { w = w * maxSize / h; h = maxSize } }
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w); canvas.height = Math.round(h)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
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
  currentFileName = ''
  showUploadModal.value = true
}

async function openHistory() {
  historyList.value = await getHistoryList()
  historyFavCount.value = historyList.value.filter(h => h.favorite).length
  checkedIds.value = new Set()
  showHistory.value = true
}

async function toggleFav(id: number) {
  const fav = await toggleFavorite(id)
  const item = historyList.value.find(h => h.id === id)
  if (item) item.favorite = fav
  historyFavCount.value = historyList.value.filter(h => h.favorite).length
}

async function exportChecked() {
  if (checkedIds.value.size === 0) return
  await exportRecords([...checkedIds.value])
}

async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const count = await importRecords(file)
    showToast($t('app.importSuccess', { count }), 'success')
    await openHistory()
  } catch (err: any) {
    showToast($t('app.importError') + (err.message || $t('app.unknownError')), 'error')
  }
  input.value = ''
}

async function loadHistory(id: number) {
  const record = await getHistoryRecord(id)
  if (!record) return
  loading.value = true; loadingText.value = $t('app.loadingHistory'); error.value = ''
  try {
    imagePreviewUrl.value = record.thumbnail
    currentFileName = record.fileName
    currentId.value = record.strategyId as ColorStrategyId
    fillColor.value = record.fillColor
    result.value = {
      width: record.width, height: record.height,
      originalWidth: record.originalWidth, originalHeight: record.originalHeight,
      pixels: JSON.parse(record.pixelsJson),
    }
    transparentIndices.value = JSON.parse(record.transparentIndicesJson)
  } catch (err: any) { error.value = $t('app.loadHistoryError') + err.message }
  finally { loading.value = false }
}

async function clearAllHistory() {
  const favCount = historyList.value.filter(h => h.favorite).length
  let msg = $t('app.clearConfirm')
  if (favCount > 0) msg += '\n\n' + $t('app.clearFavWarning', { count: favCount })
  const ok = await showConfirm({ text: msg, type: 'danger' })
  if (!ok) return
  const result = await clearHistory()
  showToast(favCount > 0 ? $t('app.clearResult', { deleted: result.deleted, kept: result.kept }) : $t('app.clearResultNoFav', { deleted: result.deleted }), 'success')
  await openHistory()
}

function formatTime(ts: number) {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function changeFillColor(color: string) {
  fillColor.value = color
  if (!result.value || !result.value.pixels.length) return
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const newPixels = [...result.value.pixels]
  transparentIndices.value.forEach(idx => { newPixels[idx] = { ...newPixels[idx], r, g, b } })
  result.value = { ...result.value, pixels: newPixels }
}

function onGridInfo(info: { colorInfo: { color: BeadColor; count: number }[] }) { colorInfo.value = info.colorInfo }
function downloadGrid() { gridRef.value?.downloadPNG() }
function downloadSVGGrid() { gridRef.value?.downloadSVG() }
function copyPaletteText() {
  if (colorInfo.value.length) navigator.clipboard.writeText(colorInfo.value.map(c => $t('app.copyFormat', { name: $t('color.' + c.color.code) || c.color.name, hex: c.color.hex, count: c.count })).join('\n'))
}
function selectColorInGrid(code: string) { gridRef.value?.selectByColor(code) }
</script>
