<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="close">
      <div class="modal-stage">
        <!-- 走马灯卡片区 -->
        <div
          class="cards-track"
          ref="trackRef"
          @wheel.prevent="onWheel"
          v-if="cards.length > 0"
        >
          <div
            v-for="(card, idx) in cards"
            :key="card.id"
            class="float-card"
            :class="{ active: activeIndex === idx }"
            @click="activeIndex = idx"
          >
            <!-- 右上角删除按钮 -->
            <button
              class="card-delete"
              @click.stop="deleteCard(idx)"
              title="删除此卡片"
            >✕</button>

            <!-- 卡片面 — 可编辑 -->
            <div class="card-face">
              <span class="card-number">{{ idx + 1 }}</span>
              <textarea
                class="card-input"
                v-model="card.content"
                placeholder="写下灵感..."
                @input="onCardChange"
                @click.stop
              ></textarea>
            </div>
          </div>

          <!-- 末尾的 + 号卡片 -->
          <div class="float-card add-card" @click="addCard">
            <div class="card-face add-face">
              <span class="add-icon">+</span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-card" @click="addCard">
            <span class="add-icon">+</span>
            <p class="empty-text">添加灵感卡片</p>
          </div>
        </div>

        <!-- 底部轻量信息 -->
        <div class="stage-footer" v-if="cards.length > 0">
          <span class="footer-info">{{ activeIndex + 1 }} / {{ cards.length }}</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  loadInspirations,
  saveInspirations,
  createInspiration,
} from '../composables/useStorage.js'

const props = defineProps({
  cardId: { type: String, required: true },
})

const emit = defineEmits(['close'])

const cards = reactive([])
const activeIndex = ref(0)
const trackRef = ref(null)
let saveTimer = null

// 加载
onMounted(() => {
  const data = loadInspirations(props.cardId)
  cards.splice(0, cards.length, ...data.map(c => ({ ...c })))
})

// 保存
function persist() {
  saveInspirations(props.cardId, cards.map(c => ({ ...c })))
}

function onCardChange() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    persist()
  }, 500)
}

// 添加卡片
function addCard() {
  const insp = createInspiration()
  cards.push(insp)
  activeIndex.value = cards.length - 1
  persist()
  nextTick(() => scrollToActive())
}

// 删除卡片
function deleteCard(idx) {
  cards.splice(idx, 1)
  if (activeIndex.value >= cards.length) {
    activeIndex.value = Math.max(0, cards.length - 1)
  }
  persist()
}

// 滚轮
function onWheel(e) {
  if (!trackRef.value) return
  trackRef.value.scrollLeft += e.deltaY
}

function scrollToActive() {
  if (!trackRef.value) return
  const card = trackRef.value.children[activeIndex.value]
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }
}

watch(activeIndex, () => {
  nextTick(() => scrollToActive())
})

onUnmounted(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
    persist()
  }
})

function close() {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 12, 8, 0.78);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 舞台 — 无外框，居中排列 */
.modal-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 90vw;
}

/* 卡片轨道 */
.cards-track {
  display: flex;
  gap: 24px;
  padding: 20px 40px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  cursor: grab;
  align-items: center;
  min-height: 260px;
}

.cards-track::-webkit-scrollbar {
  height: 0;
}

.cards-track:active {
  cursor: grabbing;
}

/* ========== 3D 悬浮卡片 — 手札风格 ========== */
.float-card {
  flex: 0 0 180px;
  height: 240px;
  scroll-snap-align: center;
  position: relative;
  cursor: pointer;
  perspective: 600px;
  transition: transform 0.35s cubic-bezier(0.23, 1, 0.32, 1);
  transform:
    translateY(0)
    rotateY(0deg)
    rotateX(0deg);
}

.float-card:hover {
  transform:
    translateY(-12px)
    rotateY(0deg)
    rotateX(-4deg);
  z-index: 10;
}

.float-card.active {
  transform:
    translateY(-16px)
    scale(1.05);
  z-index: 5;
}

.float-card.active:hover {
  transform:
    translateY(-18px)
    scale(1.05)
    rotateX(-3deg);
}

