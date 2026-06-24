/**
 * 拼豆历史记录 - IndexedDB 存储
 * 本地保留最近 10 条记录（收藏的除外），包含原图和解析结果
 * 支持收藏、批量导出/导入
 */

const DB_NAME = 'pindoudou-history'
const DB_VERSION = 3
const STORE_NAME = 'records'
const MAX_RECORDS = 10

export type HistoryType = 'image' | 'text'

export interface HistoryRecord {
  id: number
  timestamp: number
  favorite: boolean
  /** 记录类型：图片/文字 */
  type: HistoryType
  /** 原图 base64 data URL（用于预览缩略图） */
  thumbnail: string
  /** 原图文件名 */
  fileName: string
  /** 原始宽度 */
  originalWidth: number
  /** 原始高度 */
  originalHeight: number
  /** 解析结果宽度 */
  width: number
  /** 解析结果高度 */
  height: number
  /** 压缩后的像素数据 JSON */
  pixelsJson: string
  /** 透明像素索引 JSON */
  transparentIndicesJson: string
  /** 使用的策略 ID */
  strategyId: string
  /** 使用的填充色 */
  fillColor: string
}

export interface HistoryMeta {
  id: number
  timestamp: number
  favorite: boolean
  type: HistoryType
  thumbnail: string
  fileName: string
  originalWidth: number
  originalHeight: number
  width: number
  height: number
}

/** 导出用的精简格式 */
export interface HistoryExportItem {
  type: HistoryType
  timestamp: number
  favorite: boolean
  thumbnail: string
  fileName: string
  originalWidth: number
  originalHeight: number
  width: number
  height: number
  pixelsJson: string
  transparentIndicesJson: string
  strategyId: string
  fillColor: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = req.result
      const oldVersion = (e as IDBVersionChangeEvent).oldVersion
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('favorite', 'favorite', { unique: false })
      } else if (oldVersion < 2) {
        const tx = (e.target as IDBOpenDBRequest).transaction!
        const store = tx.objectStore(STORE_NAME)
        store.openCursor().onsuccess = (ev) => {
          const cursor = (ev.target as IDBRequest<IDBCursorWithValue>).result
          if (cursor) {
            const record = cursor.value
            if (record.favorite === undefined) {
              record.favorite = false
              cursor.update(record)
            }
            cursor.continue()
          }
        }
      }
      if (oldVersion < 3) {
        // 升级到 v3：给已有记录加 type 字段（默认 'image'）
        const tx = (e.target as IDBOpenDBRequest).transaction!
        const store = tx.objectStore(STORE_NAME)
        store.openCursor().onsuccess = (ev) => {
          const cursor = (ev.target as IDBRequest<IDBCursorWithValue>).result
          if (cursor) {
            const record = cursor.value
            if (record.type === undefined) {
              record.type = 'image'
              cursor.update(record)
            }
            cursor.continue()
          }
        }
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** 保存一条历史记录，自动修剪超过上限的旧记录（不删除收藏的） */
export async function saveHistory(record: Omit<HistoryRecord, 'id' | 'timestamp' | 'favorite'> & { type?: HistoryType }): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  const all = await new Promise<HistoryRecord[]>((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  const newId = all.length > 0 ? Math.max(...all.map(r => r.id)) + 1 : 1
  const entry: HistoryRecord = {
    ...record,
    type: record.type || 'image',
    id: newId,
    timestamp: Date.now(),
    favorite: false,
  }
  store.put(entry)

  // 仅删除非收藏的旧记录
  const nonFav = [...all, entry].filter(r => !r.favorite).sort((a, b) => b.timestamp - a.timestamp)
  const toDelete = nonFav.slice(MAX_RECORDS)
  for (const r of toDelete) {
    store.delete(r.id)
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 切换收藏状态 */
export async function toggleFavorite(id: number): Promise<boolean> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const record = await new Promise<HistoryRecord | undefined>((resolve, reject) => {
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  if (!record) return false
  record.favorite = !record.favorite
  store.put(record)
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  return record.favorite
}

/** 获取所有历史记录元数据（按时间倒序，收藏优先），可选按类型筛选 */
export async function getHistoryList(type?: HistoryType): Promise<HistoryMeta[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const all = await new Promise<HistoryRecord[]>((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  const filtered = type ? all.filter(r => r.type === type) : all
  return filtered
    .sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
      return b.timestamp - a.timestamp
    })
    .map(r => ({
      id: r.id, timestamp: r.timestamp, favorite: r.favorite,
      type: r.type || 'image',
      thumbnail: r.thumbnail, fileName: r.fileName,
      originalWidth: r.originalWidth, originalHeight: r.originalHeight,
      width: r.width, height: r.height,
    }))
}

/** 获取单条完整历史记录 */
export async function getHistoryRecord(id: number): Promise<HistoryRecord | undefined> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  return new Promise((resolve, reject) => {
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** 删除指定记录 */
export async function deleteRecords(ids: number[]): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  for (const id of ids) store.delete(id)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 删除所有非收藏历史记录，返回被删除的数量 */
export async function clearHistory(): Promise<{ deleted: number; kept: number }> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const all = await new Promise<HistoryRecord[]>((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  const toDelete = all.filter(r => !r.favorite)
  for (const r of toDelete) store.delete(r.id)
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  return { deleted: toDelete.length, kept: all.length - toDelete.length }
}

/** 导出选中记录为 JSON 文件 */
export async function exportRecords(ids: number[]): Promise<void> {
  const items: HistoryExportItem[] = []
  for (const id of ids) {
    const r = await getHistoryRecord(id)
    if (r) {
      items.push({
        type: r.type || 'image',
        timestamp: r.timestamp, favorite: r.favorite,
        thumbnail: r.thumbnail, fileName: r.fileName,
        originalWidth: r.originalWidth, originalHeight: r.originalHeight,
        width: r.width, height: r.height,
        pixelsJson: r.pixelsJson,
        transparentIndicesJson: r.transparentIndicesJson,
        strategyId: r.strategyId, fillColor: r.fillColor,
      })
    }
  }
  const blob = new Blob([JSON.stringify({ version: 2, items })], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `pindoudou-favorites-${Date.now()}.json`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

/** 从 JSON 文件导入记录 */
export async function importRecords(file: File): Promise<number> {
  const text = await file.text()
  const data = JSON.parse(text)
  if (!data.items || !Array.isArray(data.items)) throw new Error('无效的导出文件格式')
  const items: HistoryExportItem[] = data.items

  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  const all = await new Promise<HistoryRecord[]>((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  let nextId = all.length > 0 ? Math.max(...all.map(r => r.id)) + 1 : 1
  let count = 0

  for (const item of items) {
    store.put({
      ...item,
      id: nextId++,
      timestamp: item.timestamp || Date.now(),
    } as HistoryRecord)
    count++
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  return count
}
