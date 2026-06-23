import type { ColorStrategy } from '@/types'

/**
 * 颜色匹配策略注册中心
 *
 * 各策略模块在顶层调用 register() 即可完成注册，
 * 无需修改本文件或其他主文件。
 */
const registry = new Map<string, ColorStrategy>()

/**
 * 注册一个颜色匹配策略（由各策略文件在模块顶层调用）
 */
export function registerStrategy(strategy: ColorStrategy): void {
  if (registry.has(strategy.id)) {
    console.warn(`[ColorStrategy] 策略 "${strategy.id}" 已存在，将被覆盖`)
  }
  registry.set(strategy.id, strategy)
}

/** 获取所有已注册策略 */
export function getStrategies(): ColorStrategy[] {
  return [...registry.values()]
}

/** 按 ID 获取策略 */
export function getStrategy(id: string): ColorStrategy | undefined {
  return registry.get(id)
}

/** 获取策略的匹配函数 */
export function getMatchFn(id: string): ColorStrategy['match'] {
  return registry.get(id)?.match ?? getStrategies()[0]?.match ?? fallbackMatch
}

/** 默认策略 ID（注册中心里第一个注册的） */
export function getDefaultId(): string {
  return getStrategies()[0]?.id ?? 'euclidean-rgb'
}

/** 兜底匹配函数（不应走到这里） */
function fallbackMatch() {
  throw new Error('[ColorStrategy] 没有任何颜色匹配策略已注册')
}
