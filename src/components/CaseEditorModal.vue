<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div class="case-editor-overlay" v-if="visible" @click.self="handleClose">
        <Transition name="panel-slide">
          <div class="case-editor-panel" v-if="visible">
            <!-- 顶部标题栏 -->
            <div class="panel-header">
              <input
                class="title-input"
                v-model="editData.title"
                placeholder="输入案例标题..."
                @change="markDirty"
              />
              <button class="close-btn" @click="handleClose" title="关闭">✕</button>
            </div>

            <!-- 卡片编辑区：图片(横栏) + 文字 -->
            <div class="panel-body">
              <!-- 顶部横向图片区 -->
              <div class="image-section">
                <div
                  class="image-drop-zone"
                  @click="triggerFileInput"
                  :class="{ 'has-image': editData.image }"
                >
                  <img
                    v-if="editData.image"
                    :src="editData.image"
                    class="case-image"
                    alt="案例图片"
                  />
                  <div v-else class="image-placeholder">
                    <span class="placeholder-icon">🖼</span>
                    <span class="placeholder-text">点击上传图片</span>
                  </div>
                  <div class="image-actions" v-if="editData.image">
                    <button class="img-btn change" @click.stop="triggerFileInput" title="更换图片">
                      📷 更换
                    </button>
                    <button class="img-btn remove" @click.stop="removeImage" title="移除图片">
                      ✕ 移除
                    </button>
                  </div>
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/*"
                    @change="onImagePicked"
                    hidden
                  />
                </div>
              </div>

              <!-- 下方文字编辑区 -->
              <div class="text-section">
                <textarea
                  class="text-editor"
                  v-model="editData.content"
                  placeholder="在此书写塔罗解读记录...&#10;&#10;可以记录牌面、解读思路、心得体会等"
                  @input="markDirty"
                ></textarea>
              </div>
            </div>

            <!-- 底部操作栏 -->
            <div class="panel-footer">
              <div class="footer-meta">
                <span v-if="editData.createdAt" class="meta-text">
                  创建于 {{ formatTime(editData.createdAt) }}
                </span>
              </div>
              <div class="footer-actions">
                <span class="save-status saved" v-if="saved">✓ 已保存</span>
                <span class="save-status unsaved" v-else>未保存</span>
                <button
                  class="btn-delete"
                  v-if="editData.id"
                  @click="handleDelete"
                >删除</button>
                <button class="btn-save" @click="handleSave">保存</button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { useCases } from '../composables/useStorage.js'
import { compressImage } from '../utils/imageCompress.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  caseData: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const { createCase, updateCase, deleteCase } = useCases()

const editData = reactive({
  id: '',
  title: '',
  content: '',
  image: '',
  color: '',
  createdAt: 0,
})

const saved = ref(true)
const fileInputRef = ref(null)
let saveTimer = null

// 监听外部传入的 caseData 变化
watch(() => props.caseData, (val) => {
  if (val) {
    editData.id = val.id || ''
    editData.title = val.title || ''
    editData.content = val.content || ''
    editData.image = val.image || ''
    editData.color = val.color || ''
    editData.createdAt = val.createdAt || 0
  }
}, { immediate: true })

// 新建模式：重置为空
watch(() => props.visible, (val) => {
  if (val) {
    if (!props.caseData) {
      // 新建模式
      editData.id = ''
      editData.title = ''
      editData.content = ''
      editData.image = ''
      editData.color = ''
      editData.createdAt = 0
    }
    saved.value = true
  }
})

function markDirty() {
  saved.value = false
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    handleSave()
  }, 1500)
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function onImagePicked(e) {
  const file = e.target.files[0]
  if (!file) return

  try {
    const dataUrl = await compressImage(file, { maxWidth: 800, maxHeight: 600, quality: 0.7 })
    editData.image = dataUrl
    markDirty()
    console.log(`[CaseEditor] 图片已压缩: ${(dataUrl.length / 1024).toFixed(1)}KB`)
  } catch (err) {
    console.error('[CaseEditor] 图片压缩失败:', err)
  }
  e.target.value = ''
}

function removeImage() {
  editData.image = ''
  markDirty()
}

function handleSave() {
  clearTimeout(saveTimer)

  if (!editData.title.trim() && !editData.content.trim() && !editData.image) {
    // 空内容不保存
    saved.value = true
    return
  }

  const title = editData.title.trim() || '未命名案例'
  const payload = {
    title,
    content: editData.content,
    image: editData.image || '',
  }

  if (editData.id) {
    // 更新已有案例
    updateCase(editData.id, payload)
  } else {
    // 创建新案例
    const now = Date.now()
    const colors = ['#8B6B4A', '#6B4E71', '#4A6B6B', '#7B5B3A', '#5B4A6B',
                    '#4A5B6B', '#6B5B4A', '#3A5B5B', '#7A6B5A', '#5A6B7A']
    const newCase = createCase(title)
    updateCase(newCase.id, { ...payload, color: colors[Math.floor(Math.random() * colors.length)] })
    editData.id = newCase.id
    editData.createdAt = newCase.createdAt
  }

  saved.value = true
  emit('saved')
}

function handleDelete() {
  if (!editData.id) return
  if (confirm('确定删除这个案例？此操作不可恢复。')) {
    deleteCase(editData.id)
    emit('close')
  }
}

function handleClose() {
  if (!saved.value) {
    handleSave()
  }
  emit('close')
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
</script>

<style scoped>
/* ==================== 遮罩层 ==================== */
.case-editor-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* ==================== 面板 ==================== */
.case-editor-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  box-shadow: var(--shadow-modal);
  width: 100%;
  max-width: 780px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ==================== 头部 ==================== */
