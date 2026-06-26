<template>
  <div class="home-page">
    <div class="home-intro">
      <div class="mystic-line"></div>
      <p class="intro-text">于幽微之处，窥见命运之丝线</p>
      <div class="mystic-line"></div>
    </div>

    <div class="arcana-sections">
      <!-- 大阿卡纳入口 -->
      <router-link to="/major" class="arcana-card major-card">
        <div class="card-inner">
          <div class="card-ornament top-left"></div>
          <div class="card-ornament top-right"></div>
          <div class="card-ornament bottom-left"></div>
          <div class="card-ornament bottom-right"></div>
          <div class="card-content">
            <div class="arcana-symbol">☉</div>
            <h2 class="arcana-title">Major Arcana</h2>
            <h3 class="arcana-subtitle">大阿卡纳</h3>
            <p class="arcana-desc">愚人之旅 · 二十二张大牌<br/>灵魂的进化之路</p>
            <div class="arcana-count">22 张牌</div>
            <div class="enter-hint">
              <span>进入探索</span>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>
      </router-link>

      <!-- 小阿卡纳入口 -->
      <router-link to="/minor" class="arcana-card minor-card">
        <div class="card-inner">
          <div class="card-ornament top-left"></div>
          <div class="card-ornament top-right"></div>
          <div class="card-ornament bottom-left"></div>
          <div class="card-ornament bottom-right"></div>
          <div class="card-content">
            <div class="arcana-symbol">✧</div>
            <h2 class="arcana-title">Minor Arcana</h2>
            <h3 class="arcana-subtitle">小阿卡纳</h3>
            <p class="arcana-desc">四元素 · 五十六张小牌<br/>日常生活的智慧</p>
            <div class="arcana-count">56 张牌</div>
            <div class="enter-hint">
              <span>进入探索</span>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>
      </router-link>
    </div>

    <!-- 塔罗原理 & 案例集 -- 并排入口 -->
    <div class="section-divider">
      <div class="mystic-line short"></div>
    </div>

    <div class="bottom-sections">
      <router-link to="/principles" class="bottom-card principles-card">
        <div class="card-inner">
          <div class="card-ornament top-left"></div>
          <div class="card-ornament top-right"></div>
          <div class="card-ornament bottom-left"></div>
          <div class="card-ornament bottom-right"></div>
          <div class="card-content">
            <div class="bottom-symbol">📜</div>
            <h2 class="bottom-title">塔罗原理</h2>
            <h3 class="bottom-subtitle">Principia Tarotica</h3>
            <p class="bottom-desc">理论与知识 · 长文笔记<br/>可自由创建与编辑</p>
            <div class="bottom-count" v-if="principleCount > 0">{{ principleCount }} 篇文章</div>
            <div class="bottom-count" v-else>开始撰写</div>
            <div class="enter-hint">
              <span>进入原理</span>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>
      </router-link>

      <router-link to="/cases" class="bottom-card cases-card">
        <div class="card-inner">
          <div class="card-ornament top-left"></div>
          <div class="card-ornament top-right"></div>
          <div class="card-ornament bottom-left"></div>
          <div class="card-ornament bottom-right"></div>
          <div class="card-content">
            <div class="bottom-symbol">📖</div>
            <h2 class="bottom-title">案例集</h2>
            <h3 class="bottom-subtitle">Case Journal</h3>
            <p class="bottom-desc">塔罗解读实践 · 图文笔记<br/>可自由创建与编辑</p>
            <div class="bottom-count" v-if="caseCount > 0">{{ caseCount }} 个案例</div>
            <div class="bottom-count" v-else>开始记录</div>
            <div class="enter-hint">
              <span>进入案例集</span>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>
      </router-link>
    </div>

    <div class="home-bottom">
      <div class="mystic-line short"></div>
      <p class="bottom-quote">"As above, so below"</p>
      <p class="bottom-quote-cn">如其在上，如其在下</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCases, usePrinciples } from '../composables/useStorage.js'

const { cases } = useCases()
const { principles } = usePrinciples()
const caseCount = computed(() => cases.value.length)
const principleCount = computed(() => principles.value.length)
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  min-height: calc(100vh - 180px);
}

.home-intro {
  text-align: center;
  margin-bottom: 50px;
}

.mystic-line {
  width: 120px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--text-accent-dim), transparent);
  margin: 12px auto;
}
.mystic-line.short {
  width: 80px;
}

.intro-text {
  font-size: 0.95rem;
  color: var(--text-secondary);
  letter-spacing: 0.12em;
  padding: 4px 0;
}

.arcana-sections {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 900px;
}

