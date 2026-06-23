import { ref, computed } from 'vue'

export type Locale = 'zh-CN' | 'en' | 'zh-TW'

const currentLocale = ref<Locale>((localStorage.getItem('pindoudou-locale') as Locale) || 'zh-CN')

export function useI18n() {
  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = (messages[currentLocale.value] as Record<string, string>)?.[key]
      ?? (messages['zh-CN'] as Record<string, string>)?.[key]
      ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }

  const locale = computed(() => currentLocale.value)

  function setLocale(l: Locale) {
    currentLocale.value = l
    localStorage.setItem('pindoudou-locale', l)
  }

  return { t, locale, setLocale }
}

// 全局单例
const { t: $t, locale, setLocale } = useI18n()
export { $t, locale, setLocale }

// ========== 语言包 ==========
const messages: Record<string, Record<string, string>> = {
  'zh-CN': {
    // App
    'app.title': '🧩拼豆图案生成器',
    'app.history': '📋 历史',
    'app.reupload': '🔄 重新上传',
    'app.close': '关闭',
    'app.loading': '正在解析图片...',
    'app.parseError': '解析图片失败',
    'app.loadingHistory': '正在加载历史记录...',
    'app.loadHistoryError': '加载历史记录失败: ',
    'app.importSuccess': '成功导入 {count} 条记录',
    'app.importError': '导入失败: ',
    'app.unknownError': '未知错误',
    'app.clearConfirm': '确定要清除非收藏的历史记录吗？',
    'app.clearFavWarning': '⚠️ {count} 条收藏记录将保留\n注意：数据仅存储在本地浏览器中\n清除浏览器数据将无法恢复！',
    'app.clearResult': '已清空 {deleted} 条记录，保留 {kept} 条收藏',
    'app.clearResultNoFav': '已清空 {deleted} 条记录',
    'app.copyFormat': '{name} ({hex}): {count}颗',
    'app.footer': '🧩 拼豆图案生成器',

    // Sidebar
    'sidebar.original': '🖼️ 原图',
    'sidebar.altOriginal': '原图',
    'sidebar.strategy': '🎯 颜色匹配策略',
    'sidebar.transparent': '🔲 透明填充',
    'sidebar.transparentCount': '{count} 颗',
    'sidebar.colorUsage': '🎨 颜色用量',
    'sidebar.collapse': '收起 ▲',
    'sidebar.expand': '全部 ▼',
    'sidebar.downloadPNG': '📥 下载 PNG',
    'sidebar.downloadSVG': '📐 下载 SVG 矢量图',
    'sidebar.copyPalette': '📋 复制颜色清单',

    // Upload
    'upload.title': '📤 上传图片',
    'upload.close': '✕',
    'upload.heading': '上传图片生成拼豆图案',
    'upload.formats': '支持 JPG、PNG、GIF、WEBP 格式',
    'upload.hint': '点击或拖拽图片到此处',
    'upload.privacy': '🔒 纯前端处理，图片不会上传到服务器',

    // History
    'history.title': '📋 历史记录',
    'history.export': '📤 导出({count})',
    'history.import': '📥 导入',
    'history.empty': '暂无历史记录',
    'history.emptyHint': '可点击 📥 导入之前导出的记录',
    'history.clear': '清空非收藏记录',
    'history.favCount': '⭐ {count} 条收藏',
    'history.fav': '收藏',
    'history.unfav': '取消收藏',

    // BeadGrid - Info
    'grid.size': '尺寸',
    'grid.total': '总颗数',
    'grid.colors': '颜色数',
    'grid.selected': '选中',
    'grid.realSize': '📏 实图',
    'grid.realSizeUnit': '{px}px/颗',

    // BeadGrid - Bead Size
    'grid.beadSize': '豆子尺寸',
    'grid.beadLarge': '5mm 大号',
    'grid.beadSmall': '2.6mm 小号',
    'grid.smallHint': '（小号≈{w}×{h}mm）',
    'grid.largeHint': '（大号≈{w}×{h}mm）',

    // BeadGrid - Width
    'grid.width': '拼豆宽度',
    'grid.widthUnit': '颗',

    // BeadGrid - Cell Size
    'grid.cellSize': '单元格',
    'grid.cellSmall': '小',
    'grid.cellSmallTip': '小尺寸（6px/格）',
    'grid.cellMedium': '中',
    'grid.cellMediumTip': '中尺寸（8px/格）',
    'grid.cellLarge': '大',
    'grid.cellLargeTip': '大尺寸（12px/格）',
    'grid.cellReal': '实图',
    'grid.cellRealTip': '按实际物理尺寸显示',

    // BeadGrid - Display Mode
    'grid.display': '展示',
    'grid.modeColor': '🎨 颜色',
    'grid.modeColorTip': '仅显示拼豆颜色',
    'grid.modeRuler': '📐 标尺',
    'grid.modeRulerTip': '颜色网格 + 坐标标尺',
    'grid.modeCoords': '🔢 坐标格',
    'grid.modeCoordsTip': '单元格显示坐标数字',

    // BeadGrid - Real Size Params
    'grid.screen': '屏幕',
    'grid.screenSize': '尺寸',
    'grid.screenWidth': '宽',
    'grid.screenHeight': '高',
    'grid.screenPPI': 'PPI≈{ppi}',
    'grid.screenDPR': ' DPR×{dpr}',
    'grid.screenIncomplete': '填写完整参数',
    'grid.presetAuto': '🔍自动',
    'grid.preset14FHD': '14"FHD',
    'grid.preset24FHD': '24"FHD',
    'grid.preset272K': '27"2K',
    'grid.preset274K': '27"4K',

    // BeadGrid - Color Editor
    'grid.editorBatch': '批量修改 ({count}颗)',
    'grid.editorSingle': '第 {index} 颗',

    // Density
    'density.fine': '精细',
    'density.medium': '适中',
    'density.coarse': '粗糙',

    // Strategies
    'strategy.euclideanRgb': 'RGB 欧几里得',
    'strategy.euclideanRgbDesc': 'RGB空间直接距离，速度快但对暗色区域偏差较大',
    'strategy.weightedRgb': '加权 RGB',
    'strategy.weightedRgbDesc': '提高绿色权重，模拟人眼敏感度，比纯RGB略好',
    'strategy.labEuclidean': 'Lab 欧几里得',
    'strategy.labEuclideanDesc': '转换到CIELAB感知均匀空间后计算距离，还原度大幅提升',
    'strategy.cie76': 'CIE76 ΔE',
    'strategy.cie76Desc': '经典ΔE76色差公式，Lab空间加权距离',
    'strategy.cie2000': 'CIEDE2000',
    'strategy.cie2000Desc': '业界金标准，最接近人眼感知，精度最高但计算量较大',

    // Notify defaults
    'notify.confirm': '确定',
    'notify.cancel': '取消',

    // Language
    'lang.switch': '🌐',
    'lang.zhCN': '简体中文',
    'lang.en': 'English',
    'lang.zhTW': '繁體中文',
  },

  'en': {
    'app.title': '🧩 Bead Pattern Generator',
    'app.history': '📋 History',
    'app.reupload': '🔄 Re-upload',
    'app.close': 'Close',
    'app.loading': 'Processing image...',
    'app.parseError': 'Failed to parse image',
    'app.loadingHistory': 'Loading history...',
    'app.loadHistoryError': 'Failed to load history: ',
    'app.importSuccess': 'Successfully imported {count} record(s)',
    'app.importError': 'Import failed: ',
    'app.unknownError': 'Unknown error',
    'app.clearConfirm': 'Clear all non-favorited history?',
    'app.clearFavWarning': '⚠️ {count} favorited item(s) will be kept\nNote: Data is stored only in your browser\nClearing browser data will lose all records!',
    'app.clearResult': 'Cleared {deleted} record(s), kept {kept} favorite(s)',
    'app.clearResultNoFav': 'Cleared {deleted} record(s)',
    'app.copyFormat': '{name} ({hex}): {count} beads',
    'app.footer': '🧩 Bead Pattern Generator',

    'sidebar.original': '🖼️ Original',
    'sidebar.altOriginal': 'Original',
    'sidebar.strategy': '🎯 Color Strategy',
    'sidebar.transparent': '🔲 Transparent Fill',
    'sidebar.transparentCount': '{count} beads',
    'sidebar.colorUsage': '🎨 Color Usage',
    'sidebar.collapse': 'Collapse ▲',
    'sidebar.expand': 'Expand ▼',
    'sidebar.downloadPNG': '📥 Download PNG',
    'sidebar.downloadSVG': '📐 Download SVG',
    'sidebar.copyPalette': '📋 Copy Palette',

    'upload.title': '📤 Upload Image',
    'upload.close': '✕',
    'upload.heading': 'Upload image to generate pattern',
    'upload.formats': 'Supports JPG, PNG, GIF, WEBP',
    'upload.hint': 'Click or drag image here',
    'upload.privacy': '🔒 Processed locally, image never leaves your device',

    'history.title': '📋 History',
    'history.export': '📤 Export({count})',
    'history.import': '📥 Import',
    'history.empty': 'No history yet',
    'history.emptyHint': 'Click 📥 Import to load exported records',
    'history.clear': 'Clear non-favorites',
    'history.favCount': '⭐ {count} favorited',
    'history.fav': 'Favorite',
    'history.unfav': 'Unfavorite',

    'grid.size': 'Size',
    'grid.total': 'Total Beads',
    'grid.colors': 'Colors',
    'grid.selected': 'Selected',
    'grid.realSize': '📏 Real',
    'grid.realSizeUnit': '{px}px/bead',

    'grid.beadSize': 'Bead Size',
    'grid.beadLarge': '5mm Large',
    'grid.beadSmall': '2.6mm Small',
    'grid.smallHint': '(small≈{w}×{h}mm)',
    'grid.largeHint': '(large≈{w}×{h}mm)',

    'grid.width': 'Bead Count',
    'grid.widthUnit': 'cols',

    'grid.cellSize': 'Cell',
    'grid.cellSmall': 'S',
    'grid.cellSmallTip': 'Small (6px/cell)',
    'grid.cellMedium': 'M',
    'grid.cellMediumTip': 'Medium (8px/cell)',
    'grid.cellLarge': 'L',
    'grid.cellLargeTip': 'Large (12px/cell)',
    'grid.cellReal': 'Real',
    'grid.cellRealTip': 'Display at actual physical size',

    'grid.display': 'View',
    'grid.modeColor': '🎨 Color',
    'grid.modeColorTip': 'Show bead colors only',
    'grid.modeRuler': '📐 Ruler',
    'grid.modeRulerTip': 'Grid with coordinate rulers',
    'grid.modeCoords': '🔢 Coords',
    'grid.modeCoordsTip': 'Cells show coordinate numbers',

    'grid.screen': 'Screen',
    'grid.screenSize': 'Size',
    'grid.screenWidth': 'W',
    'grid.screenHeight': 'H',
    'grid.screenPPI': 'PPI≈{ppi}',
    'grid.screenDPR': ' DPR×{dpr}',
    'grid.screenIncomplete': 'Fill all params',
    'grid.presetAuto': '🔍Auto',
    'grid.preset14FHD': '14"FHD',
    'grid.preset24FHD': '24"FHD',
    'grid.preset272K': '27"2K',
    'grid.preset274K': '27"4K',

    'grid.editorBatch': 'Batch edit ({count} beads)',
    'grid.editorSingle': 'Bead #{index}',

    'density.fine': 'Fine',
    'density.medium': 'Medium',
    'density.coarse': 'Coarse',

    'strategy.euclideanRgb': 'RGB Euclidean',
    'strategy.euclideanRgbDesc': 'Direct RGB distance, fast but less accurate in dark areas',
    'strategy.weightedRgb': 'Weighted RGB',
    'strategy.weightedRgbDesc': 'Higher green weight, simulates human eye sensitivity',
    'strategy.labEuclidean': 'Lab Euclidean',
    'strategy.labEuclideanDesc': 'CIELAB perceptually uniform space, much better accuracy',
    'strategy.cie76': 'CIE76 ΔE',
    'strategy.cie76Desc': 'Classic ΔE76 formula, weighted distance in Lab space',
    'strategy.cie2000': 'CIEDE2000',
    'strategy.cie2000Desc': 'Industry gold standard, closest to human perception',

    'notify.confirm': 'Confirm',
    'notify.cancel': 'Cancel',

    'lang.switch': '🌐',
    'lang.zhCN': '简体中文',
    'lang.en': 'English',
    'lang.zhTW': '繁體中文',
  },

  'zh-TW': {
    'app.title': '🧩拼豆圖案生成器',
    'app.history': '📋 歷史',
    'app.reupload': '🔄 重新上傳',
    'app.close': '關閉',
    'app.loading': '正在解析圖片...',
    'app.parseError': '解析圖片失敗',
    'app.loadingHistory': '正在載入歷史記錄...',
    'app.loadHistoryError': '載入歷史記錄失敗: ',
    'app.importSuccess': '成功匯入 {count} 筆記錄',
    'app.importError': '匯入失敗: ',
    'app.unknownError': '未知錯誤',
    'app.clearConfirm': '確定要清除非收藏的歷史記錄嗎？',
    'app.clearFavWarning': '⚠️ {count} 筆收藏記錄將保留\n注意：資料僅儲存在本機瀏覽器中\n清除瀏覽器資料將無法復原！',
    'app.clearResult': '已清空 {deleted} 筆記錄，保留 {kept} 筆收藏',
    'app.clearResultNoFav': '已清空 {deleted} 筆記錄',
    'app.copyFormat': '{name} ({hex}): {count}顆',
    'app.footer': '🧩 拼豆圖案生成器',

    'sidebar.original': '🖼️ 原圖',
    'sidebar.altOriginal': '原圖',
    'sidebar.strategy': '🎯 顏色匹配策略',
    'sidebar.transparent': '🔲 透明填充',
    'sidebar.transparentCount': '{count} 顆',
    'sidebar.colorUsage': '🎨 顏色用量',
    'sidebar.collapse': '收起 ▲',
    'sidebar.expand': '全部 ▼',
    'sidebar.downloadPNG': '📥 下載 PNG',
    'sidebar.downloadSVG': '📐 下載 SVG 向量圖',
    'sidebar.copyPalette': '📋 複製顏色清單',

    'upload.title': '📤 上傳圖片',
    'upload.close': '✕',
    'upload.heading': '上傳圖片生成拼豆圖案',
    'upload.formats': '支援 JPG、PNG、GIF、WEBP 格式',
    'upload.hint': '點擊或拖曳圖片到此處',
    'upload.privacy': '🔒 純前端處理，圖片不會上傳到伺服器',

    'history.title': '📋 歷史記錄',
    'history.export': '📤 匯出({count})',
    'history.import': '📥 匯入',
    'history.empty': '暫無歷史記錄',
    'history.emptyHint': '可點擊 📥 匯入之前匯出的記錄',
    'history.clear': '清空非收藏記錄',
    'history.favCount': '⭐ {count} 筆收藏',
    'history.fav': '收藏',
    'history.unfav': '取消收藏',

    'grid.size': '尺寸',
    'grid.total': '總顆數',
    'grid.colors': '顏色數',
    'grid.selected': '選中',
    'grid.realSize': '📏 實圖',
    'grid.realSizeUnit': '{px}px/顆',

    'grid.beadSize': '豆子尺寸',
    'grid.beadLarge': '5mm 大號',
    'grid.beadSmall': '2.6mm 小號',
    'grid.smallHint': '（小號≈{w}×{h}mm）',
    'grid.largeHint': '（大號≈{w}×{h}mm）',

    'grid.width': '拼豆寬度',
    'grid.widthUnit': '顆',

    'grid.cellSize': '儲存格',
    'grid.cellSmall': '小',
    'grid.cellSmallTip': '小尺寸（6px/格）',
    'grid.cellMedium': '中',
    'grid.cellMediumTip': '中尺寸（8px/格）',
    'grid.cellLarge': '大',
    'grid.cellLargeTip': '大尺寸（12px/格）',
    'grid.cellReal': '實圖',
    'grid.cellRealTip': '按實際物理尺寸顯示',

    'grid.display': '展示',
    'grid.modeColor': '🎨 顏色',
    'grid.modeColorTip': '僅顯示拼豆顏色',
    'grid.modeRuler': '📐 尺規',
    'grid.modeRulerTip': '顏色網格 + 座標尺規',
    'grid.modeCoords': '🔢 座標格',
    'grid.modeCoordsTip': '儲存格顯示座標數字',

    'grid.screen': '螢幕',
    'grid.screenSize': '尺寸',
    'grid.screenWidth': '寬',
    'grid.screenHeight': '高',
    'grid.screenPPI': 'PPI≈{ppi}',
    'grid.screenDPR': ' DPR×{dpr}',
    'grid.screenIncomplete': '填寫完整參數',
    'grid.presetAuto': '🔍自動',
    'grid.preset14FHD': '14"FHD',
    'grid.preset24FHD': '24"FHD',
    'grid.preset272K': '27"2K',
    'grid.preset274K': '27"4K',

    'grid.editorBatch': '批次修改 ({count}顆)',
    'grid.editorSingle': '第 {index} 顆',

    'density.fine': '精細',
    'density.medium': '適中',
    'density.coarse': '粗糙',

    'strategy.euclideanRgb': 'RGB 歐幾里得',
    'strategy.euclideanRgbDesc': 'RGB空間直接距離，速度快但對暗色區域偏差較大',
    'strategy.weightedRgb': '加權 RGB',
    'strategy.weightedRgbDesc': '提高綠色權重，模擬人眼敏感度，比純RGB略好',
    'strategy.labEuclidean': 'Lab 歐幾里得',
    'strategy.labEuclideanDesc': '轉換到CIELAB感知均勻空間後計算距離，還原度大幅提升',
    'strategy.cie76': 'CIE76 ΔE',
    'strategy.cie76Desc': '經典ΔE76色差公式，Lab空間加權距離',
    'strategy.cie2000': 'CIEDE2000',
    'strategy.cie2000Desc': '業界金標準，最接近人眼感知，精度最高但計算量較大',

    'notify.confirm': '確定',
    'notify.cancel': '取消',

    'lang.switch': '🌐',
    'lang.zhCN': '简体中文',
    'lang.en': 'English',
    'lang.zhTW': '繁體中文',
  },
}
