import { ref, watch } from 'vue'

const STORAGE_KEY = 'tarot-app-data'
const IMAGE_KEY = 'tarot-custom-images'
const BACKUP_META_KEY = 'tarot-last-backup'

// ==================== 内容卡片数据 ====================

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// 全局共享实例
let _cardDataInstance = null

export function useCardData() {
  if (_cardDataInstance) return _cardDataInstance

  const allData = ref(loadAll())

  // 深度监听，任何改动即时保存
  watch(allData, (val) => {
    saveAll(val)
  }, { deep: true })

  // 监听跨标签页的 storage 事件
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        try {
          allData.value = e.newValue ? JSON.parse(e.newValue) : {}
        } catch {
          allData.value = {}
        }
      }
    })
  }

  function getCards(cardId) {
    return allData.value[cardId] || []
  }

  function addCard(cardId) {
    const now = Date.now()
    const card = {
      id: `c_${now}_${Math.random().toString(36).slice(2, 6)}`,
      title: '新卡片',
      content: '',
      color: getRandomColor(),
      createdAt: now,
      updatedAt: now
    }
    if (!allData.value[cardId]) {
      allData.value[cardId] = []
    }
    allData.value[cardId].push(card)
    return card
  }

  function updateCard(cardId, cardIndex, updates) {
    if (allData.value[cardId] && allData.value[cardId][cardIndex]) {
      allData.value[cardId][cardIndex] = {
        ...allData.value[cardId][cardIndex],
        ...updates,
        updatedAt: Date.now()
      }
    }
  }

  function deleteCard(cardId, cardIndex) {
    if (allData.value[cardId]) {
      allData.value[cardId].splice(cardIndex, 1)
    }
  }

  function getRandomColor() {
    const colors = [
      '#8B6B4A', '#6B4E71', '#4A6B6B', '#7B5B3A', '#5B4A6B',
      '#4A5B6B', '#6B5B4A', '#3A5B5B', '#5A4A3B', '#4B3A5A',
      '#7A6B5A', '#5A6B7A', '#6A5A4B', '#4B5A6A'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const instance = { allData, getCards, addCard, updateCard, deleteCard }
  _cardDataInstance = instance
  return instance
}

// ==================== 自定义图片（IndexedDB 存储） ====================

import { saveImage as idbSave, loadAllImages as idbLoadAll, deleteImageFromDB } from '../utils/imageDB.js'

const MIGRATION_DONE_KEY = 'tarot-img-migrated-v4'

// 从旧 localStorage 格式收集所有图片（用于一次性迁移）
function collectOldImages() {
  const images = {}
  try {
    // 格式1：tarot-img-* 独立 key
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('tarot-img-')) {
        const cardId = key.slice('tarot-img-'.length)
        const dataUrl = localStorage.getItem(key)
        if (dataUrl && dataUrl.startsWith('data:image/')) {
          images[cardId] = dataUrl
        }
      }
    }
    // 格式2：tarot-custom-images 旧单 key
    const oldRaw = localStorage.getItem(IMAGE_KEY)
    if (oldRaw) {
      const oldData = JSON.parse(oldRaw)
      for (const [cardId, dataUrl] of Object.entries(oldData)) {
        if (dataUrl && dataUrl.startsWith('data:image/') && !images[cardId]) {
          images[cardId] = dataUrl
        }
      }
    }
  } catch { /* ignore */ }
  return images
}

// 清理旧的 localStorage 图片数据
function cleanOldImageKeys() {
  try {
    localStorage.removeItem(IMAGE_KEY)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && key.startsWith('tarot-img-')) {
        localStorage.removeItem(key)
      }
    }
  } catch { /* ignore */ }
}

const sharedImages = ref({})