/* 卡片面 — 米色纸张质感 */
.card-face {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 16px 14px;

  /* 米色纸张渐变 */
  background: linear-gradient(
    160deg,
    #f7f2e9 0%,
    #f0e8d8 30%,
    #ece4d2 60%,
    #e8dfc8 100%
  );
  border: 1px solid rgba(139, 107, 62, 0.25);
  box-shadow:
    0 6px 24px rgba(40, 25, 10, 0.25),
    0 2px 6px rgba(40, 25, 10, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transition: all 0.4s ease;
}

.float-card:hover .card-face {
  border-color: rgba(139, 107, 62, 0.45);
  box-shadow:
    0 14px 40px rgba(40, 25, 10, 0.35),
    0 4px 12px rgba(40, 25, 10, 0.25),
    0 0 0 1px rgba(139, 107, 62, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.float-card.active .card-face {
  border-color: rgba(139, 107, 62, 0.55);
  background: linear-gradient(
    160deg,
    #faf7f2 0%,
    #f5f0e6 30%,
    #f0e8d8 60%,
    #ece4d2 100%
  );
  box-shadow:
    0 18px 48px rgba(40, 25, 10, 0.4),
    0 6px 16px rgba(139, 107, 62, 0.1),
    0 0 0 1px rgba(139, 107, 62, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

/* 卡片编号 */
.card-number {
  font-size: 1.6rem;
  font-weight: 300;
  color: rgba(139, 107, 62, 0.3);
  letter-spacing: 0.04em;
  line-height: 1;
  margin-bottom: 10px;
  flex-shrink: 0;
}

/* 文字输入区域 */
.card-input {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.75rem;
  line-height: 1.75;
  color: #3e3324;
  letter-spacing: 0.04em;
  resize: none;
  padding: 0;
}

.card-input::placeholder {
  color: rgba(139, 107, 62, 0.3);
  font-style: italic;
}

.card-input::-webkit-scrollbar {
  width: 3px;
}
.card-input::-webkit-scrollbar-thumb {
  background: rgba(139, 107, 62, 0.2);
  border-radius: 2px;
}

/* 删除按钮 — 右上角小叉 */
.card-delete {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(139, 107, 62, 0.15);
  background: rgba(240, 235, 225, 0.8);
  color: rgba(139, 107, 62, 0.4);
  font-size: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.25s ease;
}

.float-card:hover .card-delete {
  opacity: 1;
}

.card-delete:hover {
  background: rgba(200, 90, 80, 0.85);
  border-color: rgba(200, 90, 80, 0.5);
  color: #fff;
}

/* ========== 添加卡片 — 虚线边框 ========== */
.add-card .card-face {
  background: linear-gradient(
    160deg,
    rgba(247, 242, 233, 0.5) 0%,
    rgba(240, 232, 216, 0.5) 100%
  );
  border: 1.5px dashed rgba(139, 107, 62, 0.25);
  box-shadow: none;
}

.add-card:hover .card-face {
  border-color: rgba(139, 107, 62, 0.45);
  border-style: solid;
  background: linear-gradient(
    160deg,
    rgba(247, 242, 233, 0.7) 0%,
    rgba(240, 232, 216, 0.7) 100%
  );
  box-shadow:
    0 10px 32px rgba(40, 25, 10, 0.3),
    0 0 0 1px rgba(139, 107, 62, 0.12);
}

.add-face {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.add-icon {
  font-size: 2.2rem;
  color: rgba(139, 107, 62, 0.25);
  font-weight: 200;
  line-height: 1;
  transition: all 0.3s ease;
}

.add-card:hover .add-icon {
  color: rgba(139, 107, 62, 0.55);
  transform: scale(1.15);
}

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
}

.empty-card {
  width: 180px;
  height: 240px;
  border-radius: 12px;
  border: 1.5px dashed rgba(139, 107, 62, 0.3);
  background: rgba(245, 240, 232, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.4s ease;
}

.empty-card:hover {
  border-color: rgba(139, 107, 62, 0.5);
  border-style: solid;
  background: rgba(245, 240, 232, 0.6);
  transform: translateY(-8px);
  box-shadow: 0 10px 32px rgba(40, 25, 10, 0.3);
}

.empty-card .add-icon {
  font-size: 2.2rem;
  color: rgba(139, 107, 62, 0.25);
}

.empty-card:hover .add-icon {
  color: rgba(139, 107, 62, 0.55);
  transform: scale(1.1);
}

.empty-text {
  font-size: 0.72rem;
  color: rgba(139, 107, 62, 0.3);
  letter-spacing: 0.08em;
}

/* ========== 底部 ========== */
.stage-footer {
  display: flex;
  justify-content: center;
}

.footer-info {
  font-size: 0.7rem;
  color: rgba(180, 150, 120, 0.35);
  letter-spacing: 0.1em;
}

@media (max-width: 600px) {
  .float-card {
    flex: 0 0 140px;
    height: 200px;
  }
  .cards-track {
    gap: 16px;
    padding: 16px 24px;
  }
  .empty-card {
    width: 140px;
    height: 200px;
  }
}
</style>
