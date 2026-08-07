<template>
  <Teleport to="body">
    <transition name="backdrop-fade">
      <div class="backdrop" v-if="visible" @click.self="close">
        <transition name="panel-slide">
          <div class="panel" v-if="visible">
            <div class="panel-header">
              <h2>⚙ 数据管理</h2>
              <button class="close-btn" @click="close">✕</button>
            </div>

            <div class="panel-body">
              <!-- 云端同步 -->
              <CloudSyncPanel />

              <div class="divider"></div>

              <!-- 当前数据概况 -->
              <div class="info-section">
                <div class="info-row">
                  <span class="info-label">内容卡片总数</span>
                  <span class="info-value">{{ stats.cardCount }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">自定义图片</span>
                  <span class="info-value">{{ stats.imageCount }} 张</span>
                </div>
                <div class="info-row">
                  <span class="info-label">牌面笔记</span>
                  <span class="info-value">{{ stats.noteCount }} 张牌</span>
                </div>
                <div class="info-row">
                  <span class="info-label">案例集</span>
                  <span class="info-value">{{ stats.caseCount }} 个</span>
                </div>
                <div class="info-row">
                  <span class="info-label">上次备份</span>
                  <span class="info-value">{{ stats.lastBackup || '从未备份' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">存储用量</span>
                  <span class="info-value">{{ stats.storageSize }}</span>
                </div>
              </div>

              <div class="divider"></div>

              <!-- 即时保存状态 -->
              <div class="auto-save-status">
                <span class="status-dot"></span>
                <span>所有修改即时自动保存到浏览器本地存储</span>
              </div>

              <div class="divider"></div>

              <!-- 操作按钮 -->
              <div class="action-buttons">
                <button class="action-btn export-btn" @click="doExport" :disabled="exporting">
                  <span class="btn-icon">📥</span>
                  <span>{{ exporting ? '导出中...' : '导出备份文件' }}</span>
                </button>
                <p class="btn-hint">下载 JSON 文件到电脑，用于换机迁移或存档</p>

                <label class="action-btn import-btn">
                  <span class="btn-icon">📤</span>
                  <span>导入备份文件</span>
                  <input type="file" accept=".json" @change="doImport" hidden />
                </label>
                <p class="btn-hint">选择之前导出的备份文件恢复数据</p>

                <div class="import-mode" v-if="importReady">
                  <p class="mode-label">导入模式：</p>
                  <label class="mode-option">
                    <input type="radio" v-model="importMode" value="merge" />
                    <span>合并（保留现有 + 新增备份数据）</span>
                  </label>
                  <label class="mode-option">
                    <input type="radio" v-model="importMode" value="replace" />
                    <span>替换（清空现有，完全使用备份数据）</span>
                  </label>
                  <div class="mode-actions">
                    <button class="confirm-btn" @click="confirmImport">确认导入</button>
                    <button class="cancel-btn" @click="cancelImport">取消</button>
                  </div>
                </div>
              </div>

              <!-- 消息提示 -->
              <transition name="msg-fade">
                <div class="message" :class="msgType" v-if="message">
                  {{ message }}
                </div>
              </transition>

              <!-- 危险操作 -->
              <div class="divider"></div>
              <div class="danger-section">
                <button class="danger-btn" @click="confirmClear">
                  <span class="btn-icon">⚠</span>
                  <span>清除所有本地数据</span>
                </button>
                <p class="danger-hint" v-if="clearConfirm">
                  再次点击确认清除（此操作不可撤销！）
                  <button class="danger-confirm-btn" @click="doClear">确认清除</button>
                  <button class="cancel-btn" @click="clearConfirm = false">取消</button>
                </p>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { exportBackup, importBackup, getLastBackupTime } from '../composables/useStorage.js'
import CloudSyncPanel from './CloudSyncPanel.vue'

const props = defineProps({
  visible: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'dataChanged'])

const message = ref('')
const msgType = ref('success')
const exporting = ref(false)
const importMode = ref('merge')
const importReady = ref(false)
const pendingFile = ref(null)
const clearConfirm = ref(false)

const stats = reactive({
  cardCount: 0,
  imageCount: 0,
  noteCount: 0,
  caseCount: 0,
  lastBackup: '',
  storageSize: '计算中...'
})

function updateStats() {
  let cardCount = 0
  try {
    const raw = localStorage.getItem('tarot-app-data')
    if (raw) {
      const data = JSON.parse(raw)
      Object.values(data).forEach(arr => {
        if (Array.isArray(arr)) cardCount += arr.length
      })
    }
  } catch { /* ignore */ }

  let imageCount = 0
  try {
    const raw = localStorage.getItem('tarot-custom-images')
    if (raw) {
      imageCount = Object.keys(JSON.parse(raw)).length
    }
  } catch { /* ignore */ }

  let noteCount = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('tarot-note-')) noteCount++
  }

  let caseCount = 0
  try {
    const raw = localStorage.getItem('tarot-cases')
    if (raw) caseCount = JSON.parse(raw).length
  } catch { /* ignore */ }

  stats.cardCount = cardCount
  stats.imageCount = imageCount
  stats.noteCount = noteCount
  stats.caseCount = caseCount

  const last = getLastBackupTime()
  stats.lastBackup = last ? last.toLocaleString('zh-CN') : ''

  let totalSize = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('tarot-')) {
      totalSize += (localStorage.getItem(key) || '').length * 2
    }
  }
  if (totalSize < 1024) {
    stats.storageSize = totalSize + ' B'
  } else if (totalSize < 1024 * 1024) {
    stats.storageSize = (totalSize / 1024).toFixed(1) + ' KB'
  } else {
    stats.storageSize = (totalSize / (1024 * 1024)).toFixed(2) + ' MB'
  }
}

