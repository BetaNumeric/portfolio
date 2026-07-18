// https://vitepress.dev/guide/custom-theme
import { defineAsyncComponent } from 'vue'
import Layout from './Layout.vue'
import ProjectAccordion from './components/ProjectAccordion.vue'
import ProjectIntro from './components/ProjectIntro.vue'
import ModelEmbed from './components/ModelEmbed.vue'
import type { Theme } from 'vitepress'
import './style.css'

const AboutScene = defineAsyncComponent(() => import('./components/AboutScene.vue'))

export default {
  Layout,
  enhanceApp({ app, router, siteData }) {
    app.component('ProjectAccordion', ProjectAccordion)
    app.component('ProjectIntro', ProjectIntro)
    app.component('AboutScene', AboutScene)
    app.component('ModelEmbed', ModelEmbed)
  }
} satisfies Theme
