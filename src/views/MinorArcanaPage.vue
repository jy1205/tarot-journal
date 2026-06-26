<template>
  <div class="minor-page">
    <div class="page-header">
      <router-link to="/" class="back-btn">← 返回</router-link>
      <div class="header-center">
        <h1 class="page-title">Minor Arcana</h1>
        <h2 class="page-subtitle">小阿卡纳 · 四元素之智慧</h2>
      </div>
      <div class="header-right"></div>
    </div>

    <div class="mystic-separator">
      <span>✧</span>
    </div>

    <!-- 四元素，每个一行 -->
    <section
      v-for="suit in minorArcana"
      :key="suit.element"
      class="suit-section"
      :class="`suit-${suit.element}`"
    >
      <div class="suit-header">
        <div class="suit-symbol">{{ suit.symbol }}</div>
        <div class="suit-info">
          <span class="suit-element">{{ suit.element }}元素</span>
          <span class="suit-name">{{ suit.suit }} · {{ suit.suitEn }}</span>
        </div>
        <div class="suit-symbol right">{{ suit.symbol }}</div>
      </div>

      <div class="suit-cards">
        <!-- 数字牌 1-10 -->
        <div class="card-subgroup">
          <div class="subgroup-label">数字牌</div>
          <div class="card-grid">
            <TarotCard
              v-for="card in suit.cards.filter(c => c.type === 'number')"
              :key="card.id"
              :card="card"
            />
          </div>
        </div>

        <!-- 宫廷牌 -->
        <div class="card-subgroup">
          <div class="subgroup-label">宫廷牌</div>
          <div class="card-grid court-grid">
            <TarotCard
              v-for="card in suit.cards.filter(c => c.type === 'court')"
              :key="card.id"
              :card="card"
            />
          </div>
        </div>
      </div>
    </section>

    <div class="mystic-separator bottom">
      <span>✧</span>
    </div>
  </div>
</template>

<script setup>
import { minorArcana } from '../data/tarotData.js'
import TarotCard from '../components/TarotCard.vue'
</script>

<style scoped>
.minor-page {
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

/* 元素区块 */
.suit-section {
  margin-bottom: 40px;
  padding: 24px 20px;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  background: var(--bg-panel-hover);
  transition: background 0.4s ease, border-color 0.4s ease;
}
.suit-火 {
  border-left: 2px solid var(--suit-fire);
}
.suit-风 {
  border-left: 2px solid var(--suit-air);
}
.suit-水 {
  border-left: 2px solid var(--suit-water);
}
.suit-土 {
  border-left: 2px solid var(--suit-earth);
}

.suit-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.suit-symbol {
  font-size: 1.5rem;
  color: var(--text-muted);
}

.suit-info {
  text-align: center;
}

.suit-element {
  display: block;
  font-size: 0.7rem;
  color: var(--text-muted);
  letter-spacing: 0.12em;
}

.suit-name {
  display: block;
  font-size: 1rem;
  color: var(--text-accent);
  letter-spacing: 0.08em;
  margin-top: 2px;
}

/* 卡片布局 */
.suit-cards {
  display: flex;
  gap: 30px;
}

.card-subgroup {
  flex: 1;
}

.subgroup-label {
  text-align: center;
  font-size: 0.7rem;
  color: var(--text-faint);
  letter-spacing: 0.1em;
  margin-bottom: 12px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.court-grid {
  grid-template-columns: repeat(2, 1fr);
  max-width: 240px;
  margin: 0 auto;
}

@media (max-width: 800px) {
  .suit-cards {
    flex-direction: column;
    gap: 20px;
  }
  .card-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }
  .court-grid {
    grid-template-columns: repeat(4, 1fr);
    max-width: none;
  }
}

@media (max-width: 500px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .court-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .suit-section {
    padding: 16px 10px;
  }
  .page-title {
    font-size: 1.1rem;
  }
}
</style>
