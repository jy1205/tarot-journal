<template>
  <div class="detail-page" v-if="cardData">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <span class="breadcrumb">{{ cardData.name }} · {{ cardData.nameEn }}</span>
      <div class="top-actions">
        <label class="image-upload-btn" title="自定义图片">
          📷
          <input type="file" accept="image/*" @change="onImageUpload" hidden />
        </label>
        <button
          v-if="hasCustomImage"
          class="image-remove-btn"
          @click="removeCustomImage"
          title="移除自定义图片"
        >✕</button>
      </div>
    </div>

    <!-- 卡片展示 + 元信息 -->
    <div class="card-hero">
      <div class="hero-visual">
        <div class="hero-card" v-if="hasCustomImage">
          <img :src="customImage" :alt="cardData.name" />
        </div>
        <div class="hero-card" v-else>
          <img :src="generatedImage" :alt="cardData.name" />
        </div>
      </div>
      <div class="hero-info">
        <h1 class="hero-name">{{ cardData.name }}</h1>
        <h2 class="hero-name-en">{{ cardData.nameEn }}</h2>
        <p class="hero-keyword" v-if="cardData.keyword">{{ cardData.keyword }}</p>
        <p class="hero-astrology" v-if="cardData.astrology">{{ cardData.astrology }}</p>
        <div class="hero-meta" v-if="cardData.element">
          <span class="meta-tag">{{ cardData.element }}元素</span>
          <span class="meta-tag" v-if="cardData.suit">{{ cardData.suit }}</span>
        </div>
      </div>
      <!-- Everyday Inspiration 入口 — 右下角 -->
      <div class="inspiration-entry" @click="showInspirations = true">
        <span class="inspiration-star">✦</span>
        <span class="inspiration-label">Everyday Inspiration</span>
        <span v-if="inspirationCount > 0" class="inspiration-badge">{{ inspirationCount }}</span>
      </div>
    </div>

    <!-- 笔记编辑区 -->
    <div class="notebook-section">
      <RichEditor
        v-model="noteContent"
        placeholder="在此记录对这张牌的解读、笔记、感悟..."
        @update:modelValue="onContentChange"
      />
      <div class="notebook-footer">
        <span class="last-saved" v-if="lastSaved">
          最后保存：{{ lastSaved }}
        </span>
        <button class="clear-btn" @click="clearNote" v-if="noteContent">
          清空笔记
        </button>
      </div>
    </div>

    <!-- Inspirations 弹窗 -->
    <InspirationsModal
      v-if="showInspirations"
      :card-id="cardId"
      @close="onInspirationsClose"
    />
  </div>

  <div class="not-found" v-else>
    <p>未找到该塔罗牌</p>
    <router-link to="/">返回首页</router-link>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { majorArcana, minorArcana } from '../data/tarotData.js'
import { useCardData, useCustomImages } from '../composables/useStorage.js'
import { getCardImage } from '../data/cardImages.js'
import { compressImage } from '../utils/imageCompress.js'
import RichEditor from '../components/RichEditor.vue'
import InspirationsModal from '../components/InspirationsModal.vue'
import { loadInspirations } from '../composables/useStorage.js'
import { scheduleCloudSync } from '../composables/useCloudSync.js'

const route = useRoute()
const cardId = computed(() => route.params.cardId)

const allMajor = majorArcana
const allMinor = minorArcana.flatMap(s => s.cards)
const allCards = [...allMajor, ...allMinor]
const cardData = computed(() => allCards.find(c => c.id === cardId.value) || null)

// 笔记存储
const NOTE_PREFIX = 'tarot-note-'
const noteContent = ref('')
const saved = ref(true)
const lastSaved = ref('')
let saveTimer = null

function loadNote() {
  try {
    const key = NOTE_PREFIX + cardId.value
    const raw = localStorage.getItem(key)
    noteContent.value = raw || ''
  } catch {
    noteContent.value = ''
  }
  updateLastSaved()
}

function onContentChange() {
  saved.value = false
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveNote()
  }, 500)
}

function saveNote() {
  try {
    const key = NOTE_PREFIX + cardId.value
    if (noteContent.value) {
      localStorage.setItem(key, noteContent.value)
    } else {
      localStorage.removeItem(key)
    }
    saved.value = true
    updateLastSaved()
    scheduleCloudSync()
  } catch {
    // localStorage 满了
  }
}

