import { ref, computed } from 'vue'
import type { ColorStrategyId } from '@/types'
import { colorStrategies, strategyMap, defaultStrategyId, getMatchFn } from '@/utils/colorStrategies'
import { allBeadColors, findClosestBeadColorWith } from '@/utils/colors'

/**
 * 颜色匹配策略管理
 */
export function useColorStrategy() {
  const currentId = ref<ColorStrategyId>(defaultStrategyId)

  const currentStrategy = computed(() => strategyMap.get(currentId.value) ?? colorStrategies[0])

  const currentMatchFn = computed(() => getMatchFn(currentId.value))

  /** 使用当前策略匹配颜色 */
  function match(r: number, g: number, b: number) {
    return findClosestBeadColorWith(r, g, b, currentMatchFn.value)
  }

  function setStrategy(id: ColorStrategyId) {
    currentId.value = id
  }

  return {
    /** 当前策略 ID */
    currentId,
    /** 当前策略完整信息 */
    currentStrategy,
    /** 当前匹配函数 */
    currentMatchFn,
    /** 所有可用策略 */
    strategies: colorStrategies,
    /** 策略映射表 */
    strategyMap,
    /** 切换策略 */
    setStrategy,
    /** 使用当前策略匹配 */
    match,
  }
}
