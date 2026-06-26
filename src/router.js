import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from './views/HomePage.vue'
import MajorArcanaPage from './views/MajorArcanaPage.vue'
import MinorArcanaPage from './views/MinorArcanaPage.vue'
import CardDetailPage from './views/CardDetailPage.vue'
import CasesPage from './views/CasesPage.vue'
import PrinciplesPage from './views/PrinciplesPage.vue'
import PrincipleDetailPage from './views/PrincipleDetailPage.vue'

const routes = [
  { path: '/', name: 'Home', component: HomePage },
  { path: '/major', name: 'MajorArcana', component: MajorArcanaPage },
  { path: '/minor', name: 'MinorArcana', component: MinorArcanaPage },
  { path: '/card/:cardId', name: 'CardDetail', component: CardDetailPage, props: true },
  { path: '/cases', name: 'Cases', component: CasesPage },
  { path: '/principles', name: 'Principles', component: PrinciplesPage },
  { path: '/principles/:articleId', name: 'PrincipleDetail', component: PrincipleDetailPage, props: true },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
})