// 异步初始化：从 IndexedDB 加载，首次使用时从 localStorage 迁移
async function initImages() {
  let images = {}
  try {
    images = await idbLoadAll()
  } catch (e) {
    console.warn('[useCustomImages] IndexedDB 读取失败:', e.message)
  }

  const migrated = localStorage.getItem(MIGRATION_DONE_KEY)
  if (!migrated || Object.keys(images).length === 0) {
    // 尝试从旧的 localStorage 格式迁移
    const oldImages = collectOldImages()
    if (Object.keys(oldImages).length > 0) {
      console.log(`[useCustomImages] 从 localStorage 迁移 ${Object.keys(oldImages).length} 张图片到 IndexedDB...`)
      for (const [cardId, dataUrl] of Object.entries(oldImages)) {
        if (!images[cardId]) {
          try {
            await idbSave(cardId, dataUrl)
            images[cardId] = dataUrl
          } catch (e) {
            console.warn(`[useCustomImages] 迁移图片失败: ${cardId}`, e.message)
          }
        }
      }
      cleanOldImageKeys()
    }
    localStorage.setItem(MIGRATION_DONE_KEY, '1')
  }

  sharedImages.value = images
  console.log(`[useCustomImages] IndexedDB 已加载 ${Object.keys(images).length} 张牌的自定义图片`)
}

// 启动异步初始化
initImages()

export function useCustomImages() {
  async function setImage(cardId, imageDataUrl) {
    try {
      await idbSave(cardId, imageDataUrl)
      sharedImages.value = { ...sharedImages.value, [cardId]: imageDataUrl }
      const sizeKB = (imageDataUrl.length / 1024).toFixed(1)
      console.log(`[useCustomImages] IndexedDB 已存储: ${cardId} (${sizeKB}KB), 共 ${Object.keys(sharedImages.value).length} 张`)
      return { success: true }
    } catch (e) {
      console.error(`[useCustomImages] IndexedDB 写入失败: ${cardId}`, e.message)
      return { success: false, error: '图片存储失败：' + e.message }
    }
  }

  function removeImage(cardId) {
    // 先更新内存（即时反映到 UI）
    const next = { ...sharedImages.value }
    delete next[cardId]
    sharedImages.value = next
    // 异步删除 IndexedDB 中的记录
    deleteImageFromDB(cardId).catch(() => {})
    console.log(`[useCustomImages] 图片已删除: ${cardId}`)
  }

  function getImage(cardId) {
    return sharedImages.value[cardId] || null
  }

  return { images: sharedImages, setImage, removeImage, getImage }
}

// ==================== 备份与恢复 ====================

/**
 * 导出所有数据为一个 JSON 文件下载
 */
