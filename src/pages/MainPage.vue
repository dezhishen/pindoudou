<template>
  <main class="flex-1 py-2 px-3 w-full">
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
      {{ error }}
      <div class="mt-3"><button class="btn btn-outline" @click="error = ''">{{ $t('app.close') }}</button></div>
    </div>

    <!-- Tab 切换 -->
    <div class="flex mb-3 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 w-fit">
      <button
        class="px-4 py-1.5 rounded-lg text-xs font-medium transition"
        :class="tabMode === 'image' ? 'bg-white dark:bg-gray-700 text-primary dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
        @click="tabMode = 'image'"
      >📷 {{ $t('tab.image') }}</button>
      <button
        class="px-4 py-1.5 rounded-lg text-xs font-medium transition"
        :class="tabMode === 'text' ? 'bg-white dark:bg-gray-700 text-primary dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
        @click="tabMode = 'text'"
      >🔤 {{ $t('tab.text') }}</button>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-2 items-start relative">
      <div v-if="loading" class="absolute inset-0 z-30 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 rounded-2xl">
        <div class="flex flex-col items-center gap-3">
          <div class="w-10 h-10 border-4 border-gray-200 border-t-primary dark:border-gray-600 dark:border-t-green-400 rounded-full animate-spin" />
          <p class="text-sm text-gray-500 dark:text-gray-300">{{ loadingText }}</p>
        </div>
      </div>
      <div class="flex flex-col gap-3 sticky top-4">
        <!-- 图片模式：上传/预览 -->
        <div v-if="tabMode === 'image'" class="card">
          <template v-if="imagePreviewUrl">
            <h3 class="text-sm font-medium mb-2">🖼️ {{ $t('sidebar.original') }}</h3>
            <div class="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
              <img :src="imagePreviewUrl" :alt="$t('sidebar.altOriginal')" class="max-w-full h-auto block" />
            </div>
            <button v-if="originalFile" class="btn btn-outline btn-block mt-2 text-xs" @click="showCropper = true">{{ $t('crop.btn') }}</button>
          </template>
          <template v-else>
            <ImageUploader @file-selected="handleFile" />
          </template>
        </div>

        <!-- 文字模式：输入区 -->
        <div v-else class="card">
          <h3 class="text-sm font-medium mb-2">🔤 {{ $t('tab.text') }}</h3>

          <!-- 文字渲染预览按钮 -->
          <button v-if="textPreviewUrl" class="text-[10px] text-purple-500 border border-dashed border-purple-300 dark:border-purple-700 rounded px-2 py-0.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition mb-2" @click="showTextPreview = true">🔍 {{ $t('text.preview') }}</button>
          <textarea
            v-model="textInput"
            class="w-full h-20 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none placeholder-gray-300 dark:placeholder-gray-500"
            :placeholder="$t('text.placeholder')"
            @input="onTextChange"
          ></textarea>

          <!-- 逐字颜色预览条 -->
          <div v-if="textChars.length > 0" class="flex flex-wrap gap-0.5 mt-2">
            <button
              v-for="(ch, i) in textChars" :key="i"
              class="w-6 h-6 rounded text-[10px] font-medium border-2 transition cursor-pointer flex items-center justify-center"
              :class="selectedCharIndex === i ? 'border-primary scale-110 shadow-sm' : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'"
              :style="{ background: getCharColor(i), color: isLightColor(getCharColor(i)) ? '#000' : '#fff' }"
              :title="$t('text.charColorTip', { index: i + 1 })"
              @click="selectedCharIndex = i"
            >{{ ch }}</button>
          </div>

          <!-- 颜色模式切换 -->
          <div class="flex items-center gap-2 mt-2">
            <span class="text-[10px] text-gray-400">{{ $t('text.colorMode') }}</span>
            <div class="flex bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 overflow-hidden">
              <button class="px-2 py-0.5 text-[10px] transition cursor-pointer"
                :class="textColorMode === 'gradient' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'"
                @click="textColorMode = 'gradient'">{{ $t('text.gradient') }}</button>
              <button class="px-2 py-0.5 text-[10px] transition cursor-pointer"
                :class="textColorMode === 'solid' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'"
                @click="textColorMode = 'solid'">{{ $t('text.solid') }}</button>
            </div>
          </div>

          <!-- 渐变颜色选择 -->
          <div v-if="textColorMode === 'gradient'" class="flex items-center gap-2 mt-2 flex-wrap">
            <div class="flex items-center gap-1">
              <input type="color" v-model="textGradientStart" class="w-5 h-5 rounded cursor-pointer border-0 p-0" />
              <span class="text-[10px] text-gray-400">→</span>
              <input type="color" v-model="textGradientEnd" class="w-5 h-5 rounded cursor-pointer border-0 p-0" />
            </div>
            <div class="flex gap-1">
              <button v-for="p in gradientPresets" :key="p.label"
                class="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 cursor-pointer hover:scale-110 transition"
                :style="{ background: `linear-gradient(to right, ${p.start}, ${p.end})` }"
                :title="p.label"
                @click="textGradientStart = p.start; textGradientEnd = p.end"
              />
            </div>
          </div>

          <!-- 纯色：当前选中字的颜色 -->
          <div v-if="textColorMode === 'solid' && selectedCharIndex !== null" class="flex items-center gap-1 mt-2">
            <span class="text-[10px] text-gray-400">{{ $t('text.charColor', { index: selectedCharIndex + 1 }) }}</span>
            <input type="color" :value="getCharColor(selectedCharIndex)" @input="setCharColor(selectedCharIndex, ($event.target as HTMLInputElement).value)" class="w-5 h-5 rounded cursor-pointer border-0 p-0" />
            <div class="flex gap-0.5 ml-1">
              <button v-for="c in solidColorPresets" :key="c"
                class="w-4 h-4 rounded-sm border border-gray-300 dark:border-gray-600 cursor-pointer hover:scale-110 transition"
                :style="{ background: c }"
                @click="setCharColor(selectedCharIndex, c)"
              />
            </div>
          </div>

          <!-- 字号 + 字体 -->
          <div class="flex items-center gap-2 mt-2">
            <span class="text-[10px] text-gray-400 whitespace-nowrap">{{ $t('text.fontSize') }}</span>
            <select v-model.number="textFontSize" class="px-2 py-1 text-[10px] border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-gray-200 outline-none">
              <option :value="16">16px</option>
              <option :value="24">24px</option>
              <option :value="32">32px</option>
              <option :value="48">48px</option>
              <option :value="64">64px</option>
              <option :value="96">96px</option>
              <option :value="128">128px</option>
            </select>
            <span class="text-[10px] text-gray-400 whitespace-nowrap">{{ $t('text.font') }}</span>
            <select v-model="textFontFamily" class="px-2 py-1 text-[10px] border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-gray-200 outline-none flex-1 min-w-0">
              <option v-for="f in fontList" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
          </div>

          <!-- 每字格数 -->
          <div class="flex items-center gap-2 mt-2">
            <span class="text-[10px] text-gray-400">{{ $t('text.charCellSize') }}</span>
            <input type="number" :min="0" :max="128" v-model.number="textCharCellSize" placeholder="auto"
              class="w-14 px-1.5 py-0.5 text-[10px] text-center border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-gray-200 outline-none focus:border-primary" />
            <span class="text-[10px] text-gray-400">{{ $t('text.charCellUnit') }}</span>
          </div>

          <button class="btn btn-primary btn-block mt-3 text-xs" :disabled="!textInput.trim()" @click="generateTextBeads">🔤 {{ $t('text.generate') }}</button>
        </div>

        <!-- 重新上传 / 历史（共用） -->
        <div class="flex gap-1.5">
          <button v-if="tabMode === 'image'" class="btn btn-outline flex-1 text-xs" @click="resetAll">🔄 {{ $t('app.reupload') }}</button>
          <button v-else class="btn btn-outline flex-1 text-xs" @click="resetAll">🔄 {{ $t('text.clear') }}</button>
          <button class="btn btn-outline px-2.5 text-xs" @click="openHistory" :title="$t('app.history')">📋</button>
        </div>
        <!-- 图片模式：颜色策略 -->
        <div v-if="tabMode === 'image'" class="card">
          <h3 class="text-sm font-medium mb-2">🎯 {{ $t('sidebar.strategy') }}</h3>
          <div class="flex flex-col gap-1">
            <label v-for="s in strategies" :key="s.id"
              class="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition text-xs"
              :class="currentId === s.id ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border border-gray-100 dark:bg-gray-700/50 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'"
            >
              <input type="radio" :value="s.id" :checked="currentId === s.id"
                class="accent-primary"
                @change="currentId === s.id || setStrategy(s.id)" />
              <div class="flex flex-col min-w-0">
                <span class="font-medium">{{ $t('strategy.' + s.id) }}</span>
                <span class="text-[10px] text-gray-400 leading-tight">{{ $t('strategy.' + s.id + 'Desc') }}</span>
              </div>
            </label>
          </div>
          <!-- BFS 阈值滑块：仅当策略支持 postProcessDefaults 时显示 -->
          <div v-if="currentPostProcessDefaults && currentPostProcessDefaults.threshold !== undefined" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-gray-500">{{ $t('strategy.bfsThreshold') }}</span>
              <span class="text-xs font-mono" :class="bfsThresholdValue <= 0 ? 'text-green-500' : 'text-primary'">
                {{ bfsThresholdValue <= 0 ? $t('strategy.bfsAuto') : bfsThresholdValue.toFixed(1) }}
              </span>
            </div>
            <input
              type="range"
              :min="0"
              :max="30"
              :step="0.5"
              :value="bfsThresholdValue"
              @input="onBfsThresholdChange"
              class="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer dark:bg-gray-600 accent-primary"
            />
            <div class="flex justify-between text-[10px] text-gray-300 mt-0.5">
              <span>{{ $t('strategy.bfsAuto') }}</span>
              <span>30</span>
            </div>
          </div>
        </div>
        <div v-if="tabMode === 'image' && transparentIndices.length > 0" class="card">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium">🔲 {{ $t('sidebar.transparent') }}</h3>
            <span class="text-xs text-gray-400">{{ $t('sidebar.transparentCount', { count: transparentIndices.length }) }}</span>
          </div>
          <div class="flex gap-1.5 flex-wrap">
            <button v-for="c in fillPresets" :key="c"
              class="w-8 h-8 rounded-lg border-2 transition cursor-pointer"
              :class="fillColor === c ? 'border-primary scale-110' : 'border-gray-200 hover:border-gray-400'"
              :style="{ background: c }"
              @click="changeFillColor(c)" />
            <label class="relative w-8 h-8 rounded-lg border-2 border-gray-200 overflow-hidden cursor-pointer hover:border-gray-400 flex items-center justify-center text-xs text-gray-400">
              <input type="color" class="absolute inset-0 opacity-0 cursor-pointer" :value="fillColor" @input="changeFillColor(($event.target as HTMLInputElement).value)" />
              🎨
            </label>
          </div>
        </div>
        <div v-if="result" class="card">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium">🎨 {{ $t('sidebar.colorUsage') }}</h3>
            <button class="text-xs text-gray-400 border border-gray-200 rounded px-2 py-0.5 hover:border-primary hover:text-primary transition dark:border-gray-600 dark:hover:border-green-400 dark:hover:text-green-400" @click="drawerOpen = !drawerOpen">{{ drawerOpen ? $t('sidebar.collapse') : $t('sidebar.expand') }}</button>
          </div>
          <div class="flex flex-wrap gap-1">
            <div v-for="c in (colorInfo || []).slice(0, drawerOpen ? undefined : 8)" :key="c.color.code" class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 cursor-pointer hover:bg-green-50 text-xs" :title="$t('app.copyFormat', { name: c.color.name, hex: c.color.hex, count: c.count })" @click="selectColorInGrid(c.color.code)">
              <span class="w-3 h-3 rounded-sm border border-black/10 flex-shrink-0" :style="{ background: c.color.hex }" />
              <span class="font-semibold text-primary text-xs">{{ c.count }}</span>
            </div>
          </div>
          <div v-if="drawerOpen && colorInfo" class="mt-2 flex flex-col gap-0.5 max-h-44 overflow-y-auto">
            <div v-for="c in colorInfo" :key="c.color.code" class="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 text-xs" @click="selectColorInGrid(c.color.code)">
              <span class="w-3 h-3 rounded-sm border border-black/10" :style="{ background: c.color.hex }" />
              <span class="flex-1 font-medium">{{ c.color.name }}</span>
              <span class="text-gray-400">{{ c.color.hex }}</span>
              <span class="font-semibold text-primary">{{ c.count }}颗</span>
            </div>
          </div>
        </div>
        <div v-if="result" class="card flex flex-col gap-2">
          <div class="relative flex">
            <button class="btn btn-primary flex-1 rounded-r-none justify-center" @click="downloadGrid">
              📥 {{ $t('sidebar.downloadPNG') }}
            </button>
            <button class="btn btn-primary rounded-l-none border-l border-white/30 px-2.5" @click="showDownloadMenu = !showDownloadMenu">
              <span class="text-[10px]">▼</span>
            </button>
            <div v-if="showDownloadMenu" class="fixed inset-0 z-40" @click="showDownloadMenu = false" />
            <div v-if="showDownloadMenu" class="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <button class="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2 transition" @click="downloadSVGGrid(); showDownloadMenu = false">
                📐 {{ $t('sidebar.downloadSVG') }}
              </button>
            </div>
          </div>
          <button class="btn btn-outline btn-block" @click="copyPaletteText">📋 {{ $t('sidebar.copyPalette') }}</button>
          <button class="btn btn-outline btn-block text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20" @click="downloadCyber">🌆 下载赛博风 PNG</button>
        </div>
      </div>
      <div class="min-w-0">
        <div class="bg-white rounded-2xl shadow-sm p-2 dark:bg-gray-800">
          <BeadGrid ref="gridRef" :pixels="result?.pixels ?? []" :cols="result?.width ?? 0" :rows="result?.height ?? 0" :strategy-id="currentId" :strategy-options="strategyOptions" @update-info="onGridInfo" />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <ImageCropper
        v-if="showCropper && imagePreviewUrl"
        :src="imagePreviewUrl"
        @confirm="onCropConfirm"
        @cancel="onCropCancel"
      />
    </Teleport>

    <Teleport to="body">
      <div v-if="showTextPreview && textPreviewUrl" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showTextPreview = false">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl mx-4 max-h-[85vh] overflow-auto p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold dark:text-white">🔍 {{ $t('text.preview') }}</h3>
            <button class="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 text-lg transition" @click="showTextPreview = false">✕</button>
          </div>
          <img :src="textPreviewUrl" alt="text preview" class="block" style="image-rendering: pixelated" />
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showUploadModal = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden dark:bg-gray-800">
          <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
            <h3 class="text-base font-bold dark:text-white">📤 {{ $t('upload.title') }}</h3>
            <button class="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg transition" @click="showUploadModal = false">{{ $t('upload.close') }}</button>
          </div>
          <div class="p-4">
            <ImageUploader @file-selected="onModalUpload" />
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showHistory" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showHistory = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col overflow-hidden dark:bg-gray-800">
          <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <h3 class="text-base font-bold dark:text-white">📋 {{ $t('history.title') }}</h3>
            <div class="flex items-center gap-2">
              <button v-if="checkedIds.size > 0" class="text-[10px] px-2 py-1 rounded bg-primary text-white hover:bg-primary-dark transition" @click="exportChecked">📤 {{ $t('history.export', { count: checkedIds.size }) }}</button>
              <label class="text-[10px] px-2 py-1 rounded border border-gray-300 text-gray-500 hover:border-primary hover:text-primary transition cursor-pointer">
                📥 {{ $t('history.import') }}
                <input type="file" accept=".json" class="hidden" @change="onImportFile" />
              </label>
              <button class="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg transition" @click="showHistory = false">{{ $t('upload.close') }}</button>
            </div>
          </div>
          <div class="p-4 overflow-y-auto flex-1">
            <div v-if="historyList.length === 0" class="text-center py-10 text-gray-400">
              <span class="text-4xl block mb-2">📭</span>
              <p class="text-sm">{{ $t('history.empty') }}</p>
              <p class="text-xs mt-1">{{ $t('history.emptyHint') }}</p>
            </div>
            <div v-else class="flex flex-col gap-2">
              <div v-for="h in historyList" :key="h.id"
                class="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-primary/30 transition group dark:border-gray-700 dark:hover:border-green-400/30">
                <input type="checkbox" :checked="checkedIds.has(h.id)" class="w-3.5 h-3.5 shrink-0 accent-primary"
                  @click.stop @change="toggleCheck(h.id)" />
                <img :src="h.thumbnail" class="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-gray-50 shrink-0 cursor-pointer" @click="loadHistory(h.id); showHistory = false" />
                <div class="flex-1 min-w-0 cursor-pointer" @click="loadHistory(h.id); showHistory = false">
                  <p class="text-xs font-medium truncate">{{ h.fileName }}</p>
                  <p class="text-[10px] text-gray-400">{{ h.width }}×{{ h.height }} · {{ formatTime(h.timestamp) }}</p>
                </div>
                <span class="text-[10px] text-gray-400 shrink-0">{{ h.originalWidth }}×{{ h.originalHeight }}</span>
                <button class="text-sm shrink-0 transition opacity-40 group-hover:opacity-100"
                  :class="h.favorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'"
                  :title="h.favorite ? $t('history.unfav') : $t('history.fav')"
                  @click.stop="toggleFav(h.id)">{{ h.favorite ? '⭐' : '☆' }}</button>
              </div>
            </div>
          </div>
          <div v-if="historyList.length > 0" class="px-4 py-2 border-t border-gray-100 dark:border-gray-700 shrink-0 flex items-center justify-between">
            <button class="text-xs text-red-400 hover:text-red-600 transition" @click="clearAllHistory">{{ $t('history.clear') }}</button>
            <span v-if="historyFavCount > 0" class="text-[10px] text-yellow-500">⭐ {{ $t('history.favCount', { count: historyFavCount }) }}</span>
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import ImageUploader from '@/components/ImageUploader.vue'
import ImageCropper from '@/components/ImageCropper.vue'
import BeadGrid from '@/components/BeadGrid.vue'
import { processImage } from '@/utils/imageProcessor'
import { renderTextToPixels, FONT_LIST, GRADIENT_PRESETS, SOLID_COLOR_PRESETS } from '@/utils/textProcessor'
import { saveHistory, getHistoryList, getHistoryRecord, clearHistory, toggleFavorite, exportRecords, importRecords, type HistoryMeta } from '@/utils/history'
import { showToast, showConfirm } from '@/composables/useNotify'
import { $t } from '@/i18n'
import type { ProcessResult, ColorStrategyId } from '@/types'
import type { BeadColor } from '@/types'
import { useColorStrategy } from '@/composables/useColorStrategy'

