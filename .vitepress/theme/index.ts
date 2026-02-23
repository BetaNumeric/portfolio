// https://vitepress.dev/guide/custom-theme
import Layout from './Layout.vue'
import ProjectAccordion from './components/ProjectAccordion.vue'
import ProjectIntro from './components/ProjectIntro.vue'
import AboutScene from './components/AboutScene.vue'
import ModelEmbed from './components/ModelEmbed.vue'
import type { Theme } from 'vitepress'
import './style.css'

export default {
  Layout,
  enhanceApp({ app, router, siteData }) {
    app.component('ProjectAccordion', ProjectAccordion)
    app.component('ProjectIntro', ProjectIntro)
    app.component('AboutScene', AboutScene)
    app.component('ModelEmbed', ModelEmbed)
  }
} satisfies Theme
