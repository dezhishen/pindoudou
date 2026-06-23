<template>
  <div class="flex flex-col min-h-screen bg-gray-100">
    <header class="bg-gradient-to-r from-primary to-green-400 text-white py-3 shadow-md">
      <div class="px-3 flex items-center justify-between">
        <h1 class="text-lg font-bold flex items-center gap-2"><span class="text-xl">🧩</span>拼豆图案生成器</h1>
        <button v-if="step === 'result'" class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-white/30 bg-white/15 text-white text-sm font-medium hover:bg-white/25 transition" @click="resetAll">🔄 重新上传</button>
      </div>
    </header>

    <main class="flex-1 py-2 px-3 w-full">
      <div v-if="step === 'upload'">
        <ImageUploader @file-selected="handleFile" />
      </div>

      <div v-if="loading" class="text-center py-10">
        <div class="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p class="text-gray-500">{{ loadingText }}</p>
      </div>

      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
        {{ error }}
        <div class="mt-3"><button class="btn btn-outline" @click="resetAll">重新上传</button></div>
      </div>

      <div v-if="step === 'result' && result" class="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-2 items-start">
        <div class="flex flex-col gap-3 sticky top-4">
          <div class="card" v-if="imagePreviewUrl">
            <h3 class="text-sm font-medium mb-2">🖼️ 原图</h3>
            <div class="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
              <img :src="imagePreviewUrl" alt="原图" class="max-w-full h-auto block" />
            </div>
          </div>
          <!-- 颜色匹配策略 -->
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
          <!-- 透明填充 -->
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
          <div class="card">
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
          <div class="card flex flex-col gap-2">
            <!-- 屏幕参数设置（实图展示） -->
            <h3 class="text-sm font-medium">📏 实图展示</h3>
            <p class="text-[10px] text-gray-400 -mt-1">输入屏幕参数，以实际物理尺寸查看拼豆</p>
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 whitespace-nowrap">屏幕</label>
              <input
                v-model.number="screenDiagonal"
                type="number"
                step="0.1"
                min="1"
                max="100"
                placeholder="如 24"
                class="w-14 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <span class="text-xs text-gray-400">英寸</span>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 whitespace-nowrap">分辨率</label>
              <input
                v-model.number="screenResW"
                type="number"
                step="1"
                min="1"
                placeholder="1920"
                class="w-14 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <span class="text-xs text-gray-400">×</span>
              <input
                v-model.number="screenResH"
                type="number"
                step="1"
                min="1"
                placeholder="1080"
                class="w-14 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <p v-if="screenPPI" class="text-[10px] text-gray-400">估算 PPI: {{ screenPPI }}</p>
            <p v-if="!screenPPI && (screenDiagonal || screenResW || screenResH)" class="text-[10px] text-orange-400">请填写完整的屏幕参数</p>
            <div class="flex gap-1 flex-wrap">
              <button
                v-for="preset in screenPresets" :key="preset.label"
                class="px-2 py-1 text-[10px] rounded-md border transition cursor-pointer"
                :class="screenDiagonal === preset.d && screenResW === preset.w && screenResH === preset.h ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'"
                @click="applyScreenPreset(preset)"
              >{{ preset.label }}</button>
            </div>
          </div>
          <div class="card flex flex-col gap-2">
            <!-- 下载按钮：默认PNG，下拉可选SVG -->
            <div class="relative flex">
              <button class="btn btn-primary flex-1 rounded-r-none justify-center" @click="downloadGrid">
                📥 下载 PNG
              </button>
              <button class="btn btn-primary rounded-l-none border-l border-white/30 px-2.5" @click="showDownloadMenu = !showDownloadMenu">
                <span class="text-[10px]">▼</span>
              </button>
              <!-- 点击外部遮罩 -->
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
            <BeadGrid ref="gridRef" :pixels="result.pixels" :cols="result.width" :rows="result.height" :strategy-id="currentId" :screen-diagonal="screenDiagonal ?? undefined" :screen-res-w="screenResW ?? undefined" :screen-res-h="screenResH ?? undefined" @update-info="onGridInfo" />
          </div>
        </div>
      </div>
    </main>

    <footer class="text-center py-3 text-xs text-gray-400 border-t border-gray-200 bg-white">🧩 拼豆图案生成器 &copy; {{ new Date().getFullYear() }}</footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ImageUploader from '@/components/ImageUploader.vue'