.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-lighter);
  flex-shrink: 0;
}

.title-input {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px dashed var(--border-input);
  color: var(--text-accent);
  font-size: 1.15rem;
  font-family: inherit;
  letter-spacing: 0.08em;
  padding: 6px 2px;
  outline: none;
  transition: border-color 0.3s;
}
.title-input:focus {
  border-bottom-color: var(--border-accent);
  border-bottom-style: solid;
}
.title-input::placeholder {
  color: var(--text-faint);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border-lighter);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}
.close-btn:hover {
  color: var(--color-danger);
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
}

/* ==================== 主体：图片(上) + 文字(下) ==================== */
.panel-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* --- 顶部横向图片区 --- */
.image-section {
  flex-shrink: 0;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border-lighter);
  display: flex;
  justify-content: center;
}

.image-drop-zone {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 4 / 3;
  border: 2px dashed var(--border-accent-light);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.image-drop-zone:hover {
  border-color: var(--border-accent);
  background: rgba(201, 169, 110, 0.05);
}
.image-drop-zone.has-image {
  border-style: solid;
  border-color: var(--border-primary);
}

.case-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-placeholder {
  text-align: center;
  color: var(--text-faint);
  padding: 16px;
}
.placeholder-icon {
  font-size: 1.6rem;
  display: block;
  margin-bottom: 4px;
  opacity: 0.5;
}
.placeholder-text {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.image-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 0;
  opacity: 0;
  transition: opacity 0.3s;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  padding: 16px 8px 6px;
  justify-content: center;
}
.image-drop-zone:hover .image-actions {
  opacity: 1;
}

.img-btn {
  background: rgba(0,0,0,0.5);
  color: #d4c5b2;
  border: 1px solid rgba(180,150,120,0.3);
  padding: 3px 10px;
  font-size: 0.7rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s;
  letter-spacing: 0.04em;
}
.img-btn.change {
  border-radius: 3px 0 0 3px;
}
.img-btn.remove {
  border-radius: 0 3px 3px 0;
  border-left: none;
}
.img-btn:hover {
  background: rgba(0,0,0,0.7);
  color: #c9a96e;
}
.img-btn.remove:hover {
  color: #dc6464;
}

/* --- 下方文字区 --- */
.text-section {
  flex: 1;
  min-height: 0;
  display: flex;
}

.text-editor {
  width: 100%;
  height: 100%;
  min-height: 260px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.88rem;
  line-height: 1.9;
  font-family: inherit;
  letter-spacing: 0.04em;
  padding: 16px 20px 20px;
  resize: none;
  outline: none;
}
.text-editor::placeholder {
  color: var(--text-faint);
}

/* ==================== 底部 ==================== */
.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid var(--border-lighter);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
}

.footer-meta {
  flex: 1;
}
.meta-text {
  font-size: 0.7rem;
  color: var(--text-faint);
  letter-spacing: 0.04em;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.save-status {
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}
.save-status.saved { color: var(--color-success); }
.save-status.unsaved { color: var(--text-muted); }

.btn-delete {
  background: none;
  border: 1px solid var(--color-danger-border);
  color: var(--color-danger-dim);
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: 0.04em;
  transition: all 0.3s;
}
.btn-delete:hover {
  color: var(--color-danger);
  border-color: rgba(200, 120, 120, 0.4);
  background: var(--color-danger-bg);
}

.btn-save {
  background: var(--btn-bg-hover);
  color: var(--text-accent);
  border: 1px solid var(--border-primary);
  padding: 7px 20px;
  border-radius: 4px;
  font-size: 0.82rem;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: 0.06em;
  transition: all 0.3s;
}
.btn-save:hover {
  background: var(--btn-bg-active);
  border-color: var(--border-accent);
}

/* ==================== 动画 ==================== */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.panel-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.panel-slide-leave-active {
  transition: all 0.2s ease-in;
}
.panel-slide-enter-from {
  opacity: 0;
  transform: scale(0.92) translateY(20px);
}
.panel-slide-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

/* ==================== 响应式 ==================== */
@media (max-width: 680px) {
  .case-editor-panel {
    max-width: 100%;
    max-height: 95vh;
    border-radius: 6px;
  }

  .image-drop-zone {
    max-width: 100%;
  }

  .text-editor {
    min-height: 180px;
  }

  .title-input {
    font-size: 1rem;
  }
}
</style>
