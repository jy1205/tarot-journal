<template>
  <div class="cloud-sync">
    <!-- 未登录：登录/注册表单 -->
    <div v-if="!loggedIn" class="login-form">
      <h3 class="section-title">☁ 云端同步</h3>
      <p class="section-desc">登录后，你写的每一笔内容都会自动同步到云端，换设备也不丢。</p>

      <div class="form-group">
        <input v-model="email" type="email" placeholder="邮箱" class="text-input" />
      </div>
      <div class="form-group">
        <input v-model="password" type="password" placeholder="密码" class="text-input" @keyup.enter="doLogin" />
      </div>

      <div class="form-actions">
        <button class="sync-btn login" @click="doLogin" :disabled="busy">
          {{ busy ? '请稍候...' : '登录' }}
        </button>
        <button class="sync-btn register" @click="doRegister" :disabled="busy">
          注册新账号
        </button>
      </div>

      <p class="form-hint">没有账号？点「注册新账号」即可（邮箱+密码，无需验证）</p>

      <transition name="msg-fade">
        <div class="sync-msg" :class="msgType" v-if="message">{{ message }}</div>
      </transition>
    </div>

    <!-- 已登录：状态 + 操作 -->
    <div v-else class="login-state">
      <h3 class="section-title">☁ 云端同步</h3>
      <div class="state-row">
        <span class="state-label">已登录</span>
        <span class="state-value">{{ email }}</span>
      </div>
      <div class="state-row">
        <span class="state-label">上次同步</span>
        <span class="state-value">{{ lastSyncText }}</span>
      </div>
      <div class="state-row" v-if="syncResult">
        <span class="state-label">同步结果</span>
        <span class="state-value" :class="syncResultClass">{{ syncResult }}</span>
      </div>

      <div class="form-actions">
        <button class="sync-btn login" @click="doSyncNow" :disabled="busy">
          {{ busy ? '同步中...' : '立即同步到云端' }}
        </button>
        <button class="sync-btn pull" @click="doPullNow" :disabled="busy">
          {{ busy ? '拉取中...' : '从云端拉取' }}
        </button>
      </div>
      <div class="form-actions">
        <button class="sync-btn logout" @click="doLogout" :disabled="busy">退出登录</button>
      </div>
      <p class="form-hint">提示：登录状态下，每次修改会自动同步（约 2 秒后）。</p>

      <transition name="msg-fade">
        <div class="sync-msg" :class="msgType" v-if="message">{{ message }}</div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  isLoggedIn, getSessionEmail, signIn, signUp, signOut,
  syncNow, pullAllFromCloud, onAuthChange, getSession
} from '../composables/useCloudSync.js'

const loggedIn = ref(isLoggedIn())
const email = ref('')
const password = ref('')
const busy = ref(false)
const message = ref('')
const msgType = ref('success')
const lastSyncText = ref('')
const syncResult = ref('')
const syncResultClass = ref('')

let unsubscribe = null

function showMsg(text, type = 'success') {
  message.value = text
  msgType.value = type
  setTimeout(() => { message.value = '' }, 5000)
}

async function doLogin() {
  if (!email.value || !password.value) {
    showMsg('请输入邮箱和密码', 'error')
    return
  }
  busy.value = true
  try {
    await signIn(email.value, password.value)
    showMsg('登录成功！正在同步数据...', 'success')
    await syncNow()
    showMsg('登录成功，本地数据已同步到云端')
  } catch (e) {
    showMsg('登录失败：' + e.message, 'error')
  }
  busy.value = false
}

async function doRegister() {
  if (!email.value || !password.value) {
    showMsg('请输入邮箱和密码', 'error')
    return
  }
  if (password.value.length < 6) {
    showMsg('密码至少 6 位', 'error')
    return
  }
  busy.value = true
  try {
    const result = await signUp(email.value, password.value)
    if (result.needsEmailConfirm) {
      showMsg('注册成功！请到邮箱点击确认链接后，再回来登录', 'error')
    } else {
      showMsg('注册成功！已自动登录并同步数据')
      await syncNow()
    }
  } catch (e) {
    showMsg('注册失败：' + e.message, 'error')
  }
  busy.value = false
}