import BeadGrid from '@/components/BeadGrid.vue'
import { processImage } from '@/utils/imageProcessor'
import type { ProcessResult, RawPixel, ColorStrategyId } from '@/types'
import type { BeadColor } from '@/types'
import { useColorStrategy } from '@/composables/useColorStrategy'

type Step = 'upload' | 'result'
const step = ref<Step>('upload')
const loading = ref(false)
const loadingText = ref('')
const error = ref('')
const result = ref<ProcessResult | null>(null)
const imagePreviewUrl = ref('')
const drawerOpen = ref(false)
const showDownloadMenu = ref(false)

// 实图展示 - 屏幕参数
const screenDiagonal = ref<number | null>(null)
const screenResW = ref<number | null>(null)
const screenResH = ref<number | null>(null)

const screenPresets = [
  { label: '💻 14" FHD', d: 14, w: 1920, h: 1080 },
  { label: '🖥️ 24" FHD', d: 24, w: 1920, h: 1080 },
  { label: '🖥️ 27" 2K', d: 27, w: 2560, h: 1440 },
  { label: '🖥️ 27" 4K', d: 27, w: 3840, h: 2160 },
  { label: '📱 6.7"', d: 6.7, w: 2796, h: 1290 },
]

function applyScreenPreset(p: typeof screenPresets[number]) {
  screenDiagonal.value = p.d
  screenResW.value = p.w
  screenResH.value = p.h
}

const screenPPI = computed(() => {
  const d = screenDiagonal.value
  const w = screenResW.value
  const h = screenResH.value
  if (!d || !w || !h || d <= 0 || w <= 0 || h <= 0) return null
  return Math.round(Math.sqrt(w * w + h * h) / d)
})

const gridRef = ref<InstanceType<typeof BeadGrid>>()
const colorInfo = ref<{ color: BeadColor; count: number }[]>([])

// 颜色匹配策略
const { currentId, strategies, setStrategy } = useColorStrategy()

// 透明填充
const transparentIndices = ref<number[]>([])
const fillColor = ref('#FFFFFF')
const fillPresets = ['#FFFFFF', '#EEEEEE', '#CCCCCC', '#000000', '#FF0000', '#00AAFF', '#FFD700']

async function handleFile(file: File) {
  imagePreviewUrl.value = URL.createObjectURL(file)
  loading.value = true; loadingText.value = '正在解析图片...'; error.value = ''
  try {
    const data = await processImage(file, 256, fillColor.value, currentId.value)
    result.value = {
      width: data.width, height: data.height,
      originalWidth: data.originalWidth, originalHeight: data.originalHeight,
      pixels: data.pixels.map(p => ({ x: p.x, y: p.y, r: p.r, g: p.g, b: p.b })),
    }
    transparentIndices.value = data.transparentIndices
    step.value = 'result'
  } catch (err: any) { error.value = err.message || '解析图片失败'; step.value = 'upload' }
  finally { loading.value = false }
}

function resetAll() {
  step.value = 'upload'; loading.value = false; error.value = ''; result.value = null; drawerOpen.value = false
  transparentIndices.value = []
  if (imagePreviewUrl.value) { URL.revokeObjectURL(imagePreviewUrl.value); imagePreviewUrl.value = '' }
}
function changeFillColor(color: string) {
  fillColor.value = color
  if (!result.value || !result.value.pixels.length) return
  const cols = result.value.width
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
