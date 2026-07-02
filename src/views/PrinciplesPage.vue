<template>
  <div class="principles-page">
    <div class="page-header">
      <router-link to="/" class="back-btn">← 返回</router-link>
      <div class="header-center">
        <h1 class="page-title">塔罗原理</h1>
        <h2 class="page-subtitle">Principia Tarotica</h2>
      </div>
      <button class="add-btn" @click="openNewArticle">+ 新建文章</button>
    </div>

    <div class="mystic-separator">
      <span>✦ ◈ ✦</span>
    </div>

    <!-- 文章列表 -->
    <div class="articles-list" v-if="principles.length > 0">
      <div
        v-for="p in principles"
        :key="p.id"
        class="article-card"
        @click="openArticle(p)"
      >
        <div class="article-card-body">
          <div class="article-color-bar" :style="{ background: p.color }"></div>
          <div class="article-card-content">
            <h3 class="article-title">{{ p.title || '未命名文章' }}</h3>
            <p class="article-preview" v-html="getPreview(p.content)"></p>
          </div>
        </div>
        <div class="article-card-bottom">
          <span class="article-time">{{ formatTime(p.updatedAt) }}</span>
          <div class="article-actions" @click.stop>
            <button class="article-action-btn" @click="openArticle(p)" title="编辑">✎</button>
            <button class="article-action-btn delete" @click="removeArticle(p.id)" title="删除">×</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <div class="empty-icon">📜</div>
      <p>还没有文章</p>
      <p class="sub">点击"+ 新建文章"开始撰写塔罗原理</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { usePrinciples, createPrinciple, savePrinciples } from '../composables/useStorage.js'

const router = useRouter()
const { principles, addPrinciple, deletePrinciple } = usePrinciples()

function openNewArticle() {
  const p = addPrinciple('新文章')
  // 立即写入 localStorage，确保即使详情页还没打开，数据也不丢
  savePrinciples(principles.value)
  router.push(`/principles/${p.id}`)
}

function openArticle(p) {
  router.push(`/principles/${p.id}`)
}

function removeArticle(id) {
  const article = principles.value.find(p => p.id === id)
  const title = article?.title || '这篇文章'
  if (confirm(`确定删除"${title}"？此操作不可恢复。`)) {
    deletePrinciple(id)
  }
}

function getPreview(html) {
  if (!html) return '<span style="opacity:0.3">暂无内容</span>'
  const text = html.replace(/<[^>]+>/g, '').slice(0, 120)
  return text || '<span style="opacity:0.3">暂无内容</span>'
}

function formatTime(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
</script>

<style scoped>
.principles-page {
  padding: 10px 0 40px;
  max-width: 900px;
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

.add-btn {
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
.add-btn:hover {
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

/* ==================== 文章列表 ==================== */
.articles-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.article-card {
  background: var(--card-gradient);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.35s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.article-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-primary);
}

.article-card-body {
  display: flex;
  gap: 14px;
  padding: 16px 18px;
  flex: 1;
}

.article-color-bar {
  width: 4px;
  border-radius: 2px;
  flex-shrink: 0;
  opacity: 0.7;
}

.article-card-content {
  flex: 1;
  min-width: 0;
}

.article-title {
  font-size: 0.98rem;
  font-weight: normal;
  color: var(--text-primary);
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.article-preview {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 18px;
  border-top: 1px solid var(--border-lighter);
}

.article-time {
  font-size: 0.68rem;
  color: var(--text-faint);
}

.article-actions {
  display: flex;
  gap: 4px;
}

.article-action-btn {
  background: none;
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 2px 6px;
  border-radius: 3px;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}
.article-action-btn:hover {
  color: var(--text-accent);
  background: var(--btn-bg);
}
.article-action-btn.delete:hover {
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
  .add-btn {
    order: 3;
    width: 100%;
    text-align: center;
  }
  .article-card-body {
    padding: 12px 14px;
    gap: 10px;
  }
  .article-title {
    font-size: 0.9rem;
  }
}
</style>
