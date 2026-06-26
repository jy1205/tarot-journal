<template>
  <div class="cases-page">
    <div class="page-header">
      <router-link to="/" class="back-btn">← 返回</router-link>
      <div class="header-center">
        <h1 class="page-title">案例集</h1>
        <h2 class="page-subtitle">塔罗解读 · 实践记录</h2>
      </div>
      <button class="add-case-btn" @click="openNewCase">+ 新建案例</button>
    </div>

    <div class="mystic-separator">
      <span>✦ ◈ ✦</span>
    </div>

    <!-- 案例卡片列表 -->
    <div class="cases-grid" v-if="cases.length > 0">
      <div
        v-for="c in cases"
        :key="c.id"
        class="case-card"
        @click="openEditCase(c)"
      >
        <!-- 卡片内部：图片 + 文字预览 -->
        <div class="case-card-inner">
          <div class="case-card-image" v-if="c.image">
            <img :src="c.image" :alt="c.title" />
          </div>
          <div class="case-card-image case-card-image-placeholder" v-else>
            <span class="no-image-icon">📖</span>
          </div>
          <div class="case-card-body">
            <h3 class="case-title">{{ c.title || '未命名案例' }}</h3>
            <p class="case-preview" v-html="getPreview(c.content)"></p>
          </div>
        </div>
        <div class="case-card-bottom">
          <span class="case-time">{{ formatTime(c.updatedAt) }}</span>
          <div class="case-actions" @click.stop>
            <button class="case-action-btn" @click="openEditCase(c)" title="编辑">✎</button>
            <button class="case-action-btn delete" @click="removeCase(c.id)" title="删除">×</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <div class="empty-icon">📖</div>
      <p>还没有案例集</p>
      <p class="sub">点击"+ 新建案例"开始记录你的塔罗解读实践</p>
    </div>

    <!-- 案例编辑弹窗 -->
    <CaseEditorModal
      :visible="editorVisible"
      :caseData="editingCase"
      @close="closeEditor"
      @saved="onCaseSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCases } from '../composables/useStorage.js'
import CaseEditorModal from '../components/CaseEditorModal.vue'

const { cases, createCase, deleteCase, updateCase } = useCases()

// ==================== 编辑弹窗 ====================

const editorVisible = ref(false)
const editingCase = ref(null)

function openNewCase() {
  editingCase.value = null  // 新建模式
  editorVisible.value = true
}

function openEditCase(c) {
  // 传入案例数据的浅拷贝，确保弹窗内编辑不会直接修改列表
  editingCase.value = { ...c }
  editorVisible.value = true
}

function closeEditor() {
  editorVisible.value = false
  editingCase.value = null
}

function onCaseSaved() {
  // 数据已通过 useCases 单例自动同步，无需额外处理
}

// ==================== 删除 ====================

function removeCase(id) {
  if (confirm('确定删除这个案例？此操作不可恢复。')) {
    deleteCase(id)
    // 如果正在编辑被删除的案例，关闭弹窗
    if (editingCase.value && editingCase.value.id === id) {
      closeEditor()
    }
  }
}

// ==================== 工具函数 ====================

function getPreview(html) {
  if (!html) return '<span style="opacity:0.3">暂无文字记录</span>'
  const text = html.replace(/<[^>]+>/g, '').slice(0, 80)
  return text || '<span style="opacity:0.3">暂无文字记录</span>'
}

function formatTime(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
</script>

<style scoped>
.cases-page {
  padding: 10px 0 40px;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.back-btn {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.3s;
}
.back-btn:hover { color: var(--text-accent); }

.header-center {
  text-align: center;
  flex: 1;
}

.page-title {
  font-size: 1.4rem;
  font-weight: normal;
  color: var(--text-accent);
  letter-spacing: 0.12em;
}

.page-subtitle {
  font-size: 0.8rem;
  font-weight: normal;
  color: var(--text-accent-dim);
  letter-spacing: 0.1em;
  margin-top: 4px;
}

.add-case-btn {
  background: var(--btn-bg);
  color: var(--text-accent);
  border: 1px solid var(--border-primary);
  padding: 8px 18px;
  border-radius: 4px;
  font-size: 0.82rem;
  letter-spacing: 0.05em;
  transition: all 0.3s;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}
.add-case-btn:hover {
  background: var(--btn-bg-hover);
  border-color: var(--border-accent);
}

.mystic-separator {
  text-align: center;
  color: var(--text-faint);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  padding: 8px 0 20px;
}

/* ==================== 卡片网格 ==================== */
.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.case-card {
  background: var(--card-gradient);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.35s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.case-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-primary);
}

/* --- 卡片内部：图片 + 文字 --- */
.case-card-inner {
  display: flex;
  gap: 14px;
  padding: 16px;
  flex: 1;
}

.case-card-image {
  width: 80px;
  height: 107px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--border-lighter);
  background: var(--bg-tertiary);
}
.case-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.case-card-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}
.no-image-icon {
  font-size: 1.5rem;
  opacity: 0.3;
}

.case-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.case-title {
  font-size: 0.95rem;
  font-weight: normal;
  color: var(--text-primary);
  letter-spacing: 0.06em;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.case-preview {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.6;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* --- 卡片底部 --- */
.case-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-top: 1px solid var(--border-lighter);
}

.case-time {
  font-size: 0.68rem;
  color: var(--text-faint);
}

.case-actions {
  display: flex;
  gap: 4px;
}

.case-action-btn {
  background: none;
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 2px 6px;
  border-radius: 3px;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}
.case-action-btn:hover {
  color: var(--text-accent);
  background: var(--btn-bg);
}
.case-action-btn.delete:hover {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

/* ==================== 空状态 ==================== */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-faint);
}
.empty-icon { font-size: 3rem; margin-bottom: 16px; opacity: 0.4; }
.empty-state p { font-size: 0.9rem; letter-spacing: 0.06em; }
.empty-state .sub { font-size: 0.78rem; margin-top: 6px; opacity: 0.7; }

/* ==================== 响应式 ==================== */
@media (max-width: 600px) {
  .page-header {
    flex-wrap: wrap;
    gap: 8px;
  }
  .add-case-btn {
    order: 3;
    width: 100%;
    text-align: center;
  }
  .cases-grid {
    grid-template-columns: 1fr;
  }
  .case-card-inner {
    gap: 12px;
    padding: 12px;
  }
  .case-card-image {
    width: 64px;
    height: 85px;
  }
}
</style>