function updateLastSaved() {
  const now = new Date()
  lastSaved.value = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`
}

function clearNote() {
  if (confirm('确定要清空这张牌的笔记吗？')) {
    noteContent.value = ''
    const key = NOTE_PREFIX + cardId.value
    localStorage.removeItem(key)
    saved.value = true
    scheduleCloudSync()
  }
}

// 自定义图片
const { images, setImage, removeImage } = useCustomImages()
const customImage = computed(() => images.value[cardId.value] || null)
const hasCustomImage = computed(() => !!customImage.value)
const generatedImage = ref('')

// Everyday Inspiration 状态
const showInspirations = ref(false)
const inspirationCount = ref(0)

function loadInspirationState() {
  const list = loadInspirations(cardId.value)
  inspirationCount.value = list.length
}

function onInspirationsClose() {
  showInspirations.value = false
  loadInspirationState()
}

onMounted(() => {
  loadNote()
  loadInspirationState()
  setTimeout(() => {
    if (cardData.value) {
      try {
        generatedImage.value = getCardImage(cardData.value)
      } catch { /* ignore */ }
    }
  }, 10)
})

watch(cardId, () => {
  loadNote()
  loadInspirationState()
  generatedImage.value = ''
  setTimeout(() => {
    if (cardData.value) {
      try {
        generatedImage.value = getCardImage(cardData.value)
      } catch { /* ignore */ }
    }
  }, 10)
})

async function onImageUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const dataUrl = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.7 })
    const result = await setImage(cardId.value, dataUrl)
    if (!result.success) {
      alert(result.error || '图片存储失败，请重试')
      return
    }
    console.log(`[CardDetail] 图片已存储: ${cardId.value}, 大小=${(dataUrl.length / 1024).toFixed(1)}KB`)
  } catch (err) {
    console.error('[CardDetail] 图片压缩/存储失败:', err)
    alert('图片处理失败，请重试')
  }
}

function removeCustomImage() {
  removeImage(cardId.value)
}
</script>

<style scoped>
.detail-page {
  padding: 10px 0 60px;
  max-width: 800px;
  margin: 0 auto;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 8px;
}

.back-btn {
  background: none;
  color: var(--text-secondary);
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  padding: 4px 0;
  transition: color 0.3s;
  border: none;
  cursor: pointer;
  font-family: inherit;
}
.back-btn:hover {
  color: var(--text-accent);
}

.breadcrumb {
  font-size: 0.78rem;
  color: var(--text-muted);
  letter-spacing: 0.08em;
}

.top-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.image-upload-btn {
  cursor: pointer;
  font-size: 1.1rem;
  padding: 4px 8px;
  border-radius: 3px;
  transition: background 0.3s;
  background: var(--btn-bg);
}
.image-upload-btn:hover {
  background: var(--btn-bg-hover);
}

.image-remove-btn {
  background: none;
  color: var(--color-danger-dim);
  font-size: 1rem;
  padding: 4px 8px;
  border-radius: 3px;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}
.image-remove-btn:hover {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

/* 卡片展示区 */
.card-hero {
  display: flex;
  gap: 30px;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-light);
  position: relative;
}

.hero-visual {
  flex-shrink: 0;
}

/* Everyday Inspiration 入口 — 右下角 */
.inspiration-entry {
  position: absolute;
  right: 0;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 14px 6px 10px;
  border-radius: 20px;
  border: 1px solid var(--border-accent-light);
  background: var(--bg-panel);
  transition: all 0.35s ease;
}

.inspiration-entry:hover {
  border-color: var(--border-accent);
  box-shadow: 0 0 16px rgba(201, 169, 110, 0.18);
  transform: translateY(-2px);
}

.inspiration-star {
  font-size: 1rem;
  color: var(--text-accent-dim);
  transition: color 0.3s;
  line-height: 1;
}

.inspiration-entry:hover .inspiration-star {
  color: var(--text-accent);
}

.inspiration-label {
  font-size: 0.72rem;
  color: var(--text-accent-dim);
  letter-spacing: 0.06em;
  transition: color 0.3s;
}

.inspiration-entry:hover .inspiration-label {
  color: var(--text-accent);
}

.inspiration-badge {
  background: var(--text-accent);
  color: var(--bg-primary);
  font-size: 0.6rem;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  line-height: 1;
  padding: 0 5px;
}

.hero-card {
  width: 150px;
  aspect-ratio: 3 / 5;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: var(--shadow-hero);
  border: 1px solid var(--border-primary);
}
.hero-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-name {
  font-size: 1.5rem;
  font-weight: normal;
  color: var(--text-accent);
  letter-spacing: 0.1em;
}

.hero-name-en {
  font-size: 0.85rem;
  font-weight: normal;
  color: var(--text-accent-dim);
  letter-spacing: 0.08em;
  margin-top: 4px;
}

.hero-keyword {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 12px;
  margin-bottom: 0;
  letter-spacing: 0.06em;
}

.hero-astrology {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 12px;
  letter-spacing: 0.06em;
}

.hero-meta {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.meta-tag {
  font-size: 0.7rem;
  color: var(--text-accent-dim);
  border: 1px solid var(--border-accent-light);
  padding: 2px 12px;
  border-radius: 20px;
}

/* 笔记本区域 */
.notebook-section {
  /* 去掉大框，编辑器自带边框 */
}

.notebook-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
}

.last-saved {
  font-size: 0.68rem;
  color: var(--text-faint);
}

.clear-btn {
  background: none;
  border: 1px solid var(--color-danger-border);
  color: var(--color-danger-dim);
  font-size: 0.72rem;
  padding: 4px 12px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
}
.clear-btn:hover {
  color: var(--color-danger);
  border-color: rgba(200, 120, 120, 0.4);
  background: var(--color-danger-bg);
}

.not-found {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-accent-dim);
}

@media (max-width: 600px) {
  .card-hero {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  .hero-card {
    width: 120px;
    margin: 0 auto;
  }
  .hero-meta {
    justify-content: center;
  }
  .hero-name {
    font-size: 1.3rem;
  }
}
</style>