export async function exportBackup() {
  const backup = {
    version: 4,
    exportedAt: new Date().toISOString(),
    exportedAtLocale: new Date().toLocaleString('zh-CN'),
    data: {},
    images: {},
    notes: {},          // 每张牌的富文本笔记
    cases: [],          // 案例集
    principles: [],     // 塔罗原理
    inspirations: {},   // 灵感卡片
    inspirationIcons: {}, // 灵感图标
    astro: {},           // 占星落点
  }

  // 收集卡片数据
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    backup.data = raw ? JSON.parse(raw) : {}
  } catch { /* ignore */ }

  // 收集图片数据：从 IndexedDB 读取
  try {
    backup.images = await idbLoadAll()
  } catch { /* ignore */ }

  // 收集笔记数据（所有 tarot-note- 前缀的 key）
  try {
    const notes = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('tarot-note-')) {
        notes[key] = localStorage.getItem(key)
      }
    }
    backup.notes = notes
  } catch { /* ignore */ }

  // 收集案例集
  try {
    const rawCases = localStorage.getItem(CASE_KEY)
    backup.cases = rawCases ? JSON.parse(rawCases) : []
  } catch { /* ignore */ }

  // 收集塔罗原理
  try {
    const rawPrinciples = localStorage.getItem(PRINCIPLE_KEY)
    backup.principles = rawPrinciples ? JSON.parse(rawPrinciples) : []
  } catch { /* ignore */ }

  // 收集灵感卡片
  try {
    const rawInsp = localStorage.getItem(INSPIRATION_KEY)
    backup.inspirations = rawInsp ? JSON.parse(rawInsp) : {}
  } catch { /* ignore */ }

  // 收集灵感图标
  try {
    const rawIcons = localStorage.getItem(INSPIRATION_ICON_KEY)
    backup.inspirationIcons = rawIcons ? JSON.parse(rawIcons) : {}
  } catch { /* ignore */ }

  // 收集占星落点
  try {
    const rawAstro = localStorage.getItem(ASTRO_KEY)
    backup.astro = rawAstro ? JSON.parse(rawAstro) : {}
  } catch { /* ignore */ }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const dateStr = new Date().toISOString().slice(0, 10)
  a.download = `塔罗手札备份_${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  localStorage.setItem(BACKUP_META_KEY, Date.now().toString())

  return {
    success: true,
    cardCount: countCards(backup.data),
    imageCount: Object.keys(backup.images).length,
    noteCount: Object.keys(backup.notes).length,
    caseCount: backup.cases.length,
    principleCount: backup.principles.length,
    inspirationCount: countInspirations(backup.inspirations),
  }
}

/**
 * 从 JSON 文件导入数据
 * @param {File} file - 用户选择的文件
 * @param {'merge'|'replace'} mode - 合并还是替换
 * @returns {Promise<{success: boolean, cardCount: number, imageCount: number, error?: string}>}
 */
export function importBackup(file, mode = 'merge') {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target.result)

        // 基本校验
        if (!backup || typeof backup !== 'object') {
          resolve({ success: false, error: '无效的备份文件格式' })
          return
        }

        const cardData = backup.data || {}
        const imageData = backup.images || {}

        if (mode === 'replace') {
          // 完全替换 - 清除旧数据
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key && (key.startsWith('tarot-') || key.startsWith('tarot_'))) {
              localStorage.removeItem(key)
            }
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cardData))
          // 清除 IndexedDB 中的旧图片
          const existingImages = await idbLoadAll()
          for (const cardId of Object.keys(existingImages)) {
            await deleteImageFromDB(cardId).catch(() => {})
          }
          // 写入新图片到 IndexedDB
          for (const [cardId, dataUrl] of Object.entries(imageData)) {
            if (dataUrl && typeof dataUrl === 'string') {
              await idbSave(cardId, dataUrl).catch(() => {})
            }
          }
        } else {
          // 合并模式
          const existing = loadAll()
          const merged = { ...existing, ...cardData }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))

          // 合并图片到 IndexedDB
          for (const [cardId, dataUrl] of Object.entries(imageData)) {
            if (dataUrl && typeof dataUrl === 'string') {
              await idbSave(cardId, dataUrl).catch(() => {})
            }
          }
        }

        // 恢复笔记
        if (backup.notes && typeof backup.notes === 'object') {
          Object.entries(backup.notes).forEach(([key, val]) => {
            localStorage.setItem(key, val)
          })
        }

        // 恢复案例集
        if (backup.cases && Array.isArray(backup.cases)) {
          if (mode === 'merge') {
            try {
              const existingCases = JSON.parse(localStorage.getItem(CASE_KEY) || '[]')
              const mergedCases = [...existingCases]
              backup.cases.forEach(bc => {
                const exists = mergedCases.find(c => c.id === bc.id)
                if (!exists) mergedCases.push(bc)
                else Object.assign(exists, bc)
              })
              localStorage.setItem(CASE_KEY, JSON.stringify(mergedCases))
            } catch { /* ignore */ }
          } else {
            localStorage.setItem(CASE_KEY, JSON.stringify(backup.cases))
          }
        }

        // 恢复塔罗原理
        if (backup.principles && Array.isArray(backup.principles)) {
          if (mode === 'merge') {
            try {
              const existingPrinciples = JSON.parse(localStorage.getItem(PRINCIPLE_KEY) || '[]')
              const mergedPrinciples = [...existingPrinciples]
              backup.principles.forEach(bp => {
                const exists = mergedPrinciples.find(p => p.id === bp.id)
                if (!exists) mergedPrinciples.push(bp)
                else Object.assign(exists, bp)
              })
              localStorage.setItem(PRINCIPLE_KEY, JSON.stringify(mergedPrinciples))
            } catch { /* ignore */ }
          } else {
            localStorage.setItem(PRINCIPLE_KEY, JSON.stringify(backup.principles))
          }
        }

        // 恢复灵感卡片
        if (backup.inspirations && typeof backup.inspirations === 'object') {
          if (mode === 'merge') {
            try {
              const existingInsp = JSON.parse(localStorage.getItem(INSPIRATION_KEY) || '{}')
              const mergedInsp = { ...existingInsp }
              Object.entries(backup.inspirations).forEach(([cardId, cards]) => {
                if (Array.isArray(cards)) {
                  mergedInsp[cardId] = mergedInsp[cardId]
                    ? [...mergedInsp[cardId], ...cards.filter(c => !mergedInsp[cardId].find(e => e.id === c.id))]
                    : cards
                }
              })
              localStorage.setItem(INSPIRATION_KEY, JSON.stringify(mergedInsp))
            } catch { /* ignore */ }
          } else {
            localStorage.setItem(INSPIRATION_KEY, JSON.stringify(backup.inspirations))
          }
        }

        // 恢复灵感图标
        if (backup.inspirationIcons && typeof backup.inspirationIcons === 'object') {
          if (mode === 'merge') {
            try {
              const existingIcons = JSON.parse(localStorage.getItem(INSPIRATION_ICON_KEY) || '{}')
              const mergedIcons = { ...existingIcons, ...backup.inspirationIcons }
              localStorage.setItem(INSPIRATION_ICON_KEY, JSON.stringify(mergedIcons))
            } catch { /* ignore */ }
          } else {
            localStorage.setItem(INSPIRATION_ICON_KEY, JSON.stringify(backup.inspirationIcons))
          }
        }

        // 恢复占星落点
        if (backup.astro && typeof backup.astro === 'object') {
          if (mode === 'merge') {
            try {
              const existingAstro = JSON.parse(localStorage.getItem(ASTRO_KEY) || '{}')
              const mergedAstro = { ...existingAstro, ...backup.astro }
              localStorage.setItem(ASTRO_KEY, JSON.stringify(mergedAstro))
            } catch { /* ignore */ }
          } else {
            localStorage.setItem(ASTRO_KEY, JSON.stringify(backup.astro))
          }
        }

        // 刷新内存中的图片
        try {
          sharedImages.value = await idbLoadAll()
        } catch { /* ignore */ }

        localStorage.setItem(BACKUP_META_KEY, Date.now().toString())

        resolve({
          success: true,
          cardCount: countCards(cardData),
          imageCount: Object.keys(imageData).length,
          noteCount: backup.notes ? Object.keys(backup.notes).length : 0,
          caseCount: backup.cases ? backup.cases.length : 0,
          principleCount: backup.principles ? backup.principles.length : 0
        })
      } catch (err) {
        resolve({ success: false, error: '文件解析失败：' + err.message })
      }
    }
    reader.onerror = () => {
      resolve({ success: false, error: '文件读取失败' })
    }
    reader.readAsText(file)
  })
}

function countCards(data) {
  let count = 0
  if (data && typeof data === 'object') {
    Object.values(data).forEach(arr => {
      if (Array.isArray(arr)) count += arr.length
    })
  }
  return count
}

function countInspirations(data) {
  let count = 0
  if (data && typeof data === 'object') {
    Object.values(data).forEach(arr => {
      if (Array.isArray(arr)) count += arr.length
    })
  }
  return count
}

/**
 * 获取上次备份时间
 */
export function getLastBackupTime() {
  const ts = localStorage.getItem(BACKUP_META_KEY)
  if (!ts) return null
  return new Date(parseInt(ts))
}

// ==================== 案例集系统 ====================

const CASE_KEY = 'tarot-cases'
const PRINCIPLE_KEY = 'tarot-principles'

// 全局共享的案例集状态，确保所有组件实例数据一致
let _casesInstance = null

function loadCases() {
  try {
    const raw = localStorage.getItem(CASE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useCases() {
  // 单例模式：所有调用者共享同一个 ref
  if (_casesInstance) return _casesInstance

  const cases = ref(loadCases())

  function saveCases() {
    localStorage.setItem(CASE_KEY, JSON.stringify(cases.value))
  }

  // 深度监听，自动保存到 localStorage
  watch(cases, () => saveCases(), { deep: true })

  // 监听跨标签页的 storage 事件
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === CASE_KEY) {
        try {
          cases.value = e.newValue ? JSON.parse(e.newValue) : []
        } catch {
          cases.value = []
        }
      }
    })
  }

  function createCase(title = '新案例集') {
    const now = Date.now()
    const newCase = {
      id: `case_${now}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      content: '',       // HTML 富文本内容
      createdAt: now,
      updatedAt: now,
      color: getCaseColor(),
    }
    cases.value.unshift(newCase)
    return newCase
  }

  function updateCase(caseId, updates) {
    const idx = cases.value.findIndex(c => c.id === caseId)
    if (idx !== -1) {
      cases.value[idx] = {
        ...cases.value[idx],
        ...updates,
        updatedAt: Date.now()
      }
    }
  }

  function deleteCase(caseId) {
    cases.value = cases.value.filter(c => c.id !== caseId)
  }

  function getCase(caseId) {
    return cases.value.find(c => c.id === caseId) || null
  }

  function getCaseColors() {
    return [
      '#8B6B4A', '#6B4E71', '#4A6B6B', '#7B5B3A', '#5B4A6B',
      '#4A5B6B', '#6B5B4A', '#3A5B5B', '#7A6B5A', '#5A6B7A',
    ]
  }

  function getCaseColor() {
    const colors = getCaseColors()
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const instance = { cases, createCase, updateCase, deleteCase, getCase, getCaseColors }
  _casesInstance = instance
  return instance
}

