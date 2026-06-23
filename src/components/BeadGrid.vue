<template>
  <div class="flex flex-col gap-1.5">
    <!-- 信息栏 -->
    <div class="flex gap-2 flex-wrap">
      <div class="flex flex-col items-center bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ $t('grid.size') }}</span>
        <span class="text-sm font-bold text-primary dark:text-green-400">{{ displayCols }}×{{ displayRows }}</span>
      </div>
      <div class="flex flex-col items-center bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ $t('grid.total') }}</span>
        <span class="text-sm font-bold text-primary dark:text-green-400">{{ displayBeads.length }}</span>
      </div>
      <div class="flex flex-col items-center bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ $t('grid.colors') }}</span>
        <span class="text-sm font-bold text-primary dark:text-green-400">{{ stats.uniqueColorCount }}</span>
      </div>
      <div class="flex flex-col items-center bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ $t('grid.selected') }}</span>
        <span class="text-sm font-bold text-primary dark:text-green-400">{{ selectedIndices.size }}</span>
      </div>
      <div v-if="realSizeMode && realCellPx" class="flex flex-col items-center bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg">
        <span class="text-xs text-orange-500">📏 {{ $t('grid.realSize') }}</span>
        <span class="text-sm font-bold text-orange-600">{{ $t('grid.realSizeUnit', { px: realCellPx }) }}</span>
      </div>
    </div>

    <!-- 豆子尺寸切换 -->
    <div class="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 -mt-0.5">
      <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ $t('grid.beadSize') }}</span>
      <div class="flex bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 overflow-hidden">
        <button
          class="px-4 py-1.5 text-xs font-medium transition cursor-pointer border-r border-gray-200 last:border-r-0"
          :class="beadSizeMM === 5 ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'"
          @click="beadSizeMM = 5">{{ $t('grid.beadLarge') }}</button>
        <button
          class="px-4 py-1.5 text-xs font-medium transition cursor-pointer border-r border-gray-200 last:border-r-0"
          :class="beadSizeMM === 2.6 ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'"
          @click="beadSizeMM = 2.6">{{ $t('grid.beadSmall') }}</button>
      </div>
      <span class="text-xs font-semibold text-primary whitespace-nowrap">≈ {{ physicalSize.label }}</span>
      <span v-if="beadSizeMM === 5" class="text-[10px] text-gray-400">{{ $t('grid.smallHint', { w: Math.round(displayCols * 2.6), h: Math.round(displayRows * 2.6) }) }}</span>
      <span v-else class="text-[10px] text-gray-400">{{ $t('grid.largeHint', { w: Math.round(displayCols * 5), h: Math.round(displayRows * 5) }) }}</span>
    </div>

    <!-- 拼豆宽度 -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ $t('grid.width') }}</span>
        <div class="flex gap-1 flex-wrap">
          <button v-for="c in beadCountPresets" :key="c"
            class="px-2.5 py-1 rounded-md border text-xs font-medium transition cursor-pointer"
            :class="displayCols === c ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-green-400 hover:text-primary dark:hover:text-green-400'"
            @click="c !== displayCols && setBeadCount(c)">{{ c }}</button>
        </div>
        <span class="text-xs text-gray-400 dark:text-gray-500">{{ $t('grid.widthUnit') }}</span>
      </div>
    </div>

    <!-- 单元格缩放 + 实图 + 展示模式 -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ $t('grid.cellSize') }}</span>
        <div class="flex bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          <button
            class="px-2.5 py-1 text-[10px] font-medium transition cursor-pointer border-r border-gray-200 dark:border-gray-600 last:border-r-0 flex items-center gap-1"
            :class="!realSizeMode && cellSize === 6 ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'"
            @click="setCellSize(6)"
            :title="$t('grid.cellSmallTip')">
            <span class="inline-block w-2 h-2 rounded-sm border border-current opacity-60" />
            {{ $t('grid.cellSmall') }}
          </button>
          <button
            class="px-2.5 py-1 text-[10px] font-medium transition cursor-pointer border-r border-gray-200 dark:border-gray-600 last:border-r-0 flex items-center gap-1"
            :class="!realSizeMode && cellSize === 8 ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'"
            @click="setCellSize(8)"
            :title="$t('grid.cellMediumTip')">
            <span class="inline-block w-2.5 h-2.5 rounded-sm border border-current opacity-60" />
            {{ $t('grid.cellMedium') }}
          </button>
          <button
            class="px-2.5 py-1 text-[10px] font-medium transition cursor-pointer border-r border-gray-200 dark:border-gray-600 last:border-r-0 flex items-center gap-1"
            :class="!realSizeMode && cellSize === 12 ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'"
            @click="setCellSize(12)"
            :title="$t('grid.cellLargeTip')">
            <span class="inline-block w-3 h-3 rounded-sm border border-current opacity-60" />
            {{ $t('grid.cellLarge') }}
          </button>
          <button
            class="px-2.5 py-1 text-[10px] font-medium transition cursor-pointer flex items-center gap-1"
            :class="realSizeMode ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'"
            @click="realSizeMode = !realSizeMode"
            :title="$t('grid.cellRealTip')">
            <span class="inline-block w-3 h-3 rounded-sm border-2 border-current" />
            {{ $t('grid.cellReal') }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ $t('grid.display') }}</span>
        <div class="flex bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          <button
            class="px-3 py-1 text-[10px] font-medium transition cursor-pointer border-r border-gray-200 dark:border-gray-600 last:border-r-0"
            :class="displayMode === 'color' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'"
            @click="displayMode = 'color'"
            :title="$t('grid.modeColorTip')">
            🎨 {{ $t('grid.modeColor') }}
          </button>
          <button
            class="px-3 py-1 text-[10px] font-medium transition cursor-pointer border-r border-gray-200 dark:border-gray-600 last:border-r-0"
            :class="displayMode === 'both' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'"
            @click="displayMode = 'both'"
            :title="$t('grid.modeRulerTip')">
            📐 {{ $t('grid.modeRuler') }}
          </button>
          <button
            class="px-3 py-1 text-[10px] font-medium transition cursor-pointer border-r border-gray-200 dark:border-gray-600 last:border-r-0"
            :class="displayMode === 'coords' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'"
            @click="displayMode = 'coords'"
            :title="$t('grid.modeCoordsTip')">
            🔢 {{ $t('grid.modeCoords') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 实图模式：屏幕参数设置 -->
    <div v-if="realSizeMode" class="flex items-center gap-2 flex-wrap bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-2">
      <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ $t('grid.screen') }}</span>
      <select v-model.number="screenDiagonal" class="w-14 px-1.5 py-0.5 text-[10px] border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 dark:text-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none appearance-none cursor-pointer">
        <option :value="null" disabled>{{ $t('grid.screenSize') }}</option>
        <option v-for="s in commonScreenSizes" :key="s" :value="s">{{ s }}"</option>
      </select>
      <input v-model.number="screenResW" type="number" step="1" min="1" :placeholder="detectedResW ? String(detectedResW) : $t('grid.screenWidth')"
        class="w-12 px-1.5 py-0.5 text-[10px] border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 dark:text-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none" />
      <span class="text-[10px] text-gray-400 dark:text-gray-500">×</span>
      <input v-model.number="screenResH" type="number" step="1" min="1" :placeholder="detectedResH ? String(detectedResH) : $t('grid.screenHeight')"
        class="w-12 px-1.5 py-0.5 text-[10px] border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 dark:text-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none" />
      <span v-if="screenPPI" class="text-[10px] text-gray-500">{{ $t('grid.screenPPI', { ppi: screenPPI }) }}<span v-if="dpr !== 1" class="text-orange-400">{{ $t('grid.screenDPR', { dpr }) }}</span></span>
      <span v-else class="text-[10px] text-orange-400">{{ $t('grid.screenIncomplete') }}</span>
      <div class="flex gap-1 flex-wrap">
        <button v-for="p in screenPresets" :key="p.label"
          class="px-1.5 py-0.5 text-[9px] rounded border transition cursor-pointer whitespace-nowrap"
          :class="(p.d === 0 ? (screenResW === detectedResW && screenResH === detectedResH) : screenDiagonal === p.d && screenResW === p.w && screenResH === p.h) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-500'"
          @click="applyScreenPreset(p)">{{ i18nPresetLabel(p.label) }}</button>
      </div>
    </div>

    <!-- ============ 模式「颜色」：纯拼豆网格 ============ -->
    <div v-if="displayMode === 'color'" class="grid-scroll">
      <div ref="gridRef" class="bead-grid" :style="gridStyle" @click.self="clearSelection">
        <div v-for="b in displayBeads" :key="b.origIdx"
          class="bead-cell"
          :class="cellClass(b.origIdx)"
          :style="{ ...beadCellStyle, background: b.color.hex }"
          :data-color="b.color.code"
          @click.stop="toggleSelect(b.origIdx, $event.shiftKey)"
          @contextmenu.prevent="startEdit(b.origIdx)" />
      </div>
    </div>

    <!-- ============ 模式「标尺」：颜色网格 + 行列坐标标尺 ============ -->
    <div v-else-if="displayMode === 'both'" class="grid-scroll">
      <div class="ruler-grid" :style="rulerGridStyle">
        <!-- 左上角占位 -->
        <div class="ruler-corner" :style="cornerStyle" />
        <!-- 列标尺 (x坐标) -->
        <div v-for="x in displayCols" :key="'cx'+x"
          class="ruler-cell ruler-col"
          :style="rulerCellStyle">
          {{ x - 1 }}
        </div>
        <!-- 行标尺 + 拼豆网格（同一grid中） -->
        <template v-for="y in displayRows" :key="'row'+y">
          <!-- 行标尺 (y坐标) -->
          <div class="ruler-cell ruler-row" :style="rulerCellStyle">{{ y - 1 }}</div>
          <!-- 该行的拼豆 -->
          <div v-for="b in rowBeads(y - 1)" :key="b.origIdx"
            class="bead-cell"
            :class="cellClass(b.origIdx)"
            :style="{ ...beadCellStyle, background: b.color.hex }"
            :data-color="b.color.code"
            @click.stop="toggleSelect(b.origIdx, $event.shiftKey)"
            @contextmenu.prevent="startEdit(b.origIdx)" />
        </template>
      </div>
    </div>

    <!-- ============ 模式「坐标格」：单元格显示坐标 ============ -->
    <div v-else class="grid-scroll">
      <div class="coord-grid" :style="coordGridStyle" @click.self="clearSelection">
        <div v-for="b in displayBeads" :key="b.origIdx"
          class="coord-cell"
          :class="cellClass(b.origIdx)"
          :style="{ width: coordCellSize+'px', height: coordCellSize+'px', background: b.color.hex }"
          @click.stop="toggleSelect(b.origIdx, $event.shiftKey)"
          @contextmenu.prevent="startEdit(b.origIdx)">
          <span class="coord-text" :style="coordTextStyle">{{ b.displayX }},{{ b.displayY }}</span>
        </div>
      </div>
    </div>

    <!-- 颜色编辑器 -->
    <div v-if="editingIndex !== null" class="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden" @click.stop>
      <div class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <span class="text-xs font-medium dark:text-gray-200">🎨 {{ editingIndex === -1 ? $t('grid.editorBatch', { count: selectedIndices.size }) : $t('grid.editorSingle', { index: editingIndex + 1 }) }}</span>
        <button class="w-6 h-6 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center text-sm hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-400" @click="editingIndex = null">✕</button>
      </div>
      <div class="flex flex-wrap gap-1 p-2.5 max-h-44 overflow-y-auto">
        <button v-for="c in allBeadColors" :key="c.code" class="w-9 h-9 rounded-md border-2 border-transparent cursor-pointer relative flex items-end justify-center hover:scale-125 hover:z-10 transition" :class="{ '!border-red-500 shadow-[0_0_0_2px_white,0_0_0_4px_#ff4444]': getCellColor(editingIndex === -1 ? [...selectedIndices][0] : editingIndex).code === c.code }" :style="{ background: c.hex }" :title="c.name" @click="applyColor(c)">
          <span class="text-[8px] bg-black/60 text-white px-1 rounded hidden">{{ c.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { RawPixel, ColorStrategyId } from '@/types'
import { allBeadColors } from '@/utils/colors'
import { useBeadGrid } from '@/composables/useBeadGrid'
import type { DisplayBead } from '@/composables/useBeadGrid'
import { defaultStrategyId } from '@/utils/colorStrategies'
import { $t } from '@/i18n'

const props = defineProps<{
  pixels: RawPixel[]
  cols: number
  rows: number
  strategyId?: ColorStrategyId
}>()
const emit = defineEmits<{ (e: 'update-info', info: { colorInfo: { color: import('@/types').BeadColor; count: number }[] }): void }>()
const pixelRef = ref<RawPixel[]>([])
const strategyRef = ref<ColorStrategyId>(props.strategyId ?? defaultStrategyId)
const colsRef = computed(() => props.cols)
const rowsRef = computed(() => props.rows)

watch(() => props.pixels, (v) => { pixelRef.value = v }, { immediate: true })
watch(() => props.strategyId, (v) => { if (v) strategyRef.value = v })

const {
  step, maxStep, BEAD_SIZE, beadCountPresets, setBeadCount,
  displayCols, displayRows, displayBeads,
  selectedIndices, editingIndex, sameColorIndices,
  toggleSelect, clearSelection, startEdit, getCellColor, applyColor,
  stats, downloadPNG, downloadSVG, selectByColor,
  beadSizeMM, physicalSize,
} = useBeadGrid(pixelRef, colsRef, rowsRef, strategyRef)

// ========== 展示模式 ==========
type DisplayMode = 'color' | 'both' | 'coords'
const displayMode = ref<DisplayMode>('color')

// ========== 单元格缩放 ==========
const cellSize = ref(8)  // 小6 / 中8 / 大12

// ========== 实图模式 ==========
const realSizeMode = ref(false)

// 屏幕参数（本地管理）
const screenDiagonal = ref<number | null>(null)
const screenResW = ref<number | null>(null)
const screenResH = ref<number | null>(null)

// 常见屏幕尺寸
const commonScreenSizes = [13, 14, 15, 16, 21, 24, 27, 32, 34, 42, 49, 55, 65]

// 操作系统缩放比（Windows缩放与布局 / macOS分辨率缩放）
const dpr = ref(typeof window !== 'undefined' ? window.devicePixelRatio : 1)

// 自动检测的物理分辨率
const detectedResW = computed(() => {
  if (typeof window === 'undefined') return null
  return Math.round(window.screen.width * dpr.value)
})
const detectedResH = computed(() => {
  if (typeof window === 'undefined') return null
  return Math.round(window.screen.height * dpr.value)
})

const screenPPI = computed(() => {
  const d = screenDiagonal.value
  const w = screenResW.value
  const h = screenResH.value
  if (!d || !w || !h || d <= 0 || w <= 0 || h <= 0) return null
  return Math.round(Math.sqrt(w * w + h * h) / d)
})

const screenPresets = [
  { label: '🔍自动', d: 0, w: 0, h: 0 },
  { label: '14"FHD', d: 14, w: 1920, h: 1080 },
  { label: '24"FHD', d: 24, w: 1920, h: 1080 },
  { label: '27"2K', d: 27, w: 2560, h: 1440 },
  { label: '27"4K', d: 27, w: 3840, h: 2160 },
]

function applyScreenPreset(p: typeof screenPresets[number]) {
  if (p.d === 0) {
    // 自动：仅填充检测到的分辨率，尺寸仍需手动输入
    screenResW.value = detectedResW.value
    screenResH.value = detectedResH.value
  } else {
    screenDiagonal.value = p.d
    screenResW.value = p.w
    screenResH.value = p.h
  }
}

const presetsKeyMap: Record<string, string> = {
  '🔍自动': 'grid.presetAuto',
  '14"FHD': 'grid.preset14FHD',
  '24"FHD': 'grid.preset24FHD',
  '27"2K': 'grid.preset272K',
  '27"4K': 'grid.preset274K',
}
function i18nPresetLabel(label: string) {
  return $t(presetsKeyMap[label] || label)
}

/** 设置单元格尺寸（若在实图模式则先退出） */
function setCellSize(size: number) {
  realSizeMode.value = false
  cellSize.value = size
}

// 首次开启实图模式时自动填入检测到的分辨率
watch(realSizeMode, (on) => {
  if (on && screenResW.value == null && screenResH.value == null && detectedResW.value && detectedResH.value) {
    screenResW.value = detectedResW.value
    screenResH.value = detectedResH.value
  }
})

/** 根据屏幕参数、豆子尺寸、系统缩放计算实际 CSS 像素 */
const realCellPx = computed(() => {
  const d = screenDiagonal.value
  const w = screenResW.value
  const h = screenResH.value
  if (!d || !w || !h || d <= 0 || w <= 0 || h <= 0) return null
  const physicalPPI = Math.sqrt(w * w + h * h) / d
  // CSS像素 = 物理像素 / devicePixelRatio
  return Math.round(beadSizeMM.value / 25.4 * physicalPPI / dpr.value)
})

/** 实际生效的单元格尺寸 */
const effectiveCellSize = computed(() => {
  if (realSizeMode.value && realCellPx.value != null && realCellPx.value > 0) {
    return realCellPx.value
  }
  return cellSize.value
})

/** 坐标格模式下单元格尺寸（约为颜色模式的2.75倍以便显示文字） */
const coordCellSize = computed(() => Math.round(effectiveCellSize.value * 2.75))

// ========== 网格样式 ==========
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${displayCols.value}, ${effectiveCellSize.value}px)`,
  gridTemplateRows: `repeat(${displayRows.value}, ${effectiveCellSize.value}px)`,
}))

/** 标尺模式网格（多一行列头 + 多一列行头） */
const rulerGridStyle = computed(() => ({
  gridTemplateColumns: `${effectiveCellSize.value}px repeat(${displayCols.value}, ${effectiveCellSize.value}px)`,
  gridTemplateRows: `${effectiveCellSize.value}px repeat(${displayRows.value}, ${effectiveCellSize.value}px)`,
}))

/** 坐标格模式网格 */
const coordGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${displayCols.value}, ${coordCellSize.value}px)`,
  gridTemplateRows: `repeat(${displayRows.value}, ${coordCellSize.value}px)`,
}))