async function doSyncNow() {
  busy.value = true
  try {
    const res = await syncNow()
    if (res.success) {
      syncResult.value = `已推送 ${res.pushed} 项数据到云端`
      syncResultClass.value = 'ok'
      lastSyncText.value = new Date().toLocaleTimeString('zh-CN')
    } else {
      syncResult.value = res.error || '同步失败'
      syncResultClass.value = 'err'
    }
  } catch (e) {
    syncResult.value = '同步失败：' + e.message
    syncResultClass.value = 'err'
  }
  busy.value = false
}

async function doPullNow() {
  busy.value = true
  try {
    const res = await pullAllFromCloud()
    if (res.success) {
      syncResult.value = `已从云端拉取 ${res.pulled} 项数据`
      syncResultClass.value = 'ok'
      lastSyncText.value = new Date().toLocaleTimeString('zh-CN')
      showMsg('拉取完成，刷新页面后生效', 'success')
    } else {
      syncResult.value = res.error || '拉取失败'
      syncResultClass.value = 'err'
    }
  } catch (e) {
    syncResult.value = '拉取失败：' + e.message
    syncResultClass.value = 'err'
  }
  busy.value = false
}

async function doLogout() {
  busy.value = true
  await signOut()
  busy.value = false
  showMsg('已退出登录')
}

function onAuthStateChange() {
  loggedIn.value = isLoggedIn()
}

onMounted(() => {
  unsubscribe = onAuthChange(onAuthStateChange)
  const sess = getSession()
  if (sess && sess.lastSync) {
    lastSyncText.value = new Date(sess.lastSync).toLocaleTimeString('zh-CN')
  }
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.cloud-sync {
  padding: 4px 0;
}

.section-title {
  font-size: 0.92rem;
  color: var(--text-accent);
  letter-spacing: 0.06em;
  margin-bottom: 6px;
  font-weight: normal;
}

.section-desc {
  font-size: 0.76rem;
  color: var(--text-faint);
  margin-bottom: 12px;
}

.form-group {
  margin-bottom: 8px;
}

.text-input {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-primary);
  background: var(--bg-input, rgba(140, 160, 180, 0.06));
  color: var(--text-primary);
  font-size: 0.82rem;
  font-family: inherit;
  transition: border-color 0.3s;
}
.text-input:focus {
  outline: none;
  border-color: var(--border-accent);
}

.form-actions {
  display: flex;
  gap: 8px;
  margin: 10px 0 4px;
  flex-wrap: wrap;
}

.sync-btn {
  flex: 1;
  padding: 9px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 90px;
}
.sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sync-btn.login {
  background: rgba(140, 180, 200, 0.15);
  color: var(--text-primary);
  border: 1px solid rgba(140, 180, 200, 0.3);
}
.sync-btn.login:hover:not(:disabled) {
  background: rgba(140, 180, 200, 0.25);
}

.sync-btn.register,
.sync-btn.pull {
  background: rgba(140, 160, 180, 0.08);
  color: var(--text-primary);
  border: 1px solid rgba(140, 160, 180, 0.2);
}
.sync-btn.register:hover:not(:disabled),
.sync-btn.pull:hover:not(:disabled) {
  background: rgba(140, 160, 180, 0.15);
}

.sync-btn.logout {
  background: none;
  color: var(--color-danger-dim);
  border: 1px solid rgba(200, 140, 140, 0.15);
}
.sync-btn.logout:hover:not(:disabled) {
  color: var(--color-danger);
  border-color: rgba(200, 140, 140, 0.3);
}

.form-hint {
  font-size: 0.68rem;
  color: var(--text-faint);
  margin: 8px 0 0;
}

.state-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 0.8rem;
}
.state-label {
  color: var(--text-accent-dim);
}
.state-value {
  color: var(--text-primary);
}
.state-value.ok {
  color: var(--color-success);
}
.state-value.err {
  color: var(--color-danger);
}

.sync-msg {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 3px;
  font-size: 0.76rem;
}
.sync-msg.success {
  background: rgba(140, 180, 140, 0.1);
  color: #a0c8a0;
  border: 1px solid rgba(140, 180, 140, 0.2);
}
.sync-msg.error {
  background: rgba(200, 140, 140, 0.1);
  color: #c8a0a0;
  border: 1px solid rgba(200, 140, 140, 0.2);
}

.msg-fade-enter-active,
.msg-fade-leave-active {
  transition: all 0.3s ease;
}
.msg-fade-enter-from,
.msg-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
