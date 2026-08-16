// ============================================================
// useCloudSync.js — 塔罗手札云同步（Supabase）
// 零依赖：直接用原生 fetch 调用 Supabase REST API
// 能力：注册 / 登录 / 登出 / 会话恢复 / 数据推送 / 数据拉取 / 防抖自动同步
// ============================================================

const SUPABASE_URL = 'https://ixjuvtwufikkzdcvzmxs.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_44avB4fpKdlBFBMeJ0MaRA_R-j5Xtnt'

const SESSION_KEY = 'tarot-cloud-session'
const TABLE = 'tarot_sync'

// ---------------- 会话状态 ----------------

let session = null
let refreshTimer = null
const authListeners = new Set()

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    session = raw ? JSON.parse(raw) : null
  } catch {
    session = null
  }
  return session
}

function saveSession(s) {
  session = s
  if (s) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
  authListeners.forEach(cb => cb(session))
}

export function getSession() {
  return session
}

export function isLoggedIn() {
  return !!(session && session.access_token)
}

export function getSessionEmail() {
  return (session && session.user && session.user.email) || ''
}

export function onAuthChange(cb) {
  authListeners.add(cb)
  return () => authListeners.delete(cb)
}

// 启动时恢复会话
loadSession()

// ---------------- 基础请求 ----------------