const cornerStyle = computed(() => ({ width: effectiveCellSize.value+'px', height: effectiveCellSize.value+'px' }))
const rulerCellStyle = computed(() => ({ width: effectiveCellSize.value+'px', height: effectiveCellSize.value+'px' }))
const beadCellStyle = computed(() => ({ width: effectiveCellSize.value+'px', height: effectiveCellSize.value+'px' }))

const coordTextStyle = computed(() => ({
  fontSize: Math.max(5, Math.round(effectiveCellSize.value * 0.75)) + 'px',
}))

// ========== 单元格样式 ==========
function cellClass(idx: number) {
  return {
    'selected': selectedIndices.value.has(idx),
    'same-color': sameColorIndices.value.has(idx) && selectedIndices.value.size > 0,
  }
}

// ========== 标尺模式：按行分组 ==========
const beadsByRow = computed(() => {
  const map = new Map<number, DisplayBead[]>()
  for (const b of displayBeads.value) {
    const row = map.get(b.displayY) || []
    row.push(b)
    map.set(b.displayY, row)
  }
  return map
})

function rowBeads(y: number): DisplayBead[] {
  return beadsByRow.value.get(y) || []
}

watch(() => stats.value, (s) => { emit('update-info', { colorInfo: s.colorInfo }) }, { deep: true, immediate: true })

