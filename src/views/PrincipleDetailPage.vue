<template>
  <div class="detail-page" v-if="article">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <router-link to="/principles" class="back-btn">← 塔罗原理</router-link>
      <div class="top-bar-right">
        <span class="save-status saved" v-if="saved">✓ 已保存</span>
        <span class="save-status unsaved" v-else>保存中...</span>
        <button class="btn-delete" @click="handleDelete">删除</button>
      </div>
    </div>

    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-color-bar" :style="{ background: article.color }"></div>
      <input
        class="title-input"
        v-model="articleTitle"
        placeholder="输入文章标题..."
      />
    </div>

    <div class="mystic-separator">
      <span>✦ ◈ ✦</span>
    </div>

    <!-- 富文本编辑区 -->
    <div class="editor-section">
      <RichEditor
        :modelValue="articleContent"
        placeholder="在此撰写塔罗原理文章..."
        @update:modelValue="onContentChange"
        @blur="onEditorBlur"
      />
    </div>

    <!-- 底部信息 -->
    <div class="detail-footer">
      <span class="meta-text" v-if="article.createdAt">
        创建于 {{ formatTime(article.createdAt) }}
      </span>
      <span class="meta-text" v-if="article.updatedAt !== article.createdAt">
        · 更新于 {{ formatTime(article.updatedAt) }}
      </span>
    </div>
  </div>

  <!-- 文章不存在 -->
  <div class="not-found" v-else-if="loaded">
    <div class="empty-icon">📜</div>
    <p>文章不存在或已被删除</p>
    <router-link to="/principles" class="back-link">← 返回列表</router-link>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePrinciples } from '../composables/useStorage.js'
import RichEditor from '../components/RichEditor.vue'

const route = useRoute()
const router = useRouter()
const { principles, updatePrinciple, deletePrinciple, getPrinciple } = usePrinciples()

const articleId = computed(() => route.params.articleId)
const article = computed(() => getPrinciple(articleId.value))

const articleTitle = ref('')
const articleContent = ref('')
const saved = ref(true)
const loaded = ref(false)
let saveTimer = null

// 加载文章内容
function loadArticle() {
  const a = article.value
  if (a) {
    articleTitle.value = a.title || ''
    articleContent.value = a.content || ''
  }
  loaded.value = true
  saved.value = true
}

onMounted(() => {
  loadArticle()
})

onBeforeUnmount(() => {
  // 组件卸载时立即保存，清除所有待执行的防抖
  clearTimeout(saveTimer)
  if (article.value && !saved.value) {
    updatePrinciple(articleId.value, {
      title: articleTitle.value.trim() || '未命名文章',
      content: articleContent.value,
    })
    saved.value = true
  }
})

watch(articleId, () => {
  loadArticle()
})

// 防抖保存：每次输入后 300ms 保存一次
function onContentChange(newContent) {
  if (!article.value) return
  articleContent.value = newContent
  saved.value = false
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    doSave(newContent)
  }, 300)
}

function doSave(content) {
  if (!article.value) return
  updatePrinciple(articleId.value, {
    title: articleTitle.value.trim() || '未命名文章',
    content: content || articleContent.value,
  })
  saved.value = true
}

// 编辑器失焦时立即保存
function onEditorBlur() {
  clearTimeout(saveTimer)
  if (article.value && !saved.value) {
    doSave()
  }
}

// 标题改变时也触发保存
watch(articleTitle, () => {
  if (loaded.value && article.value) {
    saved.value = false
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      updatePrinciple(articleId.value, {
        title: articleTitle.value.trim() || '未命名文章',
        content: articleContent.value,
      })
      saved.value = true
    }, 300)
  }
})

function handleDelete() {
  const title = articleTitle.value || '这篇文章'
  if (confirm(`确定删除"${title}"？此操作不可恢复。`)) {
    deletePrinciple(articleId.value)
    router.push('/principles')
  }
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
</script>

<style scoped>
.detail-page {
  padding: 10px 0 40px;
  max-width: 860px;
  margin: 0 auto;
}

/* 顶部栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.back-btn {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.3s;
}
.back-btn:hover { color: var(--text-accent); }

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
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
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
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

/* 标题区域 */
.title-section {
  display: flex;
  align-items: stretch;
  gap: 14px;
  margin-bottom: 8px;
}

.title-color-bar {
  width: 4px;
  border-radius: 2px;
  flex-shrink: 0;
  opacity: 0.8;
}

.title-input {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px dashed var(--border-input);
  color: var(--text-accent);
  font-size: 1.35rem;
  font-family: inherit;
  letter-spacing: 0.08em;
  padding: 8px 2px;
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

.mystic-separator {
  text-align: center;
  color: var(--text-faint);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  padding: 8px 0 16px;
}

/* 编辑器区域 */
.editor-section {
  background: var(--bg-panel);
  border: 1px solid var(--border-lighter);
  border-radius: 6px;
  min-height: 400px;
  margin-bottom: 20px;
  transition: background 0.4s ease, border-color 0.4s ease;
}

/* 底部 */
.detail-footer {
  text-align: center;
  padding: 16px 0;
}

.meta-text {
  font-size: 0.72rem;
  color: var(--text-faint);
  letter-spacing: 0.04em;
}

/* 文章不存在 */
.not-found {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-faint);
}
.not-found .empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.4;
}
.not-found p {
  font-size: 0.9rem;
  margin-bottom: 20px;
}
.back-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.3s;
}
.back-link:hover { color: var(--text-accent); }

@media (max-width: 600px) {
  .title-input {
    font-size: 1.1rem;
  }
  .editor-section {
    min-height: 300px;
  }
}
</style>
