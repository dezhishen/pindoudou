export interface BeadColor {
  name: string
  code: string
  r: number
  g: number
  b: number
  hex: string
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
