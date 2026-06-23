import { ref, computed, watch, type Ref } from 'vue'
import type { PixelInfo, BeadColor, RawPixel, ColorStrategyId } from '@/types'
import { allBeadColors, findClosestBeadColor, computeColorInfo, mergeFragmentedColors } from '@/utils/colors'
import { defaultStrategyId } from '@/utils/colorStrategies'

/**
 * 网格交互状态
 */
export interface CellSelectState {
  /** 当前所有选中项的原始索引 Set */
  selectedIndices: Set<number>
  /** 正在编辑的索引：-1=批量, null=无 */
  editingIndex: number | null
}

/**
 * 单颗拼豆（展示用）
 */
export interface DisplayBead extends PixelInfo {
  /** 在全量数据中的原始索引 */
  origIdx: number
  /** 在展示网格中的列 */
  displayX: number
  /** 在展示网格中的行 */
  displayY: number
}

/**
 * 统计信息
 */
export interface BeadStats {
  colorInfo: { color: BeadColor; count: number }[]
  colors: BeadColor[]
  uniqueColorCount: number
}

/**
 * 拼豆网格核心逻辑
 * @param rawPixels   后端返回的原始像素数据
 * @param sourceCols  原始像素列数（props.cols）
 * @param sourceRows  原始像素行数（props.rows）
 * @param strategyId  颜色匹配策略ID（响应式）
 */