/** 根据当前展示模式下载 */
function downloadWithMode() { downloadPNG(displayMode.value) }
function downloadSVGWithMode() { downloadSVG(displayMode.value) }

defineExpose({ downloadPNG: downloadWithMode, downloadSVG: downloadSVGWithMode, selectByColor, toggleRealSize: () => { realSizeMode.value = !realSizeMode.value }, realSizeMode })
</script>

<style scoped>
.grid-scroll { overflow: auto; max-width: 100%; max-height: calc(100vh - 220px); border: 0.5px solid #e5e7eb; border-radius: 4px; }
:global(.dark) .grid-scroll { border-color: #374151; }

/* 纯颜色模式 */
.bead-grid { display: grid; cursor: crosshair; width: fit-content; background: #fff; }
:global(.dark) .bead-grid { background: #1f2937; }

/* 标尺模式 */
.ruler-grid { display: grid; cursor: crosshair; width: fit-content; background: #fff; }
:global(.dark) .ruler-grid { background: #1f2937; }
.ruler-corner { background: #f3f4f6; border: 0.5px solid #d1d5db; box-sizing: border-box; position: sticky; top: 0; left: 0; z-index: 5; }
:global(.dark) .ruler-corner { background: #374151; border-color: #4b5563; }
.ruler-cell { display: flex; align-items: center; justify-content: center; background: #f3f4f6; border: 0.5px solid #d1d5db; box-sizing: border-box; font-size: 6px; color: #6b7280; font-family: monospace; line-height: 1; user-select: none; }
:global(.dark) .ruler-cell { background: #374151; border-color: #4b5563; color: #9ca3af; }
.ruler-col { position: sticky; top: 0; z-index: 4; }
.ruler-row { position: sticky; left: 0; z-index: 4; }

/* 坐标格模式 */
.coord-grid { display: grid; cursor: crosshair; width: fit-content; background: #fff; }
:global(.dark) .coord-grid { background: #1f2937; }

/* 通用单元格 */
.bead-cell { flex-shrink: 0; border: 0.5px solid rgba(0,0,0,0.08); box-sizing: border-box; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; position: relative; }
:global(.dark) .bead-cell { border-color: rgba(255,255,255,0.06); }
.bead-cell:hover { transform: scale(1.15); z-index: 2; box-shadow: 0 0 6px rgba(0,0,0,0.3); }
:global(.dark) .bead-cell:hover { box-shadow: 0 0 6px rgba(255,255,255,0.2); }
.bead-cell.selected { outline: 2px solid #ff4444; outline-offset: -1px; z-index: 3; }
.bead-cell.same-color { outline: 2px dashed #ffaa00; outline-offset: -1px; z-index: 1; }

/* 坐标格单元格 */
.coord-cell { flex-shrink: 0; border: 0.5px solid rgba(0,0,0,0.15); box-sizing: border-box; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
:global(.dark) .coord-cell { border-color: rgba(255,255,255,0.1); }
.coord-cell:hover { transform: scale(1.15); z-index: 2; box-shadow: 0 0 6px rgba(0,0,0,0.3); }
:global(.dark) .coord-cell:hover { box-shadow: 0 0 6px rgba(255,255,255,0.2); }
.coord-cell.selected { outline: 2px solid #ff4444; outline-offset: -1px; z-index: 3; }
.coord-cell.same-color { outline: 2px dashed #ffaa00; outline-offset: -1px; z-index: 1; }

.coord-text { font-family: monospace; color: #fff; text-shadow: 0 0 1px #000, 0 0 2px #000; line-height: 1; pointer-events: none; text-align: center; white-space: nowrap; }
</style>
