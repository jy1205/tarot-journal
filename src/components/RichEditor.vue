<template>
  <div class="rich-editor" :class="{ focused: isFocused }">
    <!-- 工具栏 -->
    <div class="editor-toolbar" v-show="isFocused || (modelValue && modelValue.length > 0)">
      <button
        v-for="btn in toolbarButtons"
        :key="btn.title"
        class="tool-btn"
        :class="{ active: btn.isActive?.() }"
        @mousedown.prevent="btn.action()"
        :title="btn.title"
      >
        <span v-html="btn.icon"></span>
      </button>
      <div class="tool-divider"></div>
      <label class="tool-btn image-btn" title="插入图片">
        🖼
        <input type="file" accept="image/*" multiple @change="onImageInsert" hidden />
      </label>
    </div>

    <!-- 编辑器内容区 -->
    <editor-content :editor="editor" class="editor-content" />
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '在此书写笔记...' }
})

const emit = defineEmits(['update:modelValue'])
const isFocused = ref(false)

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      image: false,
    }),
    Image.configure({
      inline: false,
      allowBase64: true,
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose-editor',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  onFocus: () => { isFocused.value = true },
  onBlur: ({ editor }) => {
    setTimeout(() => {
      if (!editor.view.hasFocus()) {
        isFocused.value = false
      }
    }, 200)
  },
})

// 同步外部数据变化
watch(() => props.modelValue, (val) => {
  if (editor.value) {
    const currentHTML = editor.value.getHTML()
    if (currentHTML !== val) {
      editor.value.commands.setContent(val, false)
    }
  }
})

defineExpose({
  getEditor: () => editor.value,
  insertHtml: (html) => {
    if (editor.value) {
      editor.value.commands.insertContent(html)
    }
  },
  insertImage: (src, alt = '') => {
    if (editor.value) {
      editor.value.chain().focus().setImage({ src, alt }).run()
    }
  }
})

// ==================== 插入本地图片 ====================

function onImageInsert(e) {
  const files = Array.from(e.target.files)
  if (files.length === 0) return

  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (evt) => {
      const dataUrl = evt.target.result
      if (editor.value) {
        editor.value.chain().focus().setImage({ src: dataUrl, alt: file.name }).run()
      }
    }
    reader.readAsDataURL(file)
  })

  // 重置 input，以便可以重新选择相同文件
  e.target.value = ''
}

const toolbarButtons = [
  {
    title: '标题1',
    icon: 'H1',
    action: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: () => editor.value?.isActive('heading', { level: 1 }),
  },
  {
    title: '标题2',
    icon: 'H2',
    action: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: () => editor.value?.isActive('heading', { level: 2 }),
  },
  {
    title: '标题3',
    icon: 'H3',
    action: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: () => editor.value?.isActive('heading', { level: 3 }),
  },
  {
    title: '加粗',
    icon: '<b>B</b>',
    action: () => editor.value?.chain().focus().toggleBold().run(),
    isActive: () => editor.value?.isActive('bold'),
  },
  {
    title: '斜体',
    icon: '<i>I</i>',
    action: () => editor.value?.chain().focus().toggleItalic().run(),
    isActive: () => editor.value?.isActive('italic'),
  },
  {
    title: '下划线',
    icon: '<u>U</u>',
    action: () => editor.value?.chain().focus().toggleUnderline().run(),
    isActive: () => editor.value?.isActive('underline'),
  },
  {
    title: '删除线',
    icon: '<s>S</s>',
    action: () => editor.value?.chain().focus().toggleStrike().run(),
    isActive: () => editor.value?.isActive('strike'),
  },
  {
    title: '高亮',
    icon: '🖍',
    action: () => {
      if (editor.value?.isActive('highlight')) {
        editor.value.chain().focus().unsetHighlight().run()
      } else {
        editor.value?.chain().focus().toggleHighlight({ color: '#c9a96e55' }).run()
      }
    },
    isActive: () => editor.value?.isActive('highlight'),
  },
  {
    title: '引用',
    icon: '❝',
    action: () => editor.value?.chain().focus().toggleBlockquote().run(),
    isActive: () => editor.value?.isActive('blockquote'),
  },
  {
    title: '无序列表',
    icon: '•≡',
    action: () => editor.value?.chain().focus().toggleBulletList().run(),
    isActive: () => editor.value?.isActive('bulletList'),
  },
  {
    title: '有序列表',
    icon: '1.',
    action: () => editor.value?.chain().focus().toggleOrderedList().run(),
    isActive: () => editor.value?.isActive('orderedList'),
  },
  {
    title: '分割线',
    icon: '—',
    action: () => editor.value?.chain().focus().setHorizontalRule().run(),
    isActive: () => false,
  },
]

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
/* 编辑器内容全局样式 */
.prose-editor {
  outline: none;
  min-height: 200px;
  padding: 16px;
  font-size: 0.9rem;
  line-height: 1.9;
  color: var(--text-primary);
  letter-spacing: 0.03em;
}

