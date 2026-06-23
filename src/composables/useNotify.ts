import { ref } from 'vue'

export interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'error' | 'info'
}

export interface ConfirmOptions {
  text: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'normal'
}

let _toastId = 0

// ========== 全局共享状态 ==========
export const toasts = ref<ToastMessage[]>([])

export const confirmState = ref<{
  visible: boolean
  text: string
  confirmText: string
  cancelText: string
  type: 'danger' | 'normal'
  resolve: ((v: boolean) => void) | null
}>({
  visible: false,
  text: '',
  confirmText: '确定',
  cancelText: '取消',
  type: 'normal',
  resolve: null,
})

/** 流式通知（自动消失） */
export function showToast(text: string, type: ToastMessage['type'] = 'info', duration = 2800) {
  const id = ++_toastId
  toasts.value.push({ id, text, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

/** 确认框（返回 Promise<boolean>） */
export function showConfirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    confirmState.value = {
      visible: true,
      text: options.text,
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      type: options.type || 'normal',
      resolve,
    }
  })
}

/** 关闭确认框 */
export function closeConfirm(result: boolean) {
  confirmState.value.resolve?.(result)
  confirmState.value = {
    visible: false, text: '', confirmText: '确定', cancelText: '取消',
    type: 'normal', resolve: null,
  }
}
