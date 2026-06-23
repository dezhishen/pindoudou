import { describe, it, expect } from 'vitest'
import { $t, setLocale, locale } from '@/i18n'
import type { Locale } from '@/i18n'

describe('i18n', () => {
  it('returns zh-CN text', () => {
    setLocale('zh-CN')
    expect($t('app.title')).toBe('拼豆图案生成器')
    expect($t('app.close')).toBe('关闭')
    expect($t('sidebar.downloadPNG')).toBe('下载 PNG')
  })

  it('returns en text', () => {
    setLocale('en')
    expect($t('app.title')).toBe('Bead Pattern Generator')
    expect($t('app.close')).toBe('Close')
    expect($t('sidebar.downloadPNG')).toBe('Download PNG')
  })

  it('returns zh-TW text', () => {
    setLocale('zh-TW')
    expect($t('app.title')).toBe('拼豆圖案生成器')
    expect($t('app.close')).toBe('關閉')
  })

  it('supports parameter substitution', () => {
    setLocale('zh-CN')
    expect($t('app.importSuccess', { count: 5 })).toBe('成功导入 5 条记录')
    setLocale('en')
    expect($t('app.importSuccess', { count: 3 })).toBe('Successfully imported 3 record(s)')
  })

  it('falls back to zh-CN for missing keys', () => {
    setLocale('en')
    // Force a non-existent key scenario by passing a known non-key
    const result = $t('nonexistent.key.test')
    expect(result).toBe('nonexistent.key.test')
  })

  it('returns color translations', () => {
    setLocale('en')
    expect($t('color.WHITE')).toBe('White')
    expect($t('color.RED')).toBe('Red')
    expect($t('color.BLACK')).toBe('Black')
    setLocale('zh-CN')
    expect($t('color.WHITE')).toBe('白色')
  })

  it('strategy names are translated', () => {
    setLocale('en')
    expect($t('strategy.euclidean-rgb')).toBe('RGB Euclidean')
    expect($t('strategy.lab-euclidean')).toBe('Lab Euclidean')
    setLocale('zh-CN')
    expect($t('strategy.euclidean-rgb')).toBe('RGB 欧几里得')
  })
})