.prose-editor p {
  margin: 0 0 0.8em;
}

.prose-editor p:last-child {
  margin-bottom: 0;
}

.prose-editor h1 {
  font-size: 1.4rem;
  font-weight: normal;
  color: var(--text-accent);
  margin: 1.2em 0 0.6em;
  letter-spacing: 0.08em;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 6px;
}

.prose-editor h2 {
  font-size: 1.15rem;
  font-weight: normal;
  color: var(--text-primary);
  margin: 1em 0 0.5em;
  letter-spacing: 0.06em;
}

.prose-editor h3 {
  font-size: 1rem;
  font-weight: normal;
  color: var(--text-accent);
  margin: 0.8em 0 0.4em;
  letter-spacing: 0.05em;
}

.prose-editor strong {
  color: var(--text-primary);
  font-weight: bold;
}

.prose-editor em {
  color: var(--text-primary);
  font-style: italic;
}

.prose-editor u {
  text-decoration: underline;
  text-decoration-color: var(--text-accent-dim);
}

.prose-editor s {
  color: var(--text-muted);
}

.prose-editor blockquote {
  border-left: 2px solid var(--text-accent-dim);
  padding: 8px 16px;
  margin: 0.8em 0;
  color: var(--text-secondary);
  font-style: italic;
  background: var(--btn-bg);
  border-radius: 0 3px 3px 0;
}

.prose-editor ul,
.prose-editor ol {
  padding-left: 24px;
  margin: 0.6em 0;
}

.prose-editor li {
  margin: 0.3em 0;
}

.prose-editor hr {
  border: none;
  border-top: 1px solid var(--border-light);
  margin: 1.2em 0;
}

.prose-editor img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 12px 0;
  border: 1px solid rgba(180, 150, 120, 0.2);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.prose-editor mark {
  background: var(--text-accent-dim);
  color: var(--text-primary);
  padding: 1px 3px;
  border-radius: 2px;
}

.prose-editor p.is-editor-empty:first-child::before {
  color: var(--text-faint);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.prose-editor:focus {
  outline: none;
}
</style>

<style scoped>
.rich-editor {
  border: 1px solid var(--border-input);
  border-radius: 4px;
  background: var(--bg-input);
  transition: border-color 0.3s, background 0.4s ease;
}

.rich-editor.focused {
  border-color: var(--border-primary);
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-lighter);
  background: var(--bg-panel-hover);
  border-radius: 4px 4px 0 0;
}

.tool-btn {
  width: 32px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-accent-dim);
  font-size: 0.78rem;
  border-radius: 3px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.tool-btn:hover {
  background: var(--btn-bg);
  color: var(--text-accent);
}

.tool-btn.active {
  background: rgba(201, 169, 110, 0.15);
  color: var(--text-accent);
  border-color: var(--border-accent-light);
}

.tool-divider {
  width: 1px;
  height: 20px;
  background: var(--border-lighter);
  margin: 0 4px;
  align-self: center;
}

.image-btn {
  cursor: pointer;
}

.editor-content {
  min-height: 200px;
}
</style>
