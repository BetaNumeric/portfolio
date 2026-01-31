<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useData, useRoute } from 'vitepress'

// https://vitepress.dev/reference/runtime-api#usedata
const { site, frontmatter } = useData()
const route = useRoute()

const navItems = computed(() => site.value.themeConfig?.nav ?? [])
const socialLinks = computed(() => site.value.themeConfig?.socialLinks ?? [])
const footerTitle = computed(() => site.value.themeConfig?.footerTitle)
const footerLinks = computed(() => site.value.themeConfig?.footerLinks ?? [])
const isHome = computed(() => frontmatter.value.layout === 'home' || frontmatter.value.home)
const isProject = computed(() => frontmatter.value.layout === 'project')

const isActive = (link: string) => {
  if (link === '/') return route.path === '/'
  return route.path.startsWith(link)
}

const isNavbarHidden = ref(false)
let lastScrollY = 0
let scrollDirection: 'up' | 'down' = 'up'

const handleScroll = () => {
  const currentScrollY = window.scrollY
  const header = document.querySelector('.site-header') as HTMLElement | null
  
  if (!header) return
  
  const headerHeight = header.offsetHeight
  
  // Detect scroll direction
  if (currentScrollY > lastScrollY) {
    scrollDirection = 'down'
  } else {
    scrollDirection = 'up'
  }
  
  lastScrollY = currentScrollY
  
  // Hide navbar only if scrolled down and past the header
  if (scrollDirection === 'down' && currentScrollY > headerHeight) {
    isNavbarHidden.value = true
  } else {
    isNavbarHidden.value = false
  }
}

const handleMouseEnter = () => {
  isNavbarHidden.value = false
}

const projectCardRefs = ref<HTMLElement[]>([])
const setProjectCardRef = (el: any) => {
  if (el && el instanceof HTMLElement && !projectCardRefs.value.includes(el)) {
    projectCardRefs.value.push(el)
  }
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  window.addEventListener('scroll', handleScroll)

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px 5% 0px' }
  )

  projectCardRefs.value.forEach((card) => observer?.observe(card))
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  observer?.disconnect()
})

const handleEnter = (event: MouseEvent) => {
  const card = event.currentTarget as HTMLElement | null
  const video = card?.querySelector('video') as HTMLVideoElement | null
  if (video) {
    video.play().catch(() => undefined)
  }
}

const handleLeave = (event: MouseEvent) => {
  const card = event.currentTarget as HTMLElement | null
  const video = card?.querySelector('video') as HTMLVideoElement | null
  if (video) {
    video.pause()
    video.currentTime = 0
  }
}
</script>

<template>
  <div class="site-shell">
    <div class="navbar-trigger" @mouseenter="handleMouseEnter"></div>
    <header class="site-header" :class="{ 'site-header--hidden': isNavbarHidden }" @mouseenter="handleMouseEnter">
      <div class="site-header__wrapper">
        <a class="site-title" href="/">
          <span class="site-title__name">{{ site.title }}</span>
          <span class="site-title__divider">|</span>
          <span class="site-title__role">Portfolio</span>
        </a>
        <nav class="site-nav" aria-label="Primary">
          <a v-for="item in navItems" :key="item.link" :href="item.link" :class="['site-nav__link', { 'site-nav__link--active': isActive(item.link) }]">
            {{ item.text }}
          </a>
        </nav>
      </div>
    </header>

    <section v-if="isHome" class="hero-section">
      <section class="hero-media">
        <video
          v-if="frontmatter.heroMedia?.video"
          class="hero-media__asset"
          :src="frontmatter.heroMedia.video"
          autoplay
          muted
          loop
          playsinline
          preload="metadata"
        ></video>
        <img
          v-else-if="frontmatter.heroMedia?.image"
          class="hero-media__asset"
          :src="frontmatter.heroMedia.image"
          :alt="frontmatter.heroMedia.alt || 'Featured work'"
          loading="lazy"
        />
        <div v-else class="hero-media__placeholder" aria-hidden="true"></div>
      </section>
    </section>

    <!-- Full Width Project Hero -->
    <div v-if="isProject && frontmatter.heroImage" class="project-hero-fullscreen" :style="{ backgroundImage: `url(${frontmatter.heroImage})` }"></div>

    <main class="site-main" :class="{ 'is-home': isHome }">
      <template v-if="isHome">

        <section id="projects" class="project-grid">
          <a
            v-for="project in frontmatter.projects"
            :key="project.title"
            :href="project.link"
            class="project-card"
            target="_blank"
            rel="noreferrer"
            @mouseenter="handleEnter"
            @mouseleave="handleLeave"
            :ref="setProjectCardRef"
          >
            <div class="project-card__media">
              <template v-if="project.images && project.images.length">
                <div class="project-card__media-grid">
                  <img
                    v-for="(image, index) in project.images"
                    :key="image + index"
                    :src="image"
                    :alt="project.title"
                    loading="lazy"
                  />
                </div>
              </template>
              <img
                v-else-if="project.image"
                :src="project.image"
                :alt="project.title"
                loading="lazy"
              />
              <div v-else class="project-card__placeholder" aria-hidden="true"></div>
              <video
                v-if="project.preview"
                :src="project.preview"
                muted
                loop
                playsinline
                preload="metadata"
                aria-hidden="true"
              ></video>
            </div>
            <div class="project-card__content">
              <span class="project-card__title">{{ project.title }}</span>
              <p class="project-card__desc">{{ project.description }}</p>
              <span class="project-card__cta">{{ project.cta || 'View Project' }}</span>
            </div>
          </a>
        </section>
      </template>

      <template v-else-if="isProject">
        <div class="project-layout">
           <!-- Hero removed from here, now outside main -->
           
           <div class="project-content-wrapper">
             <div class="project-header">
                <h1>{{ frontmatter.title }}</h1>
                <span v-if="frontmatter.year" class="project-year">{{ frontmatter.year }}</span>
             </div>

             <!-- Main Content (Intro & Accordions defined in Markdown) -->
             <div class="project-body">
                 <Content />
             </div>

             <div class="related-projects" v-if="frontmatter.relatedProjects">
                 <h3>Related Projects</h3>
                 <div class="related-grid">
                    <a v-for="proj in frontmatter.relatedProjects" :key="proj.title" :href="proj.link" class="related-card">
                       <img :src="proj.image" :alt="proj.title">
                       <span>{{ proj.title }}</span>
                    </a>
                 </div>
             </div>
           </div>
        </div>
      </template>

      <template v-else>
        <div class="content-page">
          <Content />
        </div>
      </template>
    </main>

    <footer class="home-footer">
      <div v-if="footerTitle" class="home-footer__title">
        {{ footerTitle }}
      </div>
      <div v-if="footerLinks?.length" class="home-footer__links">
        <a
          v-for="link in footerLinks"
          :key="link.link"
          :href="link.link"
          class="home-footer__link"
        >
          {{ link.text }}
        </a>
      </div>
      <div class="social-links">
        <a
          v-for="link in socialLinks"
          :key="link.link"
          :href="link.link"
          class="social-link"
          target="_blank"
          rel="noreferrer"
        >
          <img v-if="link.icon" :src="`/assets/icons/${link.icon}.svg`" :alt="link.name" class="social-icon" />
          <span v-else>{{ link.name }}</span>
        </a>
      </div>
    </footer>
  </div>
</template>
