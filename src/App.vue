<template>
  <div class="app-container">
    <header class="app-header">
      <router-link to="/" class="app-title" v-if="$route.name !== 'Home'">
        ✦ 塔罗手札 ✦
      </router-link>
      <span class="app-title" v-else>✦ 塔罗手札 ✦</span>
      <div class="header-buttons">
        <button class="theme-btn" @click="toggleTheme" :title="isDark ? '切换到米色主题' : '切换到暗色主题'">
          {{ isDark ? '☀' : '☾' }}
        </button>
        <button class="settings-btn" @click="showBackup = true" title="数据管理">
          ⚙
        </button>
      </div>
    </header>
    <main class="app-main">
      <router-view v-slot="{ Component }" :key="$route.fullPath">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <footer class="app-footer">
      <span>✦ 所有数据即时保存在浏览器本地 <template v-if="cloudReady">· ☁ 已开启云端同步</template><template v-else>· ☁ 云端同步未登录</template> ✦</span>
    </footer>

    <BackupPanel
      :visible="showBackup"
      @close="showBackup = false"
      @data-changed="onDataChanged"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BackupPanel from './components/BackupPanel.vue'
import { useTheme } from './composables/useTheme.js'
import { initCloudSync, isLoggedIn, onAuthChange } from './composables/useCloudSync.js'

const showBackup = ref(false)
const { theme, toggleTheme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const cloudReady = ref(false)

// 启动时恢复云端会话
initCloudSync()
cloudReady.value = isLoggedIn()
onAuthChange((s) => {
  cloudReady.value = !!(s && s.access_token)
})

function onDataChanged() {
  window.location.reload()
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Georgia', 'Noto Serif SC', serif;
  transition: background 0.4s ease;
}

.app-header {
  text-align: center;
  padding: 18px 20px 10px;
  border-bottom: 1px solid var(--border-accent-light);
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-header);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.4s ease, border-color 0.4s ease;
}

.app-title {
  font-size: 1.3rem;
  letter-spacing: 0.15em;
  color: var(--text-accent);
  text-decoration: none;
  font-weight: normal;
}

.header-buttons {
  position: absolute;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.theme-btn,
.settings-btn {
  background: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;
  line-height: 1;
}
.theme-btn:hover,
.settings-btn:hover {
  color: var(--text-accent);
  background: var(--btn-bg);
}

.app-main {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.app-footer {
  text-align: center;
  padding: 16px;
  font-size: 0.75rem;
  color: var(--text-muted);
  border-top: 1px solid var(--border-lighter);
  transition: border-color 0.4s ease;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 600px) {
  .app-header {
    padding: 14px 16px 8px;
  }
  .app-title {
    font-size: 1.1rem;
  }
  .app-main {
    padding: 12px;
  }
}
</style>
