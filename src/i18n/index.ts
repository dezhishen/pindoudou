import { ref, computed } from 'vue'
import yamlRaw from './locales.yaml?raw'

export type Locale = 'zh-CN' | 'en' | 'zh-TW'

// ========== 内置 YAML 解析器（适配本项目的扁平键值结构） ==========
function parseYaml(raw: string): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {}
  let currentLocale = ''
  const lines = raw.split('\n')

  for (const line of lines) {
    // 跳过空行和注释
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    // 顶级 locale 键（如 "zh-CN:" "en:" "zh-TW:"）
    if (/^[\w-]+:\s*$/.test(trimmed)) {
      currentLocale = trimmed.replace(/:.*$/, '')
      result[currentLocale] = {}
      continue
    }

    if (!currentLocale) continue

    // 二级键值对: "  key: value" (两个空格缩进)
    const match = trimmed.match(/^([\w.]+):\s*(.*)$/)
    if (match) {
      let value = match[2]
      // 去除 YAML 引号
      if ((value.startsWith("'") && value.endsWith("'")) ||
          (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1)
      }
      result[currentLocale][match[1]] = value
    }
  }

  return result
}

const messages = parseYaml(yamlRaw)

// ========== i18n 核心 ==========
const currentLocale = ref<Locale>((localStorage.getItem('pindoudou-locale') as Locale) || 'zh-CN')

export function useI18n() {
  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = messages[currentLocale.value]?.[key]
      ?? messages['zh-CN']?.[key]
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
