<template>
  <div
    class="tarot-card"
    :class="{ 'is-fool': isFool, 'is-clickable': clickable }"
    @click="handleClick"
  >
    <div class="card-frame">
      <!-- 优先使用自定义上传图片，否则用生成的默认图片 -->
      <div class="card-image" v-if="hasCustomImage && !customImageFailed">
        <img :src="customImage" :alt="card.name" @error="onCustomImageError" />
      </div>
      <div class="card-image" v-else-if="!imageFailed && generatedImage">
        <img :src="generatedImage" :alt="card.name" @error="onImageError" />
      </div>
      <!-- fallback: 图片加载失败时显示牌名占位 -->
      <div class="card-image card-fallback" v-else>
        <div class="fallback-bg">
          <span class="fallback-symbol">{{ fallbackSymbol }}</span>
          <span class="fallback-name">{{ card.name }}</span>
        </div>
      </div>

      <div class="card-overlay">
        <span class="overlay-text">{{ overlayText }}</span>
      </div>
    </div>
    <div class="card-label" v-if="showLabel">
      <span class="label-name">{{ card.name }}</span>
      <span class="label-keyword" v-if="card.keyword">{{ card.keyword }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { useCustomImages } from '../composables/useStorage'
import { getCardImage } from '../data/cardImages.js'
import { useRouter } from 'vue-router'

const props = defineProps({
  card: { type: Object, required: true },
  isFool: { type: Boolean, default: false },
  clickable: { type: Boolean, default: true },
  overlayText: { type: String, default: '探索' },
  showLabel: { type: Boolean, default: true },
  linkTo: { type: String, default: undefined },  // undefined=默认跳转详情, ''=不跳转只emit, '/path'=自定义跳转
})

const emit = defineEmits(['click'])
const router = useRouter()

const { images } = useCustomImages()
const customImage = computed(() => images.value[props.card.id] || null)
const hasCustomImage = computed(() => !!customImage.value)

const generatedImage = ref('')
const imageFailed = ref(false)
const customImageFailed = ref(false)

// fallback 符号：宫廷牌用棋子符号，数字牌用数字，大牌用罗马数字
const fallbackSymbol = computed(() => {
  if (props.card.type === 'court') {
    const map = { '侍从': '♟', '骑士': '♞', '皇后': '♛', '国王': '♚' }
    return map[props.card.court] || '✦'
  }
  if (props.card.number === 0) return '0'
  if (props.card.number) {
    const roman = {1:'Ⅰ',2:'Ⅱ',3:'Ⅲ',4:'Ⅳ',5:'Ⅴ',6:'Ⅵ',7:'Ⅶ',8:'Ⅷ',9:'Ⅸ',10:'Ⅹ',
      11:'Ⅺ',12:'Ⅻ',13:'ⅩⅢ',14:'ⅩⅣ',15:'ⅩⅤ',16:'ⅩⅥ',17:'ⅩⅦ',18:'ⅩⅧ',19:'ⅩⅨ',20:'ⅩⅩ',21:'ⅩⅪ'}
    return roman[props.card.number] || String(props.card.number)
  }
  return '✦'
})

onMounted(() => {
  // 使用 nextTick 确保 DOM 就绪后再生成图片
  nextTick(() => {
    try {
      const img = getCardImage(props.card)
      if (img && img.startsWith('data:image/')) {
        generatedImage.value = img
      } else {
        imageFailed.value = true
      }
    } catch (e) {
      console.warn(`[TarotCard] 图片生成失败: ${props.card.id} ${props.card.name}`, e)
      imageFailed.value = true
    }
  })
})

function onImageError(e) {
  console.warn(`[TarotCard] 图片加载失败: ${props.card.id} ${props.card.name}`)
  imageFailed.value = true
}

function onCustomImageError(e) {
  console.warn(`[TarotCard] 自定义图片加载失败: ${props.card.id} ${props.card.name}`)
  customImageFailed.value = true
}

function handleClick() {
  if (!props.clickable) return
  // 总是 emit click 事件
  emit('click', props.card)
  // 如果有自定义 linkTo，用它跳转
  if (props.linkTo) {
    router.push(props.linkTo)
  } else if (props.linkTo === undefined) {
    // 默认行为：跳转到卡片详情页
    router.push(`/card/${props.card.id}`)
  }
  // 如果 linkTo === '' (空字符串)，只 emit 不跳转
}
</script>

<style scoped>
.tarot-card {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: transform 0.35s ease;
}

.tarot-card.is-clickable {
  cursor: pointer;
}

.tarot-card.is-clickable:hover {
  transform: translateY(-5px);
  z-index: 10;
}

.card-frame {
  position: relative;
  aspect-ratio: 3 / 5;
  background: var(--card-gradient);
  border: 1px solid var(--border-primary);
  border-radius: 3px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.35s ease, border-color 0.35s ease, background 0.4s ease;
}

.tarot-card.is-clickable:hover .card-frame {
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-accent);
}

.is-fool .card-frame {
  border-color: var(--border-accent);
  box-shadow: 0 4px 20px rgba(180, 140, 80, 0.1);
}

.card-image {
  width: 100%;
  height: 100%;
}
.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* fallback 样式：图片加载失败时的占位 */
.card-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-gradient, linear-gradient(180deg, #1a1a2e, #2a1a3a));
}

.fallback-bg {
  text-align: center;
  padding: 12px;
}

.fallback-symbol {
  display: block;
  font-size: 3rem;
  color: var(--text-accent);
  opacity: 0.4;
  margin-bottom: 12px;
}

.fallback-name {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
  line-height: 1.4;
  word-break: keep-all;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.35s ease;
}

.tarot-card.is-clickable:hover .card-overlay {
  opacity: 1;
}

.overlay-text {
  color: var(--text-accent);
  font-size: 0.85rem;
  letter-spacing: 0.15em;
  border: 1px solid var(--border-accent);
  padding: 6px 18px;
  border-radius: 2px;
}

.card-label {
  text-align: center;
  margin-top: 8px;
}

.label-name {
  display: block;
  font-size: 0.78rem;
  color: var(--text-primary);
  letter-spacing: 0.05em;
}

.label-keyword {
  display: block;
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 2px;
}
</style>
