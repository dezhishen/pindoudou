/**
 * 拼豆历史记录 - IndexedDB 存储
 * 本地保留最近 10 条记录，包含原图和解析结果
 */

const DB_NAME = 'pindoudou-history'
const DB_VERSION = 1
const STORE_NAME = 'records'
const MAX_RECORDS = 10

export interface HistoryRecord {
  id: number
  timestamp: number
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
  thumbnail: string
  fileName: string
  originalWidth: number
  originalHeight: number
  width: number
  height: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** 保存一条历史记录，自动修剪超过上限的旧记录 */
export async function saveHistory(record: Omit<HistoryRecord, 'id' | 'timestamp'>): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  // 获取当前最大 id
  const all = await new Promise<HistoryRecord[]>((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  const newId = all.length > 0 ? Math.max(...all.map(r => r.id)) + 1 : 1
  const entry: HistoryRecord = {
    ...record,
    id: newId,
    timestamp: Date.now(),
  }
  store.put(entry)

  // 删除超出上限的旧记录
  if (all.length >= MAX_RECORDS) {
    const sorted = [...all, entry].sort((a, b) => b.timestamp - a.timestamp)
    const toDelete = sorted.slice(MAX_RECORDS)
    for (const r of toDelete) {
      store.delete(r.id)
    }
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 获取所有历史记录元数据（按时间倒序，不含完整数据） */
export async function getHistoryList(): Promise<HistoryMeta[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const all = await new Promise<HistoryRecord[]>((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return all
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      thumbnail: r.thumbnail,
      fileName: r.fileName,
      originalWidth: r.originalWidth,
      originalHeight: r.originalHeight,
      width: r.width,
      height: r.height,
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

/** 删除所有历史记录 */
export async function clearHistory(): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.clear()
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