async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  const doFetch = (t) => fetch(SUPABASE_URL + path, {
    method,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let res = await doFetch(token)
  // access_token 过期（401）：用 refresh_token 续期后重试一次（refresh 请求本身除外）
  if (res.status === 401 && token && !path.includes('/auth/v1/token')) {
    const ok = await ensureFreshToken()
    if (ok && session) {
      res = await doFetch(session.access_token)
    }
  }
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const err = new Error((data && (data.error_description || data.msg || data.message)) || `请求失败 (${res.status})`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

// ---------------- 认证 ----------------

export async function signUp(email, password) {
  const data = await request('/auth/v1/signup', {
    method: 'POST',
    body: { email, password },
  })
  // 若项目开启了邮箱确认，signup 不会返回 access_token
  if (data && data.access_token) {
    saveSession(stampExpiry(data))
    scheduleTokenRefresh(data)
    return { ...data, needsEmailConfirm: false }
  }
  return { ...data, needsEmailConfirm: true }
}

export async function signIn(email, password) {
  const data = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  })
  saveSession(stampExpiry(data))
  scheduleTokenRefresh(data)
  return data
}

export async function signOut() {
  if (session && session.access_token) {
    try {
      await request('/auth/v1/logout', { method: 'POST', token: session.access_token })
    } catch { /* 忽略登出失败 */ }
  }
  saveSession(null)
  clearTokenRefresh()
}

// 记录 access_token 过期时刻（Supabase 返回 expires_in 秒数）
function stampExpiry(data) {
  if (data && data.expires_in && !data.expires_at) {
    data.expires_at = Date.now() + data.expires_in * 1000
  }
  return data
}

// ---------------- 会话续期 ----------------

let refreshing = null

// 确保 access_token 有效：已过期则用 refresh_token 续期（并发安全）
async function ensureFreshToken() {
  if (!session || !session.refresh_token) return false
  const now = Date.now()
  const expiresAt = session.expires_at || 0
  if (expiresAt && now < expiresAt - 60 * 1000) return true
  if (refreshing) return refreshing
  refreshing = (async () => {
    try {
      const data = await request('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        body: { refresh_token: session.refresh_token },
      })
      saveSession(stampExpiry({ ...session, ...data }))
      scheduleTokenRefresh({ ...session, ...data })
      return true
    } catch {
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

// 刷新会话：未过期则定时续期；已过期则立即续期
function scheduleTokenRefresh(sess) {
  clearTokenRefresh()
  if (!sess || !sess.expires_in || !sess.refresh_token) return
  const expiresAt = sess.expires_at || (Date.now() + sess.expires_in * 1000)
  const ms = expiresAt - Date.now() - 120 * 1000
  if (ms <= 0) {
    ensureFreshToken()
    return
  }
  refreshTimer = setTimeout(() => {
    ensureFreshToken()
  }, ms)
}

function clearTokenRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

// ---------------- 数据收集（本地 → 云端） ----------------

// 收集所有 tarot-* 数据（排除会话 key），解析 JSON 值
function collectLocalData() {
  const rows = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith('tarot-')) continue
    if (key === SESSION_KEY || key.startsWith('tarot-img-') || key === 'tarot-custom-images' || key === 'tarot-img-migrated-v4') continue
    const raw = localStorage.getItem(key)
    if (raw == null) continue
    let value = raw
    try { value = JSON.parse(raw) } catch { /* 保留字符串（如笔记 HTML） */ }
    rows.push({ key, value, updated_at: new Date().toISOString() })
  }
  return rows
}

// 推送全部本地数据到云端（upsert，按 key 合并）
export async function pushAllToCloud() {
  if (!isLoggedIn()) return { success: false, error: '未登录，无法同步' }
  const rows = collectLocalData()
  if (rows.length === 0) return { success: true, pushed: 0 }
  await request(`/rest/v1/${TABLE}?on_conflict=key`, {
    method: 'POST',
    token: session.access_token,
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: rows,
  })
  return { success: true, pushed: rows.length }
}

// 从云端拉取全部数据并写入本地
export async function pullAllFromCloud() {
  if (!isLoggedIn()) return { success: false, error: '未登录，无法拉取' }
  const data = await request(`/rest/v1/${TABLE}?select=*&order=updated_at`, {
    method: 'GET',
    token: session.access_token,
  })
  if (!Array.isArray(data)) return { success: false, error: '云端返回异常' }
  let applied = 0
  for (const row of data) {
    if (!row || !row.key || row.key === SESSION_KEY) continue
    const val = row.value
    const str = (val === null || val === undefined) ? '' : (typeof val === 'string' ? val : JSON.stringify(val))
    try {
      localStorage.setItem(row.key, str)
      applied++
    } catch { /* 单条失败不影响整体 */ }
  }
  return { success: true, pulled: applied }
}

// 双向同步：先拉取云端（合并到本地），再推送本地（含刚拉取的数据）到云端
// 这样无论哪边有更新，两边最终一致；按 key 粒度合并，同名 key 以云端为准
export async function syncBothWays() {
  if (!isLoggedIn()) return { success: false, error: '未登录，无法同步' }
  let pulled = 0
  let pushed = 0
  try {
    const pullRes = await pullAllFromCloud()
    if (pullRes.success) pulled = pullRes.pulled
  } catch { /* 拉取失败不阻断推送 */ }
  const pushRes = await pushAllToCloud()
  if (pushRes.success) pushed = pushRes.pushed
  return { success: true, pulled, pushed }
}

// 防抖自动同步（本地写操作后调用）
let syncTimer = null
let pendingResolver = null

export function scheduleCloudSync(delay = 2000) {
  if (!isLoggedIn()) return
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    pushAllToCloud().catch(() => {})
  }, delay)
}

// 立即同步（手动按钮）
export async function syncNow() {
  if (!isLoggedIn()) return { success: false, error: '未登录，无法同步' }
  return pushAllToCloud()
}

// 已登录时自动从云端拉取（打开页面 / 回到前台时调用，带防抖）
let autoPullTimer = null
function autoPullIfLoggedIn(delay = 3000) {
  if (!isLoggedIn()) return
  clearTimeout(autoPullTimer)
  autoPullTimer = setTimeout(() => {
    pullAllFromCloud().catch(() => {})
  }, delay)
}

// 回到前台时自动拉取（如 AI 代笔写入云端后，切回页面即见）
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      autoPullIfLoggedIn(1500)
    }
  })
}

// 初始化：恢复会话 + 若已登录自动续期 + 自动拉取一次云端
export function initCloudSync() {
  if (session) {
    scheduleTokenRefresh(session)
    autoPullIfLoggedIn()
    return true
  }
  return false
}