.arcana-card {
  flex: 1;
  min-width: 300px;
  max-width: 400px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.arcana-card:hover {
  transform: translateY(-6px);
}

.card-inner {
  position: relative;
  background: var(--card-gradient);
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  padding: 50px 40px;
  text-align: center;
  overflow: hidden;
  transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
}

.major-card .card-inner {
  border-color: var(--border-accent);
  box-shadow: 0 4px 30px rgba(180, 140, 80, 0.08);
}

.minor-card .card-inner {
  border-color: rgba(140, 160, 180, 0.3);
  box-shadow: 0 4px 30px rgba(140, 160, 180, 0.06);
}

.arcana-card:hover .card-inner {
  box-shadow: 0 8px 40px rgba(180, 140, 80, 0.15);
}

.card-ornament {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: var(--border-primary);
  border-style: solid;
}
.top-left { top: 12px; left: 12px; border-width: 2px 0 0 2px; }
.top-right { top: 12px; right: 12px; border-width: 2px 2px 0 0; }
.bottom-left { bottom: 12px; left: 12px; border-width: 0 0 2px 2px; }
.bottom-right { bottom: 12px; right: 12px; border-width: 0 2px 2px 0; }

.card-content {
  position: relative;
  z-index: 1;
}

.arcana-symbol {
  font-size: 2.2rem;
  color: var(--text-accent);
  margin-bottom: 16px;
}

.arcana-title {
  font-size: 1.4rem;
  font-weight: normal;
  color: var(--text-accent);
  letter-spacing: 0.12em;
  margin-bottom: 4px;
}

.arcana-subtitle {
  font-size: 1.1rem;
  font-weight: normal;
  color: var(--text-secondary);
  letter-spacing: 0.15em;
  margin-bottom: 18px;
}

.arcana-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.8;
  margin-bottom: 20px;
}

.arcana-count {
  display: inline-block;
  font-size: 0.75rem;
  color: var(--text-muted);
  border: 1px solid var(--border-accent-light);
  border-radius: 20px;
  padding: 4px 16px;
  margin-bottom: 20px;
}

.enter-hint {
  font-size: 0.85rem;
  color: var(--text-accent-dim);
  letter-spacing: 0.1em;
  transition: color 0.3s;
}
.arcana-card:hover .enter-hint,
.cases-entry:hover .enter-hint {
  color: var(--text-accent);
}
.arrow {
  display: inline-block;
  margin-left: 4px;
  transition: transform 0.3s;
}
.arcana-card:hover .arrow,
.cases-entry:hover .arrow {
  transform: translateX(4px);
}

/* 底部分隔 & 并排入口 */
.section-divider {
  margin: 30px 0;
}

.bottom-sections {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 900px;
}

.bottom-card {
  flex: 1;
  min-width: 280px;
  max-width: 420px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.4s ease;
}

.bottom-card:hover {
  transform: translateY(-6px);
}

.principles-card .card-inner {
  border-color: rgba(140, 160, 180, 0.25);
  box-shadow: 0 4px 30px rgba(120, 140, 160, 0.05);
  background: var(--card-gradient-alt);
}

.cases-card .card-inner {
  border-color: rgba(140, 120, 140, 0.25);
  box-shadow: 0 4px 30px rgba(140, 120, 140, 0.06);
  background: var(--card-gradient-alt);
}

.bottom-card:hover .card-inner {
  box-shadow: 0 8px 40px rgba(160, 130, 160, 0.12);
}

.bottom-symbol {
  font-size: 2rem;
  margin-bottom: 12px;
}

.bottom-title {
  font-size: 1.2rem;
  font-weight: normal;
  color: var(--text-accent);
  letter-spacing: 0.12em;
  margin-bottom: 4px;
}

.bottom-subtitle {
  font-size: 0.95rem;
  font-weight: normal;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  margin-bottom: 14px;
}

.bottom-desc {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.8;
  margin-bottom: 16px;
}

.bottom-count {
  display: inline-block;
  font-size: 0.72rem;
  color: var(--text-muted);
  border: 1px solid var(--border-accent-light);
  border-radius: 20px;
  padding: 4px 16px;
  margin-bottom: 16px;
}

.home-bottom {
  margin-top: 60px;
  text-align: center;
}

.bottom-quote {
  font-size: 0.9rem;
  color: var(--text-accent-dim);
  font-style: italic;
  letter-spacing: 0.1em;
  margin-top: 12px;
}

.bottom-quote-cn {
  font-size: 0.8rem;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  margin-top: 6px;
}

@media (max-width: 700px) {
  .arcana-sections {
    flex-direction: column;
    align-items: center;
    gap: 30px;
  }
  .arcana-card {
    min-width: 260px;
    width: 100%;
  }
  .card-inner {
    padding: 36px 28px;
  }
  .bottom-sections {
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  .bottom-card {
    min-width: 260px;
    width: 100%;
  }
}
</style>
