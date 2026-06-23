<template>
  <div class="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
    <header class="bg-gradient-to-r from-primary to-primary/70 dark:from-primary-dark dark:to-primary text-white py-3 shadow-md">
      <div class="px-3 flex items-center gap-3">
        <h1 class="text-lg font-bold flex items-center gap-2 cursor-pointer" @click="$router.push('/')"><span class="text-xl">🧩</span>{{ $t('app.title') }}</h1>
        <span class="flex-1" />
        <div class="flex items-center gap-1">
          <button v-for="t in themes" :key="t.value"
            class="w-5 h-5 rounded-full border-2 transition"
            :class="currentTheme === t.value ? 'border-white scale-110' : 'border-white/30 hover:scale-105'"
            :style="{ background: t.color }"
            :title="t.label"
            @click="setTheme(t.value)" />
        </div>
        <button class="px-2 py-1.5 rounded-lg border border-white/30 bg-white/15 text-white text-xs hover:bg-white/25 transition" @click="toggleDark" :title="darkLabel">{{ darkIcon }}</button>
        <div class="relative">
          <button class="px-2 py-1.5 rounded-lg border border-white/30 bg-white/15 text-white text-xs hover:bg-white/25 transition" @click="showLangMenu = !showLangMenu">{{ $t('lang.switch') }}</button>
          <div v-if="showLangMenu" class="absolute right-0 top-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden z-50">
            <button v-for="l in locales" :key="l.value" class="block w-full px-4 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition" :class="locale === l.value ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-300'" @click="setLocale(l.value); showLangMenu = false">{{ l.label }}</button>
          </div>
        </div>
      </div>
    </header>

    <router-view />

    <footer class="text-center py-3 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {{ $t('app.footer') }} &copy; {{ new Date().getFullYear() }}
      <span class="mx-2">|</span>
      <a :href="termsUrl" target="_blank" class="hover:text-primary dark:hover:text-green-400 transition">{{ $t('terms.link') }}</a>
    </footer>

    <NotifyLayer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import NotifyLayer from '@/components/NotifyLayer.vue'
import { $t, locale, setLocale, type Locale } from '@/i18n'

const router = useRouter()
const showLangMenu = ref(false)

type ThemeName = 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'cyan'
const currentTheme = ref<ThemeName>((localStorage.getItem('pindoudou-theme') as ThemeName) || 'green')
const themes = [
  { value: 'green' as ThemeName, color: '#22B14C', label: '绿色' },
  { value: 'blue' as ThemeName, color: '#3B82F6', label: '蓝色' },
  { value: 'purple' as ThemeName, color: '#8B5CF6', label: '紫色' },
  { value: 'orange' as ThemeName, color: '#F97316', label: '橙色' },
  { value: 'pink' as ThemeName, color: '#EC4899', label: '粉色' },
  { value: 'cyan' as ThemeName, color: '#06B6D4', label: '青色' },
]

function setTheme(name: ThemeName) {
  currentTheme.value = name
  const colors: Record<ThemeName, string[]> = {
    green:  ['34 177 76', '26 142 60'],
    blue:   ['59 130 246', '37 99 235'],
    purple: ['139 92 246', '124 58 237'],
    orange: ['249 115 22', '234 88 12'],
    pink:   ['236 72 153', '219 39 119'],
    cyan:   ['6 182 212', '8 145 178'],
  }
  document.documentElement.style.setProperty('--color-primary', colors[name][0])
  document.documentElement.style.setProperty('--color-primary-dark', colors[name][1])
  localStorage.setItem('pindoudou-theme', name)
}

// Initialize theme
if (typeof window !== 'undefined') {
  const saved = (localStorage.getItem('pindoudou-theme') as ThemeName) || 'green'
  const colors: Record<ThemeName, string[]> = {
    green:  ['34 177 76', '26 142 60'],
    blue:   ['59 130 246', '37 99 235'],
    purple: ['139 92 246', '124 58 237'],
    orange: ['249 115 22', '234 88 12'],
    pink:   ['236 72 153', '219 39 119'],
    cyan:   ['6 182 212', '8 145 178'],
  }
  document.documentElement.style.setProperty('--color-primary', colors[saved][0])
  document.documentElement.style.setProperty('--color-primary-dark', colors[saved][1])
  currentTheme.value = saved
}

const locales: { label: string; value: Locale }[] = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en' },
  { label: '繁體中文', value: 'zh-TW' },
]

type DarkMode = 'system' | 'dark' | 'light'
const darkMode = ref<DarkMode>((localStorage.getItem('pindoudou-dark-mode') as DarkMode) || 'system')

const darkIcon = computed(() => ({ system: '💻', dark: '🌙', light: '☀️' }[darkMode.value]))
const darkLabel = computed(() => ({ system: '跟随系统', dark: '深色模式', light: '浅色模式' }[darkMode.value]))

function applyDark() {
  const isDarkNow = darkMode.value === 'dark' || (darkMode.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDarkNow)
}

function toggleDark() {
  const order: DarkMode[] = ['system', 'dark', 'light']
  const idx = order.indexOf(darkMode.value)
  darkMode.value = order[(idx + 1) % order.length]
  localStorage.setItem('pindoudou-dark-mode', darkMode.value)
  applyDark()
}

if (typeof window !== 'undefined') {
  applyDark()
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyDark)
}

const termsUrl = computed(() => {
  const href = router.resolve('/terms').href
  return href.startsWith('#') ? location.pathname + location.search + href : href
})
</script>
