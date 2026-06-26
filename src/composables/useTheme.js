import { ref, watchEffect } from 'vue'

const THEME_KEY = 'tarot-theme'
const theme = ref(loadTheme())

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'dark'
  } catch {
    return 'dark'
  }
}

function saveTheme(val) {
  try {
    localStorage.setItem(THEME_KEY, val)
  } catch { /* ignore */ }
}

// 同步到 document.documentElement 的 data-theme 属性
watchEffect(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
  saveTheme(theme.value)
})

export function useTheme() {
  const isDark = () => theme.value === 'dark'

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(val) {
    if (val === 'dark' || val === 'light') {
      theme.value = val
    }
  }

  return { theme, isDark, toggleTheme, setTheme }
}