// ==================== 塔罗原理文章系统 ====================

export function loadPrinciples() {
  try {
    const raw = localStorage.getItem(PRINCIPLE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function savePrinciples(list) {
  localStorage.setItem(PRINCIPLE_KEY, JSON.stringify(list))
}

export function createPrinciple(title = '新文章') {
  const now = Date.now()
  const colors = ['#8B6B4A', '#6B4E71', '#4A6B6B', '#7B5B3A', '#5B4A6B',
                  '#4A5B6B', '#6B5B4A', '#3A5B5B', '#7A6B5A', '#5A6B7A']
  return {
    id: `pr_${now}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    content: '',
    createdAt: now,
    updatedAt: now,
    color: colors[Math.floor(Math.random() * colors.length)],
  }
}

// ==================== Inspirations 灵感卡片系统 ====================

const INSPIRATION_KEY = 'tarot-inspirations'
const INSPIRATION_ICON_KEY = 'tarot-inspiration-icons'

export function loadInspirations(cardId) {
  try {
    const raw = localStorage.getItem(INSPIRATION_KEY)
    const all = raw ? JSON.parse(raw) : {}
    return all[cardId] || []
  } catch {
    return []
  }
}

export function saveInspirations(cardId, list) {
  try {
    const raw = localStorage.getItem(INSPIRATION_KEY)
    const all = raw ? JSON.parse(raw) : {}
    if (list.length > 0) {
      all[cardId] = list
    } else {
      delete all[cardId]
    }
    localStorage.setItem(INSPIRATION_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

export function loadInspirationIcons() {
  try {
    const raw = localStorage.getItem(INSPIRATION_ICON_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveInspirationIcon(cardId, iconDataUrl) {
  try {
    const icons = loadInspirationIcons()
    if (iconDataUrl) {
      icons[cardId] = iconDataUrl
    } else {
      delete icons[cardId]
    }
    localStorage.setItem(INSPIRATION_ICON_KEY, JSON.stringify(icons))
  } catch { /* ignore */ }
}

export function createInspiration(title = '新灵感') {
  const now = Date.now()
  return {
    id: `insp_${now}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    content: '',
    createdAt: now,
    updatedAt: now,
  }
}

// ==================== 占星落点（行星 + 星座）====================

const ASTRO_KEY = 'tarot-astro-placements'

export function loadAstroPlacement(cardId) {
  try {
    const raw = localStorage.getItem(ASTRO_KEY)
    const all = raw ? JSON.parse(raw) : {}
    return all[cardId] || { planet: '', sign: '' }
  } catch {
    return { planet: '', sign: '' }
  }
}

export function saveAstroPlacement(cardId, planet, sign) {
  try {
    const raw = localStorage.getItem(ASTRO_KEY)
    const all = raw ? JSON.parse(raw) : {}
    if (planet || sign) {
      all[cardId] = { planet, sign }
    } else {
      delete all[cardId]
    }
    localStorage.setItem(ASTRO_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

// 占星选项数据
export const PLANETS = [
  { value: '', label: '— 选择行星 —' },
  { value: 'mercury', label: '水星 Mercury' },
  { value: 'venus', label: '金星 Venus' },
  { value: 'earth', label: '地球 Earth' },
  { value: 'mars', label: '火星 Mars' },
  { value: 'jupiter', label: '木星 Jupiter' },
  { value: 'saturn', label: '土星 Saturn' },
  { value: 'uranus', label: '天王星 Uranus' },
  { value: 'neptune', label: '海王星 Neptune' },
  { value: 'pluto', label: '冥王星 Pluto' },
]

export const ZODIAC_SIGNS = [
  { value: '', label: '— 选择星座 —' },
  { value: 'aries', label: '白羊座 Aries' },
  { value: 'taurus', label: '金牛座 Taurus' },
  { value: 'gemini', label: '双子座 Gemini' },
  { value: 'cancer', label: '巨蟹座 Cancer' },
  { value: 'leo', label: '狮子座 Leo' },
  { value: 'virgo', label: '处女座 Virgo' },
  { value: 'libra', label: '天秤座 Libra' },
  { value: 'scorpio', label: '天蝎座 Scorpio' },
  { value: 'sagittarius', label: '射手座 Sagittarius' },
  { value: 'capricorn', label: '摩羯座 Capricorn' },
  { value: 'aquarius', label: '水瓶座 Aquarius' },
  { value: 'pisces', label: '双鱼座 Pisces' },
]

export function usePrinciples() {
  const principles = ref(loadPrinciples())

  // 深度监听，自动保存
  watch(principles, (val) => {
    savePrinciples(val)
  }, { deep: true })

  // 跨标签页同步
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === PRINCIPLE_KEY) {
        try {
          principles.value = e.newValue ? JSON.parse(e.newValue) : []
        } catch {
          principles.value = []
        }
      }
    })
  }

  function addPrinciple(title = '新文章') {
    const p = createPrinciple(title)
    principles.value.unshift(p)
    return p
  }

  function updatePrinciple(id, updates) {
    const idx = principles.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      principles.value[idx] = {
        ...principles.value[idx],
        ...updates,
        updatedAt: Date.now()
      }
    }
  }

  function deletePrinciple(id) {
    principles.value = principles.value.filter(p => p.id !== id)
  }

  function getPrinciple(id) {
    return principles.value.find(p => p.id === id) || null
  }

  return { principles, addPrinciple, updatePrinciple, deletePrinciple, getPrinciple }
}