onMounted(() => updateStats())

function close() {
  importReady.value = false
  pendingFile.value = null
  clearConfirm.value = false
  message.value = ''
  emit('close')
}

function showMsg(text, type = 'success') {
  message.value = text
  msgType.value = type
  setTimeout(() => { message.value = '' }, 4000)
}

async function doExport() {
  exporting.value = true
  try {
    const result = await exportBackup()
    if (result.success) {
      showMsg(`导出成功！包含 ${result.cardCount} 条笔记和 ${result.imageCount} 张图片`)
      updateStats()
    }
  } catch (e) {
    showMsg('导出失败：' + e.message, 'error')
  }
  exporting.value = false
}

function doImport(e) {
  const file = e.target.files[0]
  if (!file) return
  pendingFile.value = file
  importReady.value = true
  e.target.value = ''
}

function cancelImport() {
  importReady.value = false
  pendingFile.value = null
}

async function confirmImport() {
  if (!pendingFile.value) return
  try {
    const result = await importBackup(pendingFile.value, importMode.value)
    if (result.success) {
      showMsg(`导入成功！${result.cardCount} 条笔记，${result.imageCount} 张图片已${importMode.value === 'merge' ? '合并' : '替换'}`)
      emit('dataChanged')
      updateStats()
    } else {
      showMsg(result.error || '导入失败', 'error')
    }
  } catch (e) {
    showMsg('导入失败：' + e.message, 'error')
  }
  importReady.value = false
  pendingFile.value = null
}

function confirmClear() {
  if (clearConfirm.value) {
    doClear()
  } else {
    clearConfirm.value = true
  }
}

function doClear() {
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('tarot-') || key.startsWith('tarot_'))) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k))
  clearConfirm.value = false
  showMsg('所有本地数据已清除')
  emit('dataChanged')
  updateStats()
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  width: 100%;
  max-width: 460px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: var(--shadow-modal);
  transition: background 0.4s ease, border-color 0.4s ease;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-light);
}

.panel-header h2 {
  font-size: 1rem;
  font-weight: normal;
  color: var(--text-accent);
  letter-spacing: 0.08em;
}

.close-btn {
  background: none;
  color: var(--text-accent-dim);
  font-size: 1.2rem;
  padding: 4px 8px;
  border-radius: 3px;
  transition: all 0.3s;
}
.close-btn:hover {
  color: var(--text-accent);
  background: var(--btn-bg);
}

.panel-body {
  padding: 20px;
}

.info-section {
  margin-bottom: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 0.82rem;
}

.info-label {
  color: var(--text-accent-dim);
}

