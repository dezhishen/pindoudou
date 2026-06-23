import { ref, computed, watch, isRef, type Ref } from 'vue'
import type { PixelInfo, BeadColor, RawPixel, ColorStrategyId } from '@/types'
import { allBeadColors, findClosestBeadColor, computeColorInfo, mergeFragmentedColors } from '@/utils/colors'
import { defaultStrategyId, getStrategy } from '@/utils/colorStrategies'
import { $t } from '@/i18n'

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
  sourceCols: Ref<number> | number,
  sourceRows: Ref<number> | number,
  strategyId: Ref<ColorStrategyId> = ref(defaultStrategyId),
  strategyOptions: Ref<Record<string, unknown>> = ref({}),
) {
  const _cols = isRef(sourceCols) ? sourceCols : ref(sourceCols)
  const _rows = isRef(sourceRows) ? sourceRows : ref(sourceRows)
  // ========== 全量数据（保持原始匹配结果，不做碎片合并） ==========
  const allBeads = ref<PixelInfo[]>([])

  watch(rawPixels, (raw) => {
    const sid = strategyId.value
    const w = _cols.value
    const h = _rows.value
    allBeads.value = raw.map(p => ({
      x: p.x,
      y: p.y,
      color: findClosestBeadColor(p.r, p.g, p.b, sid),
    }))
    // 策略后处理（如 BFS 区域合并）
    const strategy = getStrategy(sid)
    if (strategy?.postProcess && w > 0 && h > 0) {
      strategy.postProcess(allBeads.value, w, h, strategyOptions.value)
    }
  }, { immediate: true })

  // 策略切换时重新匹配（保留拼豆宽度、尺寸等所有显示参数）
  watch(strategyId, (sid) => {
    if (!rawPixels.value.length) return
    const w = _cols.value
    const h = _rows.value
    allBeads.value = rawPixels.value.map(p => ({
      x: p.x,
      y: p.y,
      color: findClosestBeadColor(p.r, p.g, p.b, sid),
    }))
    // 策略后处理（如 BFS 区域合并）
    const strategy = getStrategy(sid)
    if (strategy?.postProcess && w > 0 && h > 0) {
      strategy.postProcess(allBeads.value, w, h, strategyOptions.value)
    }
    // 颜色变化后清除选中和编辑状态
    selectedIndices.value = new Set()
    editingIndex.value = null
  })

  // 策略选项变化时（如 BFS 阈值滑块），重新匹配并应用后处理
  watch(strategyOptions, () => {
    if (!rawPixels.value.length) return
    const sid = strategyId.value
    const w = _cols.value
    const h = _rows.value
    allBeads.value = rawPixels.value.map(p => ({
      x: p.x,
      y: p.y,
      color: findClosestBeadColor(p.r, p.g, p.b, sid),
    }))
    const strategy = getStrategy(sid)
    if (strategy?.postProcess && w > 0 && h > 0) {
      strategy.postProcess(allBeads.value, w, h, strategyOptions.value)
    }
  }, { deep: true })

  // ========== 精度/采样 ==========
  const BEAD_SIZE = 8
  /** 自适应初始精度：对齐最近的拼豆宽度预设值 */
  const step = ref(1)

  /** 拼豆数量预设 */
  const beadCountPresets = computed(() => {
    const sc = _cols.value
    const candidates = [sc, 128, 64, 32, 16, 8]
    return candidates.filter(c => c <= sc && c >= 2)
  })

  // 初始化：选取最接近 600px 网格宽度的预设值
  if (_cols.value > 0) {
    const targetCols = Math.max(1, Math.floor(600 / BEAD_SIZE))
    let bestPreset = beadCountPresets.value[0] ?? _cols.value
    for (const c of beadCountPresets.value) {
      if (Math.abs(c - targetCols) < Math.abs(bestPreset - targetCols)) bestPreset = c
    }
    step.value = Math.max(1, Math.ceil(_cols.value / (bestPreset || 1)))
  }

  // cols 变化时重新初始化 step（如图片上传后从 0 变为实际值）
  watch([_cols, _rows], ([c]) => {
    if (c <= 0) return
    const targetCols = Math.max(1, Math.floor(600 / BEAD_SIZE))
    // 直接计算候选预设值（避免 computed 时序问题）
    const candidates = [c, 128, 64, 32, 16, 8].filter(n => n <= c && n >= 2)
    if (candidates.length === 0) return
    let bestPreset = candidates[0]
    for (const p of candidates) {
      if (Math.abs(p - targetCols) < Math.abs(bestPreset - targetCols)) bestPreset = p
    }
    step.value = Math.max(1, Math.ceil(c / (bestPreset || 1)))
  })

  /** 由拼豆数量反算 step */
  function setBeadCount(count: number) {
    step.value = Math.max(1, Math.ceil(_cols.value / count))
  }

  const maxStep = computed(() => Math.max(1, Math.floor(Math.min(_cols.value, _rows.value) / 2)))

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
    return { w, h, label: `${w}×${h}mm` }
  })

  /** 降采样后每行实际像素数 */
  const displayCols = computed(() => Math.ceil(_cols.value / step.value))
  /** 降采样后每列实际像素数 */
  const displayRows = computed(() => Math.ceil(_rows.value / step.value))

  const densityLabel = computed(() => {
    const pct = maxStep.value <= 1 ? 0 : (step.value - 1) / (maxStep.value - 1)
    return pct < 0.33 ? $t('density.fine') : pct < 0.66 ? $t('density.medium') : $t('density.coarse')
  })

  /**
   * 当前展示的拼豆列表（已降采样 + 碎片颜色合并，按 displayY/displayX 排序）
   */
  const displayBeads = computed<DisplayBead[]>(() => {
    const s = step.value
    const result: DisplayBead[] = []
    allBeads.value.forEach((p, i) => {
      if (p.x % s === 0 && p.y % s === 0) {
        result.push({
          x: p.x, y: p.y, color: { ...p.color },
          origIdx: i,
          displayX: Math.floor(p.x / s),
          displayY: Math.floor(p.y / s),
        })
      }
    })
    result.sort((a, b) => a.displayY - b.displayY || a.displayX - b.displayX)
    // 仅对展示数据做碎片颜色合并，不影响原始匹配结果
    mergeFragmentedColors(result, 0.005, strategyId.value)
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

  // ========== 统计（基于当前展示的降采样结果） ==========
  const stats = computed<BeadStats>(() => {
    const info = computeColorInfo(displayBeads.value)
    return {
      colorInfo: info,
      colors: info.map(i => i.color),
      uniqueColorCount: info.length,
    }
  })

  // ========== 导出 ==========

  /** 下载单元格像素尺寸 */
  const DOWNLOAD_CELL = 20

  function downloadPNG(mode: 'color' | 'both' | 'coords' = 'color') {
    const size = DOWNLOAD_CELL
    const w = displayCols.value
    const h = displayRows.value

    if (mode === 'both') {
      // 标尺模式：左上角占位 + 列标尺 + 行标尺 + 拼豆
      const canvas = document.createElement('canvas')
      canvas.width = (w + 1) * size
      canvas.height = (h + 1) * size
      const ctx = canvas.getContext('2d')!

      // 左上角占位
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, size, size)
      ctx.strokeStyle = '#d1d5db'
      ctx.strokeRect(0, 0, size, size)

      // 列标尺 (x 坐标)
      const rulerFontSize = Math.max(8, Math.round(size * 0.4))
      ctx.font = `${rulerFontSize}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let x = 0; x < w; x++) {
        const dx = (x + 1) * size
        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(dx, 0, size, size)
        ctx.strokeStyle = '#d1d5db'
        ctx.strokeRect(dx, 0, size, size)
        ctx.fillStyle = '#6b7280'
        ctx.fillText(String(x), dx + size / 2, size / 2, size)
      }

      // 行标尺 + 拼豆
      for (let y = 0; y < h; y++) {
        const dy = (y + 1) * size
        // 行标尺
        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, dy, size, size)
        ctx.strokeStyle = '#d1d5db'
        ctx.strokeRect(0, dy, size, size)
        ctx.fillStyle = '#6b7280'
        ctx.fillText(String(y), size / 2, dy + size / 2, size)
      }

      // 拼豆单元格
      displayBeads.value.forEach(b => {
        const dx = (b.displayX + 1) * size
        const dy = (b.displayY + 1) * size
        ctx.fillStyle = b.color.hex
        ctx.fillRect(dx, dy, size, size)
        ctx.strokeStyle = 'rgba(200,200,200,0.3)'
        ctx.strokeRect(dx, dy, size, size)
      })

      const link = document.createElement('a')
      link.download = `pindoudou-ruler-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } else if (mode === 'coords') {
      // 坐标格模式：每个单元格内显示 (x, y) 坐标
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

        // 坐标文字
        const coordFontSize = Math.max(6, Math.round(size * 0.35))
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${coordFontSize}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = '#000'
        ctx.shadowBlur = 1
        ctx.fillText(`${b.displayX},${b.displayY}`, dx + size / 2, dy + size / 2)
        ctx.shadowBlur = 0
      })

      const link = document.createElement('a')
      link.download = `pindoudou-coords-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } else {
      // 纯颜色模式（默认）
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
  }

  function downloadSVG(mode: 'color' | 'both' | 'coords' = 'color') {
    const size = DOWNLOAD_CELL
    const w = displayCols.value
    const h = displayRows.value

    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    const beadRects = displayBeads.value.map(b => {
      const x = mode === 'both' ? (b.displayX + 1) * size : b.displayX * size
      const y = mode === 'both' ? (b.displayY + 1) * size : b.displayY * size
      return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${b.color.hex}" stroke="rgba(200,200,200,0.3)" stroke-width="0.5"/>`
    }).join('\n')

    let svg = ''
    const totalW = mode === 'both' ? (w + 1) * size : w * size
    const totalH = mode === 'both' ? (h + 1) * size : h * size

    if (mode === 'both') {
      // 左上角占位
      svg += `<rect x="0" y="0" width="${size}" height="${size}" fill="#f3f4f6" stroke="#d1d5db" stroke-width="0.5"/>\n`
      // 列标尺
      const rulerFontSize = Math.max(8, Math.round(size * 0.4))
      for (let x = 0; x < w; x++) {
        const dx = (x + 1) * size
        svg += `<rect x="${dx}" y="0" width="${size}" height="${size}" fill="#f3f4f6" stroke="#d1d5db" stroke-width="0.5"/>\n`
        svg += `<text x="${dx + size / 2}" y="${size / 2}" font-family="monospace" font-size="${rulerFontSize}" fill="#6b7280" text-anchor="middle" dominant-baseline="central">${esc(String(x))}</text>\n`
      }
      // 行标尺
      for (let y = 0; y < h; y++) {
        const dy = (y + 1) * size
        svg += `<rect x="0" y="${dy}" width="${size}" height="${size}" fill="#f3f4f6" stroke="#d1d5db" stroke-width="0.5"/>\n`
        svg += `<text x="${size / 2}" y="${dy + size / 2}" font-family="monospace" font-size="${rulerFontSize}" fill="#6b7280" text-anchor="middle" dominant-baseline="central">${esc(String(y))}</text>\n`
      }
    } else if (mode === 'coords') {
      const coordFontSize = Math.max(6, Math.round(size * 0.35))
      const coordTexts = displayBeads.value.map(b => {
        const x = b.displayX * size
        const y = b.displayY * size
        return `<text x="${x + size / 2}" y="${y + size / 2}" font-family="monospace" font-weight="bold" font-size="${coordFontSize}" fill="#fff" text-anchor="middle" dominant-baseline="central" style="text-shadow:0 0 1px #000">${esc(`${b.displayX},${b.displayY}`)}</text>`
      }).join('\n')
      svg += beadRects + '\n' + coordTexts
    } else {
      svg += beadRects
    }

    const blob = new Blob([
      `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">\n${svg}\n</svg>`
    ], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const suffix = mode === 'both' ? '-ruler' : mode === 'coords' ? '-coords' : ''
    link.download = `pindoudou${suffix}-${Date.now()}.svg`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
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
    downloadPNG, downloadSVG, selectByColor,
  }
}
