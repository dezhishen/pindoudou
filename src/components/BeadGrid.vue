<template>
  <div class="flex flex-col gap-1.5">
    <!-- 信息栏 -->
    <div class="flex gap-2 flex-wrap">
      <div class="flex flex-col items-center bg-green-50 px-3 py-1.5 rounded-lg">
        <span class="text-xs text-gray-500">尺寸</span>
        <span class="text-sm font-bold text-primary">{{ displayCols }}×{{ displayRows }}</span>
      </div>
      <div class="flex flex-col items-center bg-green-50 px-3 py-1.5 rounded-lg">
        <span class="text-xs text-gray-500">总颗数</span>
        <span class="text-sm font-bold text-primary">{{ displayBeads.length }}</span>
      </div>
      <div class="flex flex-col items-center bg-green-50 px-3 py-1.5 rounded-lg">
        <span class="text-xs text-gray-500">颜色数</span>
        <span class="text-sm font-bold text-primary">{{ stats.uniqueColorCount }}</span>
      </div>
      <div class="flex flex-col items-center bg-green-50 px-3 py-1.5 rounded-lg">
        <span class="text-xs text-gray-500">选中</span>
        <span class="text-sm font-bold text-primary">{{ selectedIndices.size }}</span>
      </div>
    </div>

    <!-- 豆子尺寸切换 -->
    <div class="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 -mt-0.5">
      <span class="text-xs text-gray-500 whitespace-nowrap">豆子尺寸</span>
      <div class="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          class="px-4 py-1.5 text-xs font-medium transition cursor-pointer border-r border-gray-200 last:border-r-0"
          :class="beadSizeMM === 5
            ? 'bg-primary text-white'
            : 'text-gray-600 hover:bg-gray-100'"
          @click="beadSizeMM = 5">
          5mm 大号
        </button>
        <button
          class="px-4 py-1.5 text-xs font-medium transition cursor-pointer border-r border-gray-200 last:border-r-0"
          :class="beadSizeMM === 2.6
            ? 'bg-primary text-white'
            : 'text-gray-600 hover:bg-gray-100'"
          @click="beadSizeMM = 2.6">
          2.6mm 小号
        </button>
      </div>
      <span class="text-xs font-semibold text-primary whitespace-nowrap">
        ≈ {{ physicalSize.label }}
      </span>
      <span v-if="beadSizeMM === 5" class="text-[10px] text-gray-400">
        （小号≈{{ Math.round(displayCols * 2.6 / 10) }}×{{ Math.round(displayRows * 2.6 / 10) }}cm）
      </span>
      <span v-else class="text-[10px] text-gray-400">
        （大号≈{{ Math.round(displayCols * 5 / 10) }}×{{ Math.round(displayRows * 5 / 10) }}cm）
      </span>
    </div>

    <!-- 拼豆宽度 -->
    <div class="flex items-center gap-1.5 flex-wrap">
      <span class="text-xs text-gray-500">拼豆宽度</span>
      <div class="flex gap-1 flex-wrap">
        <button v-for="c in beadCountPresets" :key="c"
          class="px-2.5 py-1 rounded-md border text-xs font-medium transition cursor-pointer"
          :class="displayCols === c
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary'"
          @click="c !== displayCols && setBeadCount(c)">
          {{ c }}
        </button>
      </div>
      <span class="text-xs text-gray-400">颗</span>
    </div>

    <!-- 网格 -->
    <div class="grid-scroll">
      <div ref="gridRef" class="bead-grid" :style="{ gridTemplateColumns: `repeat(${displayCols}, ${BEAD_SIZE}px)`, gridTemplateRows: `repeat(${displayRows}, ${BEAD_SIZE}px)` }" @click.self="clearSelection">
        <div v-for="b in displayBeads" :key="b.origIdx" class="bead-cell" :class="{ 'selected': selectedIndices.has(b.origIdx), 'same-color': sameColorIndices.has(b.origIdx) && selectedIndices.size > 0 }" :style="{ width: BEAD_SIZE+'px', height: BEAD_SIZE+'px', background: b.color.hex }" :data-color="b.color.code" @click.stop="toggleSelect(b.origIdx, $event.shiftKey)" @contextmenu.prevent="startEdit(b.origIdx)" />
      </div>
    </div>

    <!-- 颜色编辑器 -->
    <div v-if="editingIndex !== null" class="border border-gray-200 rounded-lg bg-white overflow-hidden" @click.stop>
      <div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span class="text-xs font-medium">🎨 {{ editingIndex === -1 ? `批量修改 (${selectedIndices.size}颗)` : `第 ${editingIndex + 1} 颗` }}</span>
        <button class="w-6 h-6 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center text-sm hover:bg-gray-200" @click="editingIndex = null">✕</button>
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
import { ref, watch } from 'vue'
import type { RawPixel } from '@/types'
import { allBeadColors } from '@/utils/colors'
import { useBeadGrid } from '@/composables/useBeadGrid'

const props = defineProps<{ pixels: RawPixel[]; cols: number; rows: number }>()
const emit = defineEmits<{ (e: 'update-info', info: { colorInfo: { color: import('@/types').BeadColor; count: number }[] }): void }>()
const pixelRef = ref<RawPixel[]>([])
watch(() => props.pixels, (v) => { pixelRef.value = v }, { immediate: true })

const { step, maxStep, BEAD_SIZE, beadCountPresets, setBeadCount, displayCols, displayRows, displayBeads, selectedIndices, editingIndex, sameColorIndices, toggleSelect, clearSelection, startEdit, getCellColor, applyColor, stats, downloadPNG, selectByColor, beadSizeMM, physicalSize } = useBeadGrid(pixelRef, props.cols, props.rows)

watch(() => stats.value, (s) => { emit('update-info', { colorInfo: s.colorInfo }) }, { deep: true, immediate: true })
defineExpose({ downloadPNG, selectByColor })
</script>

<style scoped>
.grid-scroll { overflow: auto; max-width: 100%; max-height: calc(100vh - 220px); border: 0.5px solid #e5e7eb; border-radius: 4px; }
.bead-grid { display: grid; cursor: crosshair; width: fit-content; background: #fff; }
.bead-cell { flex-shrink: 0; border: 0.5px solid rgba(0,0,0,0.08); box-sizing: border-box; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; position: relative; }
.bead-cell:hover { transform: scale(1.15); z-index: 2; box-shadow: 0 0 6px rgba(0,0,0,0.3); }
.bead-cell.selected { outline: 2px solid #ff4444; outline-offset: -1px; z-index: 3; }
.bead-cell.same-color { outline: 2px dashed #ffaa00; outline-offset: -1px; z-index: 1; }
</style>