const loading = ref(false)
const loadingText = ref('')
const error = ref('')
const tabMode = ref<'image' | 'text'>('image')
const result = ref<ProcessResult | null>(null)
const imagePreviewUrl = ref('')
const drawerOpen = ref(false)
const showDownloadMenu = ref(false)
const showUploadModal = ref(false)
const showHistory = ref(false)
const showCropper = ref(false)
const showTextPreview = ref(false)
const historyList = ref<HistoryMeta[]>([])
const checkedIds = ref<Set<number>>(new Set())
const historyFavCount = ref(0)
let currentFileName = ''
const originalFile = ref<File | null>(null)

// ========== 文字模式 ==========
const textInput = ref('')
const textFontFamily = ref(FONT_LIST[0].value)
const textFontSize = ref(48)
const textCharCellSize = ref(0)  // 0=自动
const textPreviewUrl = ref('')
const textColorMode = ref<'gradient' | 'solid'>('gradient')
const textGradientStart = ref('#FF0000')
const textGradientEnd = ref('#0066FF')
const textCharColors = ref<Record<number, string>>({})
const selectedCharIndex = ref<number | null>(null)
const fontList = FONT_LIST
const gradientPresets = GRADIENT_PRESETS
const solidColorPresets = SOLID_COLOR_PRESETS