.info-value {
  color: var(--text-primary);
}

.divider {
  height: 1px;
  background: var(--border-lighter);
  margin: 16px 0;
}

.auto-save-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--color-success);
  padding: 4px 0;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #7ab86c;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  transition: all 0.3s;
  cursor: pointer;
  text-align: center;
}

.export-btn {
  background: var(--btn-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}
.export-btn:hover:not(:disabled) {
  background: var(--btn-bg-hover);
  border-color: var(--border-accent);
}
.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.import-btn {
  background: rgba(140, 160, 180, 0.08);
  color: var(--text-primary);
  border: 1px solid rgba(140, 160, 180, 0.2);
}
.import-btn:hover {
  background: rgba(140, 160, 180, 0.15);
  border-color: rgba(160, 180, 200, 0.35);
}

.btn-icon {
  font-size: 1rem;
}

.btn-hint {
  font-size: 0.7rem;
  color: var(--text-faint);
  margin: -4px 0 8px 0;
  padding-left: 4px;
}

/* 导入模式 */
.import-mode {
  background: rgba(140, 160, 180, 0.06);
  border: 1px solid rgba(140, 160, 180, 0.15);
  border-radius: 4px;
  padding: 12px 14px;
  margin-top: 4px;
}

.mode-label {
  font-size: 0.78rem;
  color: var(--text-accent-dim);
  margin-bottom: 8px;
  display: block;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 0.8rem;
  color: var(--text-primary);
  cursor: pointer;
}
.mode-option input {
  accent-color: var(--text-accent);
}

.mode-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.confirm-btn {
  background: var(--color-success-dim);
  color: #a0c8a0;
  border: 1px solid rgba(140, 180, 140, 0.25);
  padding: 6px 16px;
  border-radius: 3px;
  font-size: 0.78rem;
  transition: all 0.3s;
}
.confirm-btn:hover {
  background: rgba(140, 180, 140, 0.25);
}

.cancel-btn {
  background: none;
  color: var(--text-muted);
  padding: 6px 12px;
  border-radius: 3px;
  font-size: 0.78rem;
  transition: all 0.3s;
}
.cancel-btn:hover {
  color: var(--text-secondary);
  background: var(--btn-bg);
}

/* 消息提示 */
.message {
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: 3px;
  font-size: 0.8rem;
  letter-spacing: 0.03em;
}
.message.success {
  background: rgba(140, 180, 140, 0.1);
  color: #a0c8a0;
  border: 1px solid rgba(140, 180, 140, 0.2);
}
.message.error {
  background: rgba(200, 140, 140, 0.1);
  color: #c8a0a0;
  border: 1px solid rgba(200, 140, 140, 0.2);
}

/* 危险操作 */
.danger-section {
  text-align: center;
}

.danger-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  color: var(--color-danger-dim);
  font-size: 0.78rem;
  padding: 6px 12px;
  border: 1px solid rgba(200, 140, 140, 0.15);
  border-radius: 3px;
  transition: all 0.3s;
}
.danger-btn:hover {
  color: var(--color-danger);
  border-color: rgba(200, 140, 140, 0.3);
  background: var(--color-danger-bg);
}

.danger-hint {
  margin-top: 10px;
  font-size: 0.75rem;
  color: var(--color-danger-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.danger-confirm-btn {
  background: rgba(200, 80, 80, 0.2);
  color: #e09090;
  border: 1px solid rgba(200, 100, 100, 0.3);
  padding: 4px 12px;
  border-radius: 3px;
  font-size: 0.75rem;
  transition: all 0.3s;
}
.danger-confirm-btn:hover {
  background: rgba(200, 80, 80, 0.35);
}

/* 过渡动画 */
.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.3s ease;
}
.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

.panel-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.panel-slide-leave-active {
  transition: all 0.2s ease;
}
.panel-slide-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
.panel-slide-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
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

@media (max-width: 500px) {
  .panel {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 4px;
  }
  .panel-header {
    padding: 14px 16px;
  }
  .panel-body {
    padding: 16px;
  }
  .info-row {
    font-size: 0.78rem;
  }
  .action-btn {
    font-size: 0.8rem;
    padding: 10px 14px;
  }
}
</style>
