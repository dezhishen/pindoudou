export interface BeadColor {
  name: string
  code: string
  r: number
  g: number
  b: number
  hex: string
}

// ========== 颜色匹配策略 ==========

/** 策略唯一标识 */
export type ColorStrategyId = 'euclidean-rgb' | 'weighted-rgb' | 'lab-euclidean' | 'cie76' | 'cie2000' | 'bfs-merge'

/** 颜色匹配策略描述 */
export interface ColorStrategyMeta {
  id: ColorStrategyId
  name: string
  description: string
}

/** 颜色匹配函数签名 */
export type ColorMatchFn = (r: number, g: number, b: number, palette: BeadColor[]) => BeadColor

/** 颜色匹配策略完整定义 */
export interface ColorStrategy extends ColorStrategyMeta {
  match: ColorMatchFn
  /** 可选：网格后处理（如 BFS 区域合并），在像素匹配完成后对整个网格执行 */
  postProcess?: (pixels: PixelInfo[], width: number, height: number, options?: Record<string, unknown>) => PixelInfo[]
  /** 可选：后处理的默认参数，供 UI 读取以渲染控件 */
  postProcessDefaults?: Record<string, unknown>
}

export interface PixelInfo {
  x: number
  y: number
  color: BeadColor
}

export interface RawPixel {
  x: number
  y: number
  r: number
  g: number
  b: number
}

export interface ColorCountInfo {
  color: BeadColor
  count: number
}

export interface ProcessResult {
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  pixels: RawPixel[]
}

export interface ProcessResponse {
  success: boolean
  message?: string
  data?: {
    result: ProcessResult
  }
}
