<template>
  <div class="major-page">
    <div class="page-header">
      <router-link to="/" class="back-btn">← 返回</router-link>
      <div class="header-center">
        <h1 class="page-title">Major Arcana</h1>
        <h2 class="page-subtitle">大阿卡纳 · 愚人之旅</h2>
      </div>
      <div class="header-right"></div>
    </div>

    <div class="mystic-separator">
      <span>☉</span>
    </div>

    <!-- 愚人牌单独一行 -->
    <section class="fool-section">
      <div class="section-label">0 · 起点</div>
      <div class="fool-row">
        <TarotCard :card="layout.fool" :isFool="true" class="fool-card" />
      </div>
    </section>

    <div class="section-divider">
      <span>✦</span>
    </div>

    <!-- 第一行：魔术师~战车 (I-VII) -->
    <section class="row-section">
      <div class="section-label">I — VII · 意识之旅</div>
      <div class="card-row">
        <TarotCard v-for="card in layout.row1" :key="card.id" :card="card" />
      </div>
    </section>

    <!-- 第二行：力量~节制 (VIII-XIV) -->
    <section class="row-section">
      <div class="section-label">VIII — XIV · 灵魂之炼</div>
      <div class="card-row">
        <TarotCard v-for="card in layout.row2" :key="card.id" :card="card" />
      </div>
    </section>

    <!-- 第三行：恶魔~世界 (XV-XXI) -->
    <section class="row-section">
      <div class="section-label">XV — XXI · 超越与圆满</div>
      <div class="card-row">
        <TarotCard v-for="card in layout.row3" :key="card.id" :card="card" />
      </div>
    </section>

    <div class="mystic-separator bottom">
      <span>☉</span>
    </div>
  </div>
</template>

<script setup>
import { majorLayout } from '../data/tarotData.js'
import TarotCard from '../components/TarotCard.vue'

const layout = majorLayout
</script>

<style scoped>
.major-page {
  padding: 10px 0 40px;
}

.page-header {
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
  padding: 4px 0;
}
.back-btn:hover {
  color: var(--text-accent);
}

.header-center {
  text-align: center;
  flex: 1;
}

.header-right {
  width: 50px;
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

.mystic-separator {
  text-align: center;
  color: var(--text-faint);
  font-size: 0.9rem;
  padding: 10px 0;
}
.mystic-separator.bottom {
  padding: 30px 0 10px;
}

/* 愚人区 */
.fool-section {
  margin-bottom: 10px;
}

.section-label {
  text-align: center;
  font-size: 0.72rem;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  margin-bottom: 16px;
  text-transform: uppercase;
}

.fool-row {
  display: flex;
  justify-content: center;
}

.fool-card {
  width: 120px;
}

.section-divider {
  text-align: center;
  color: var(--text-faint);
  font-size: 0.7rem;
  padding: 20px 0;
}

/* 每行卡片 */
.row-section {
  margin-bottom: 30px;
}

.card-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 16px;
  justify-items: center;
}

@media (max-width: 900px) {
  .card-row {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  .fool-card {
    width: 100px;
  }
}

@media (max-width: 500px) {
  .card-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .page-title {
    font-size: 1.1rem;
  }
  .fool-card {
    width: 90px;
  }
}
</style>
