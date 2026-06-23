import { describe, it, expect, vi } from 'vitest'
import { toasts, confirmState, showToast, showConfirm, closeConfirm } from '@/composables/useNotify'

describe('useNotify', () => {
  it('showToast adds and removes toast', async () => {
    showToast('Test message', 'success', 100)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].text).toBe('Test message')
    expect(toasts.value[0].type).toBe('success')

    await new Promise(r => setTimeout(r, 150))
    expect(toasts.value).toHaveLength(0)
  })

  it('showConfirm returns promise', async () => {
    const promise = showConfirm({ text: 'Are you sure?', type: 'danger' })
    expect(confirmState.value.visible).toBe(true)
    expect(confirmState.value.text).toBe('Are you sure?')

    closeConfirm(true)
    const result = await promise
    expect(result).toBe(true)
    expect(confirmState.value.visible).toBe(false)
  })

  it('showConfirm cancel returns false', async () => {
    const promise = showConfirm({ text: 'Delete?' })
    closeConfirm(false)
    const result = await promise
    expect(result).toBe(false)
  })
})
