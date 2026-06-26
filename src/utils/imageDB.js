/**
 * IndexedDB 图片存储 — 替代 localStorage，配额几百 MB 起步，
 * 存全部 78 张牌的高清图都不成问题。
 */
const DB_NAME = 'tarot-images'
const DB_VERSION = 1
const STORE_NAME = 'images'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'cardId' })
      }
    }
    request.onsuccess = (e) => resolve(e.target.result)
    request.onerror = (e) => reject(e.target.error)
  })
}

export async function saveImage(cardId, dataUrl) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put({ cardId, dataUrl, updatedAt: Date.now() })
    request.onsuccess = () => resolve(true)
    request.onerror = () => reject(request.error)
  })
}

export async function loadAllImages() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      const images = {}
      for (const item of request.result) {
        if (item && item.cardId && item.dataUrl) {
          images[item.cardId] = item.dataUrl
        }
      }
      resolve(images)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteImageFromDB(cardId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(cardId)
    request.onsuccess = () => resolve(true)
    request.onerror = () => reject(request.error)
  })
}
