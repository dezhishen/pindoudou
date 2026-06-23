<template>
  <div
    class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-10 text-center cursor-pointer
           transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 select-none"
    :class="isDragover ? 'border-primary bg-green-50 dark:bg-green-900/30' : ''"
    @click="triggerUpload"
    @dragover.prevent="isDragover = true"
    @dragleave="isDragover = false"
    @drop.prevent="handleDrop"
  >
    <span class="text-5xl block mb-3">🖼️</span>
    <h3 class="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">{{ $t('upload.heading') }}</h3>
    <p class="text-gray-500 dark:text-gray-400 text-sm">{{ $t('upload.formats') }}</p>
    <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">{{ $t('upload.hint') }}</p>
    <p class="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-[10px] text-green-600 dark:text-green-400 font-medium">
      {{ $t('upload.privacy') }}
    </p>
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      class="hidden"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { $t } from '@/i18n'

const emit = defineEmits<{
  (e: 'file-selected', file: File): void
}>()

const isDragover = ref(false)
const fileInput = ref<HTMLInputElement>()

function triggerUpload() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    emit('file-selected', file)
    input.value = ''
  }
}

function handleDrop(event: DragEvent) {
  isDragover.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    emit('file-selected', file)
  }
}
</script>
