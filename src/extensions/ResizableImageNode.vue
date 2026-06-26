<template>
  <node-view-wrapper as="div" class="resizable-image-node" :class="{ selected: selected, dragging: isDragging }" :style="wrapperStyle">
    <img
      ref="imgRef"
      :src="src"
      :alt="alt"
      :title="title"
      @load="onImageLoad"
      @error="onImageError"
      draggable="false"
    />
    <div class="resize-handle right" @mousedown.stop.prevent="startResize($event, 'right')"></div>
    <div class="resize-handle bottom" @mousedown.stop.prevent="startResize($event, 'bottom')"></div>
    <div class="resize-handle corner" @mousedown.stop.prevent="startResize($event, 'corner')"></div>
    <div class="resize-handle left" @mousedown.stop.prevent="startResize($event, 'left')"></div>
    <div class="size-label" v-if="isDragging">{{ Math.round(displayWidth) }} × {{ Math.round(displayHeight) }}</div>
  </node-view-wrapper>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps({
  node: { type: Object, required: true },
  updateAttributes: { type: Function, required: true },
  editor: { type: Object, required: true },
  extension: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  deleteNode: { type: Function, required: true },
})

const src = computed(() => props.node?.attrs?.src || '')
const alt = computed(() => props.node?.attrs?.alt || '')
const title = computed(() => props.node?.attrs?.title || '')

const imgRef = ref(null)
const naturalWidth = ref(0)
const naturalHeight = ref(0)
const imageLoaded = ref(false)
const imageError = ref(false)

// 显示尺寸
const displayWidth = ref(400)
const displayHeight = ref(300)

function onImageLoad(e) {
  naturalWidth.value = e.target.naturalWidth
  naturalHeight.value = e.target.naturalHeight
  imageLoaded.value = true
  imageError.value = false

  // 优先使用已保存的尺寸
  const savedW = props.node?.attrs?.width
  const savedH = props.node?.attrs?.height
  if (savedW && savedH && Number(savedW) > 0 && Number(savedH) > 0) {
    displayWidth.value = Number(savedW)
    displayHeight.value = Number(savedH)
  } else if (naturalWidth.value > 0) {
    if (naturalWidth.value > 680) {
      const ratio = 680 / naturalWidth.value
      displayWidth.value = 680
      displayHeight.value = Math.round(naturalHeight.value * ratio)
    } else {
      displayWidth.value = naturalWidth.value
      displayHeight.value = naturalHeight.value
    }
  }
}

function onImageError() {
  imageError.value = true
  imageLoaded.value = false
}

// ==================== 拖拽调整大小 ====================

const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartW = ref(0)
const dragStartH = ref(0)
const dragDir = ref('corner')

const MIN_SIZE = 40
const MAX_WIDTH = 1200

const wrapperStyle = computed(() => {
  if (!imageLoaded.value) return {}
  return {
    width: displayWidth.value + 'px',
    height: displayHeight.value + 'px',
  }
})

function startResize(e, dir) {
  isDragging.value = true
  dragDir.value = dir
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  dragStartW.value = displayWidth.value
  dragStartH.value = displayHeight.value

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e) {
  if (!isDragging.value) return
  const dx = e.clientX - dragStartX.value
  const dy = e.clientY - dragStartY.value
  const ratio = naturalWidth.value > 0 ? naturalHeight.value / naturalWidth.value : 0.75

  let newW = dragStartW.value
  let newH = dragStartH.value

  switch (dragDir.value) {
    case 'right':
      newW = Math.max(MIN_SIZE, Math.min(MAX_WIDTH, dragStartW.value + dx))
      newH = Math.round(newW * ratio)
      break
    case 'left':
      newW = Math.max(MIN_SIZE, Math.min(MAX_WIDTH, dragStartW.value - dx))
      newH = Math.round(newW * ratio)
      break
    case 'bottom':
      newH = Math.max(MIN_SIZE, dragStartH.value + dy)
      newW = Math.round(newH / ratio)
      break
    case 'corner':
    default:
      newW = Math.max(MIN_SIZE, Math.min(MAX_WIDTH, dragStartW.value + dx))
      newH = Math.max(MIN_SIZE, dragStartH.value + dy)
      break
  }

  displayWidth.value = newW
  displayHeight.value = newH
}

function onMouseUp() {
  if (isDragging.value) {
    isDragging.value = false
    // 保存最终尺寸到 node attributes
    props.updateAttributes({
      width: String(Math.round(displayWidth.value)),
      height: String(Math.round(displayHeight.value)),
    })
  }
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>

<style>
.resizable-image-node {
  position: relative;
  display: inline-block;
  margin: 12px 0;
  border-radius: 4px;
  overflow: visible;
  line-height: 0;
  user-select: none;
}

.resizable-image-node img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  border: 1px solid rgba(180, 150, 120, 0.2);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  object-fit: contain;
  pointer-events: none;
}

.resizable-image-node.selected img {
  border-color: rgba(201, 169, 110, 0.6);
  box-shadow: 0 0 0 2px rgba(201, 169, 110, 0.3), 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* 拖拽手柄 */
.resize-handle {
  position: absolute;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
}

.resizable-image-node:hover .resize-handle,
.resizable-image-node.selected .resize-handle,
.resizable-image-node.dragging .resize-handle {
  opacity: 1;
}

.resize-handle.right {
  top: 0;
  right: -4px;
  width: 8px;
  height: 100%;
  cursor: ew-resize;
  background: rgba(201, 169, 110, 0.15);
  border-radius: 0 4px 4px 0;
}

.resize-handle.right:hover {
  background: rgba(201, 169, 110, 0.4);
}

.resize-handle.left {
  top: 0;
  left: -4px;
  width: 8px;
  height: 100%;
  cursor: ew-resize;
  background: rgba(201, 169, 110, 0.15);
  border-radius: 4px 0 0 4px;
}

.resize-handle.left:hover {
  background: rgba(201, 169, 110, 0.4);
}

.resize-handle.bottom {
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 8px;
  cursor: ns-resize;
  background: rgba(201, 169, 110, 0.15);
  border-radius: 0 0 4px 4px;
}

.resize-handle.bottom:hover {
  background: rgba(201, 169, 110, 0.4);
}

.resize-handle.corner {
  bottom: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
  background: rgba(201, 169, 110, 0.4);
  border-radius: 0 0 4px 0;
  border: 2px solid rgba(201, 169, 110, 0.8);
}

.resize-handle.corner:hover {
  background: rgba(201, 169, 110, 0.7);
}

/* 尺寸标签 */
.size-label {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #c9a96e;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 20;
}
</style>
