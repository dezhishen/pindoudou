<template>
  <Teleport to="body">
    <!-- Toast 通知列表 -->
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id"
          class="pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium max-w-sm flex items-center gap-2 transition-all"
          :class="toastClass(t.type)">
          <span>{{ toastIcon(t.type) }}</span>
          <span>{{ t.text }}</span>
        </div>
      </TransitionGroup>
    </div>

    <!-- 确认对话框 -->
    <Transition name="modal">
      <div v-if="confirmState.visible" class="fixed inset-0 z-[110] flex items-center justify-center bg-black/40" @click.self="closeConfirm(false)">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
          <div class="px-5 py-4 text-center">
            <p class="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">{{ confirmState.text }}</p>
          </div>
          <div class="flex border-t border-gray-100">
            <button class="flex-1 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
              @click="closeConfirm(false)">
              {{ confirmState.cancelText }}
            </button>
            <button
              class="flex-1 px-4 py-3 text-sm font-medium transition border-l border-gray-100"
              :class="confirmState.type === 'danger' ? 'text-red-500 hover:bg-red-50' : 'text-primary hover:bg-green-50'"
              @click="closeConfirm(true)">
              {{ confirmState.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { toasts, confirmState, closeConfirm } from '@/composables/useNotify'

function toastClass(type: string) {
  return {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-gray-800 text-white',
  }[type] || 'bg-gray-800 text-white'
}

function toastIcon(type: string) {
  return { success: '✅', error: '❌', info: 'ℹ️' }[type] || ''
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateX(40px); }
.toast-leave-to { opacity: 0; transform: translateX(40px); }

.modal-enter-active { transition: all 0.2s ease; }
.modal-leave-active { transition: all 0.15s ease; }
.modal-enter-from { opacity: 0; }
.modal-enter-from > div { transform: scale(0.95); }
.modal-leave-to { opacity: 0; }
</style>