const textChars = computed(() => [...textInput.value].filter(ch => ch !== '\n' && ch !== '\r'))
const charCount = computed(() => textChars.value.length)

function onTextChange() {
  textCharColors.value = {}
  selectedCharIndex.value = null
}

function getCharColor(index: number): string {
  if (textCharColors.value[index]) return textCharColors.value[index]
  if (textColorMode.value === 'gradient') {
    const t = textChars.value.length > 1 ? index / (textChars.value.length - 1) : 0
    return interpolateHex(textGradientStart.value, textGradientEnd.value, t)
  }
  return '#000000'
}

function setCharColor(index: number, color: string) {
  textCharColors.value = { ...textCharColors.value, [index]: color }
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150
}

function interpolateHex(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16)
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16)
  const r = Math.round(r1 + (r2 - r1) * t), g = Math.round(g1 + (g2 - g1) * t), b = Math.round(b1 + (b2 - b1) * t)
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

async function generateTextBeads() {
  const rawText = textInput.value.trim()
  if (!rawText) return

  // 标准化换行符
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  loading.value = true; loadingText.value = $t('app.loading'); error.value = ''
  try {
    const { pixels: rawPixels, width, height } = await renderTextToPixels({
      text, fontFamily: textFontFamily.value, fontSize: textCharCellSize.value || textFontSize.value,
      charColors: textCharColors.value,
      gradient: textColorMode.value === 'gradient'
        ? { start: textGradientStart.value, end: textGradientEnd.value }
        : undefined,
      defaultColor: '#000000', bgColor: '#FFFFFF',
    })

    result.value = { width, height, originalWidth: width, originalHeight: height, pixels: rawPixels }
    transparentIndices.value = []
    imagePreviewUrl.value = ''
    currentFileName = `text-${text.slice(0, 10)}`

    // 生成文字预览图
    const previewCanvas = document.createElement('canvas')
    previewCanvas.width = width; previewCanvas.height = height
    const pctx = previewCanvas.getContext('2d')!
    for (const p of rawPixels) {
      pctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`
      pctx.fillRect(p.x, p.y, 1, 1)
    }
    if (textPreviewUrl.value) URL.revokeObjectURL(textPreviewUrl.value)
    textPreviewUrl.value = previewCanvas.toDataURL('image/png')
    originalFile.value = null

    // 生成缩略图并保存历史
    const thumbCanvas = document.createElement('canvas')
    const maxThumb = 200
    const scale = Math.min(1, maxThumb / Math.max(width, height))
    thumbCanvas.width = Math.round(width * scale)
    thumbCanvas.height = Math.round(height * scale)
    const thumbCtx = thumbCanvas.getContext('2d')!
    for (const p of rawPixels) {
      thumbCtx.fillStyle = `rgb(${p.r},${p.g},${p.b})`
      thumbCtx.fillRect(Math.round(p.x * scale), Math.round(p.y * scale), Math.ceil(scale), Math.ceil(scale))
    }
    const thumb = thumbCanvas.toDataURL('image/png')

    await saveHistory({
      type: 'text',
      thumbnail: thumb, fileName: currentFileName,
      originalWidth: width, originalHeight: height,
      width, height,
      pixelsJson: JSON.stringify(result.value.pixels),
      transparentIndicesJson: JSON.stringify([]),
      strategyId: 'euclidean-rgb', fillColor: '#FFFFFF',
    })
  } catch (err: any) { error.value = (err.message || $t('app.unknownError')) }
  finally { loading.value = false }
}

function toggleCheck(id: number) {
  const s = new Set(checkedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  checkedIds.value = s
}

const gridRef = ref<InstanceType<typeof BeadGrid>>()
const colorInfo = ref<{ color: BeadColor; count: number }[]>([])
const { currentId, strategies, setStrategy, currentPostProcessDefaults } = useColorStrategy()

// ---- 策略后处理选项（如 BFS 阈值） ----
const strategyOptions = ref<Record<string, unknown>>({})

/** 当前 BFS 阈值显示值：<=0 表示自动 */
const bfsThresholdValue = computed(() => {
  const v = strategyOptions.value.threshold
  return v != null ? Number(v) : -1
})

function onBfsThresholdChange(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  strategyOptions.value = { ...strategyOptions.value, threshold: val }
}

// 策略切换时，将后处理选项重置为策略默认值
watch(currentId, () => {
  const defaults = currentPostProcessDefaults.value
  strategyOptions.value = defaults ? { ...defaults } : {}
})

// 首次加载时初始化
if (currentPostProcessDefaults.value) {
  strategyOptions.value = { ...currentPostProcessDefaults.value }
}
const transparentIndices = ref<number[]>([])
const fillColor = ref('#FFFFFF')
const fillPresets = ['#FFFFFF', '#EEEEEE', '#CCCCCC', '#000000', '#FF0000', '#00AAFF', '#FFD700']

async function handleFile(file: File) {
  currentFileName = file.name
  originalFile.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)
  // 上传后立即弹出裁剪窗口，由用户决定裁剪或跳过
  showCropper.value = true
}

function onModalUpload(file: File) {
  showUploadModal.value = false
  handleFile(file)
}

async function onCropConfirm(blob: Blob) {
  showCropper.value = false
  // 用裁剪后的 blob 更新预览
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  imagePreviewUrl.value = URL.createObjectURL(blob)
  await processAndSetResult(blob)
}

async function onCropCancel() {
  showCropper.value = false
  // 用户跳过裁剪，直接用原图处理
  if (originalFile.value) {
    await processAndSetResult(originalFile.value)
  }
}

async function processAndSetResult(file: File | Blob) {
  loading.value = true; loadingText.value = $t('app.loading'); error.value = ''
  try {
    const data = await processImage(file, 256, fillColor.value, currentId.value)
    result.value = {
      width: data.width, height: data.height,
      originalWidth: data.originalWidth, originalHeight: data.originalHeight,
      pixels: data.pixels.map(p => ({ x: p.x, y: p.y, r: p.r, g: p.g, b: p.b })),
    }
    transparentIndices.value = data.transparentIndices
    const thumb = await createThumbnail(file)
    if (thumb) {
      await saveHistory({
        type: 'image',
        thumbnail: thumb, fileName: currentFileName,
        originalWidth: data.originalWidth, originalHeight: data.originalHeight,
        width: data.width, height: data.height,
        pixelsJson: JSON.stringify(result.value!.pixels),
        transparentIndicesJson: JSON.stringify(data.transparentIndices),
        strategyId: currentId.value, fillColor: fillColor.value,
      })
    }
  } catch (err: any) { error.value = (err.message || $t('app.unknownError')) }
  finally { loading.value = false }
}

function createThumbnail(file: File | Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxSize = 200
      let w = img.width, h = img.height
      if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize } }
      else { if (h > maxSize) { w = w * maxSize / h; h = maxSize } }
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w); canvas.height = Math.round(h)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

function resetAll() {
  loading.value = false; error.value = ''; result.value = null; drawerOpen.value = false
  transparentIndices.value = []
  if (imagePreviewUrl.value) { URL.revokeObjectURL(imagePreviewUrl.value); imagePreviewUrl.value = '' }
  currentFileName = ''
  originalFile.value = null
  showCropper.value = false
  showTextPreview.value = false
  // 文字模式也清空
  textInput.value = ''
  textCharColors.value = {}
  selectedCharIndex.value = null
  if (textPreviewUrl.value) { URL.revokeObjectURL(textPreviewUrl.value); textPreviewUrl.value = '' }
  if (tabMode.value === 'text') return // 文字模式只需清空，不弹上传框
  showUploadModal.value = true
}

async function openHistory() {
  historyList.value = await getHistoryList(tabMode.value === 'text' ? 'text' : 'image')
  historyFavCount.value = historyList.value.filter(h => h.favorite).length
  checkedIds.value = new Set()
  showHistory.value = true
}

async function toggleFav(id: number) {
  const fav = await toggleFavorite(id)
  const item = historyList.value.find(h => h.id === id)
  if (item) item.favorite = fav
  historyFavCount.value = historyList.value.filter(h => h.favorite).length
}

async function exportChecked() {
  if (checkedIds.value.size === 0) return
  await exportRecords([...checkedIds.value])
}

async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const count = await importRecords(file)
    showToast($t('app.importSuccess', { count }), 'success')
    await openHistory()
  } catch (err: any) {
    showToast($t('app.importError') + (err.message || $t('app.unknownError')), 'error')
  }
  input.value = ''
}

async function loadHistory(id: number) {
  const record = await getHistoryRecord(id)
  if (!record) return
  loading.value = true; loadingText.value = $t('app.loadingHistory'); error.value = ''
  try {
    imagePreviewUrl.value = record.thumbnail
    currentFileName = record.fileName
    currentId.value = record.strategyId as ColorStrategyId
    fillColor.value = record.fillColor
    result.value = {
      width: record.width, height: record.height,
      originalWidth: record.originalWidth, originalHeight: record.originalHeight,
      pixels: JSON.parse(record.pixelsJson),
    }
    transparentIndices.value = JSON.parse(record.transparentIndicesJson)
  } catch (err: any) { error.value = $t('app.loadHistoryError') + err.message }
  finally { loading.value = false }
}

async function clearAllHistory() {
  const favCount = historyList.value.filter(h => h.favorite).length
  let msg = $t('app.clearConfirm')
  if (favCount > 0) msg += '\n\n' + $t('app.clearFavWarning', { count: favCount })
  const ok = await showConfirm({ text: msg, type: 'danger' })
  if (!ok) return
  const result = await clearHistory()
  showToast(favCount > 0 ? $t('app.clearResult', { deleted: result.deleted, kept: result.kept }) : $t('app.clearResultNoFav', { deleted: result.deleted }), 'success')
  await openHistory()
}

function formatTime(ts: number) {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function changeFillColor(color: string) {
  fillColor.value = color
  if (!result.value || !result.value.pixels.length) return
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const newPixels = [...result.value.pixels]
  transparentIndices.value.forEach(idx => { newPixels[idx] = { ...newPixels[idx], r, g, b } })
  result.value = { ...result.value, pixels: newPixels }
}

function onGridInfo(info: { colorInfo: { color: BeadColor; count: number }[] }) { colorInfo.value = info.colorInfo }
function downloadGrid() { gridRef.value?.downloadPNG() }
function downloadSVGGrid() { gridRef.value?.downloadSVG() }
function downloadCyber() { gridRef.value?.downloadCyberPNG() }
function copyPaletteText() {
  if (colorInfo.value.length) navigator.clipboard.writeText(colorInfo.value.map(c => $t('app.copyFormat', { name: $t('color.' + c.color.code) || c.color.name, hex: c.color.hex, count: c.count })).join('\n'))
}
function selectColorInGrid(code: string) { gridRef.value?.selectByColor(code) }
</script>
