/**
 * 颜色匹配策略 — 统一入口
 *
 * 使用 Vite import.meta.glob 自动发现 strategies/ 下的所有策略模块。
 * 新增策略只需在 strategies/ 下创建文件并调用 registerStrategy()，
 * 无需修改本文件或其他任何文件。
 */
import type { ColorStrategy, ColorStrategyId } from '@/types'
import { getStrategies as _getStrategies } from './registry'

// ============================================================
//  自动发现 & 注册
// ============================================================

/** 自动导入 strategies/ 下所有 .ts 文件以触发自注册 */
const _modules = import.meta.glob('./strategies/*.ts', { eager: true })
void _modules // 防止 tree-shake

// ============================================================
//  重导出注册中心 API
// ============================================================

export {
  registerStrategy,
  getStrategies,
  getStrategy,
  getMatchFn,
  getDefaultId,
} from './registry'

// ============================================================
//  兼容旧 API 的静态包装
// ============================================================

let _initDone = false

/** 所有策略列表（每次从注册中心实时读取） */
export const colorStrategies: ColorStrategy[] = []

/** 策略 ID → 策略 映射 */
export const strategyMap = new Map<ColorStrategyId, ColorStrategy>()

/** 默认策略 ID */
export let defaultStrategyId: ColorStrategyId = 'lab-euclidean'

/**
 * 从注册中心同步到兼容层静态变量。
 * 应在 App 启动时调用一次。
 */
export function initStrategies(): void {
  if (_initDone) return
  _initDone = true

  const list = _getStrategies()
  colorStrategies.length = 0
  colorStrategies.push(...list)

  strategyMap.clear()
  for (const s of list) {
    strategyMap.set(s.id as ColorStrategyId, s)
  }

  if (list.length > 0 && !strategyMap.has(defaultStrategyId)) {
    defaultStrategyId = list[0].id as ColorStrategyId
  }
}