export function useBeadGrid(
  rawPixels: Ref<RawPixel[]>,
  sourceCols: number,
  sourceRows: number,
  strategyId: Ref<ColorStrategyId> = ref(defaultStrategyId),
) {
  // ========== 全量数据 ==========
  const allBeads = ref<PixelInfo[]>([])

  watch(rawPixels, (raw) => {
    const sid = strategyId.value
    allBeads.value = raw.map(p => ({
      x: p.x,
      y: p.y,
      color: findClosestBeadColor(p.r, p.g, p.b, sid),
    }))
    // 合并碎片颜色（低于 0.5% 的合并到相近色）
    mergeFragmentedColors(allBeads.value, 0.005, sid)
  }, { immediate: true })

  // 策略切换时重新匹配
  watch(strategyId, (sid) => {
    if (!rawPixels.value.length) return
    allBeads.value = rawPixels.value.map(p => ({
      x: p.x,
      y: p.y,
      color: findClosestBeadColor(p.r, p.g, p.b, sid),
    }))
    mergeFragmentedColors(allBeads.value, 0.005, sid)
  })

  // ========== 精度/采样 ==========
  const BEAD_SIZE = 8
  /** 自适应初始精度：让网格宽度 ≈ 600px */
  const initStep = Math.max(1, Math.floor((sourceCols * BEAD_SIZE) / 600))
  const step = ref(initStep)
  const maxStep = computed(() => Math.max(1, Math.floor(Math.min(sourceCols, sourceRows) / 2)))

  // step 超过 maxStep 时自动下拉
  watch(maxStep, (m) => { if (step.value > m) step.value = m })

  /** 拼豆物理尺寸（mm）：5mm 大号 / 2.6mm 小号 */
  const beadSizeMM = ref(5)
  function toggleBeadSize() { beadSizeMM.value = beadSizeMM.value === 5 ? 2.6 : 5 }

  /** 成品实际尺寸 */
  const physicalSize = computed(() => {
    const mm = beadSizeMM.value
    const w = Math.round(displayCols.value * mm)
    const h = Math.round(displayRows.value * mm)
    return { w, h, label: `${Math.round(w/10)}×${Math.round(h/10)}cm` }
  })

  /** 拼豆数量（用户直观选择） */
  const beadCountPresets = computed(() => {
    // 从 sourceCols 向下取 2 的幂次或常用值
    const candidates = [sourceCols, 128, 64, 32, 16, 8]
    return candidates.filter(c => c <= sourceCols && c >= 2)
  })

  /** 由拼豆数量反算 step */
  function setBeadCount(count: number) {
    step.value = Math.max(1, Math.ceil(sourceCols / count))
  }

  /** 降采样后每行实际像素数 */
  const displayCols = computed(() => Math.ceil(sourceCols / step.value))
  /** 降采样后每列实际像素数 */
  const displayRows = computed(() => Math.ceil(sourceRows / step.value))

  const densityLabel = computed(() => {
    const pct = maxStep.value <= 1 ? 0 : (step.value - 1) / (maxStep.value - 1)
    return pct < 0.33 ? '精细' : pct < 0.66 ? '适中' : '粗糙'
  })

  /**
   * 当前展示的拼豆列表（已降采样，按 displayY/displayX 排序保证行优先）
   */
  const displayBeads = computed<DisplayBead[]>(() => {
    const s = step.value
    const result: DisplayBead[] = []
    allBeads.value.forEach((p, i) => {
      if (p.x % s === 0 && p.y % s === 0) {
        const bead: DisplayBead = {
          x: p.x, y: p.y, color: p.color,
          origIdx: i,
          displayX: Math.floor(p.x / s),
          displayY: Math.floor(p.y / s),
        }
        result.push(bead)
      }
    })
    // 按行优先排序，确保 flex-wrap 布局正确
    result.sort((a, b) => a.displayY - b.displayY || a.displayX - b.displayX)
    return result
  })

  // ========== 选中 & 编辑 ==========
  const selectedIndices = ref<Set<number>>(new Set())
  const editingIndex = ref<number | null>(null)

  /** 同色高亮（编辑时） */
  const sameColorIndices = computed(() => {
    if (selectedIndices.value.size === 0 || editingIndex.value === null) return new Set<number>()
    const first = selectedIndices.value.values().next().value
    if (first === undefined) return new Set<number>()
    const code = allBeads.value[first]?.color.code
    const s = new Set<number>()
    allBeads.value.forEach((p, i) => { if (p.color.code === code) s.add(i) })
    return s
  })

  function toggleSelect(idx: number, shiftKey: boolean) {
    if (shiftKey) {
      // Shift+click 选中同色
      const code = allBeads.value[idx]?.color.code
      const s = new Set<number>()
      allBeads.value.forEach((p, i) => { if (p.color.code === code) s.add(i) })
      selectedIndices.value = s
      return
    }
    const s = new Set(selectedIndices.value)
    s.has(idx) ? s.delete(idx) : s.add(idx)
    selectedIndices.value = s
  }

  function clearSelection() {
    selectedIndices.value = new Set()
    editingIndex.value = null
  }

  function startEdit(idx: number) {
    if (selectedIndices.value.has(idx) && selectedIndices.value.size > 1) {
      editingIndex.value = -1  // 批量
    } else {
      selectedIndices.value = new Set([idx])
      editingIndex.value = idx
    }
  }

  function getCellColor(idx: number): BeadColor {
    return allBeads.value[idx]?.color || allBeadColors[0]
  }

  function applyColor(color: BeadColor) {
    if (editingIndex.value === null) return
    if (editingIndex.value === -1) {
      allBeads.value = allBeads.value.map((p, i) =>
        selectedIndices.value.has(i) ? { ...p, color: { ...color } } : p
      )
    } else {
      const idx = editingIndex.value
      allBeads.value = allBeads.value.map((p, i) =>
        i === idx ? { ...p, color: { ...color } } : p
      )
    }
    editingIndex.value = null
  }

  // ========== 统计 ==========
  const stats = computed<BeadStats>(() => {
    const info = computeColorInfo(allBeads.value)
    return {
      colorInfo: info,
      colors: info.map(i => i.color),
      uniqueColorCount: info.length,
    }
  })

  // ========== 导出 ==========
  function downloadPNG() {
    const size = 20
    const w = displayCols.value
    const h = displayRows.value
    const canvas = document.createElement('canvas')
    canvas.width = w * size
    canvas.height = h * size
    const ctx = canvas.getContext('2d')!
    displayBeads.value.forEach(b => {
      const dx = b.displayX * size
      const dy = b.displayY * size
      ctx.fillStyle = b.color.hex
      ctx.fillRect(dx, dy, size, size)
      ctx.strokeStyle = 'rgba(200,200,200,0.3)'
      ctx.strokeRect(dx, dy, size, size)
    })
    const link = document.createElement('a')
    link.download = `pindoudou-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function selectByColor(code: string) {
    const s = new Set<number>()
    allBeads.value.forEach((p, i) => { if (p.color.code === code) s.add(i) })
    selectedIndices.value = s
  }

  return {
    // 数据
    allBeads,
    // 精度
    step, maxStep, BEAD_SIZE, beadCountPresets, setBeadCount,
    displayCols, displayRows, displayBeads, densityLabel,
    // 物理尺寸
    beadSizeMM, toggleBeadSize, physicalSize,
    // 选中
    selectedIndices, editingIndex, sameColorIndices,
    toggleSelect, clearSelection, startEdit, getCellColor, applyColor,
    // 统计
    stats,
    // 导出
    downloadPNG, selectByColor,
  }
}
