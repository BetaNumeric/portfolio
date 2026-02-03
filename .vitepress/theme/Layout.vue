<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'
import { data as projectsData } from './projects.data.mjs'
import TimeScaleEmbed from './components/TimeScaleEmbed.vue'

// https://vitepress.dev/reference/runtime-api#usedata
const { site, frontmatter } = useData()
const route = useRoute()

const navItems = computed(() => site.value.themeConfig?.nav ?? [])
const socialLinks = computed(() => site.value.themeConfig?.socialLinks ?? [])
const siteTitle = computed(() => site.value.title ?? 'Portfolio')
const footerTitle = computed(() => site.value.themeConfig?.footerTitle)
const footerLinks = computed(() => site.value.themeConfig?.footerLinks ?? [])

const normalizePath = (path: string) => {
  const base = site.value.base ?? '/'
  let normalized = path
  if (base !== '/' && normalized.startsWith(base)) {
    normalized = `/${normalized.slice(base.length)}`
  }
  return normalized.replace(/\/$/, '')
}

const currentPath = computed(() => normalizePath(route.path))

const footerProjects = computed(() => {
  const candidates = projectsData.filter((project) => {
    if (!project?.link) return false
    return normalizePath(project.link) !== currentPath.value
  })

  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
})
const isHome = computed(() => frontmatter.value.layout === 'home' || frontmatter.value.home)
const isProject = computed(() => frontmatter.value.layout === 'project')
const projects = computed(() => frontmatter.value.projects ?? projectsData)
const otherProjects = computed(() => {
  const candidates = projectsData.filter((project) => {
    if (!project?.link) return false
    return normalizePath(project.link) !== currentPath.value
  })

  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
})

const currentProjectData = computed(() => {
  return projectsData.find(project => normalizePath(project.link) === currentPath.value)
})

const galleryImages = computed(() => {
  // Use frontmatter gallery
  return frontmatter.value.gallery ?? []
})

// Lightbox Logic
const lightboxIndex = ref<number | null>(null)
const isLightboxOpen = computed(() => lightboxIndex.value !== null)
const transitionDirection = ref('next')

// Swipe/Drag logic
const isDragging = ref(false)
const dragStartX = ref(0)
const dragCurrentX = ref(0)
const dragOffset = computed(() => dragCurrentX.value - dragStartX.value)

const startDrag = (e: MouseEvent | TouchEvent) => {
  isDragging.value = true
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  dragStartX.value = clientX
  dragCurrentX.value = clientX
}

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  dragCurrentX.value = clientX
}

const endDrag = () => {
  if (!isDragging.value) return
  
  const threshold = 100 // pixels to trigger navigation
  if (Math.abs(dragOffset.value) > threshold) {
    if (dragOffset.value > 0) {
      prevImage()
    } else {
      nextImage()
    }
  }
  
  isDragging.value = false
  dragStartX.value = 0
  dragCurrentX.value = 0
}

// Ignore a backdrop click immediately after a drag (prevents accidental close)
const recentlyDragged = ref(false)

const endDragWithIgnore = () => {
  endDrag()
  recentlyDragged.value = true
  setTimeout(() => {
    recentlyDragged.value = false
  }, 300)
}

const handleBackdropClick = () => {
  // If a drag just finished, ignore the backdrop click that immediately follows
  if (isDragging.value) return
  if (recentlyDragged.value) {
    recentlyDragged.value = false
    return
  }
  closeLightbox()
}

const openLightbox = (index: number) => {
  lightboxIndex.value = index
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', handleKeydown)
}

const closeLightbox = () => {
  lightboxIndex.value = null
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
  isDragging.value = false
}

const nextImage = () => {
  if (lightboxIndex.value === null) return
  transitionDirection.value = 'next'
  lightboxIndex.value = (lightboxIndex.value + 1) % galleryImages.value.length
}

const prevImage = () => {
  if (lightboxIndex.value === null) return
  transitionDirection.value = 'prev'
  lightboxIndex.value = (lightboxIndex.value - 1 + galleryImages.value.length) % galleryImages.value.length
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') nextImage()
  if (e.key === 'ArrowLeft') prevImage()
}

const isVideoPreview = (preview?: string) => {
  if (!preview) return false
  return preview.endsWith('.mp4') || preview.endsWith('.webm') || preview.endsWith('.mov')
}

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

// Theme Logic
const isDark = ref(true)

const toggleTheme = () => {
  isDark.value = !isDark.value
  updateTheme()
}

const updateTheme = () => {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (isDark.value) {
    html.classList.remove('light-mode')
    localStorage.setItem('theme', 'dark')
  } else {
    html.classList.add('light-mode')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    // Default to dark mode
    isDark.value = true
  }
  updateTheme()
})

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
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px 5% 0px' }
  )

  // Reset cards and re-observe on each mount (fixes stale state on navigation)
  projectCardRefs.value.forEach((card) => {
    card.classList.remove('is-visible')
    observer?.observe(card)
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  observer?.disconnect()
})

const resetProjectCards = () => {
  projectCardRefs.value.forEach((card) => {
    card.classList.remove('is-visible')
  })
  if (observer) {
    projectCardRefs.value.forEach((card) => {
      observer?.observe(card)
    })
  }
}

// Watch for route changes and reset cards when navigating to home
watch(
  () => route.path,
  (newPath) => {
    if (isHome.value) {
      // Use nextTick-like delay to ensure DOM is updated
      setTimeout(resetProjectCards, 0)
    }
  }
)

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
        <a class="site-title" :href="withBase('/')">
          <span class="site-title__name">{{ site.title }}</span>
          <span class="site-title__divider">|</span>
          <span class="site-title__role">Portfolio</span>
        </a>
        <nav class="site-nav" aria-label="Primary">
          <a v-for="item in navItems" :key="item.link" :href="withBase(item.link)" :class="['site-nav__link', { 'site-nav__link--active': isActive(item.link) }]">
            {{ item.text }}
          </a>
        </nav>
      </div>
      <div class="site-header__actions">
        <div class="site-header__actions-inner">
          <button @click="toggleTheme" :class="['theme-toggle', { 'is-dark': isDark }]" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
            <span class="sr-only">{{ isDark ? 'Light' : 'Dark' }}</span>
          </button>
        </div>
      </div>
    </header>

    <section v-if="isHome" class="hero-section">
      <section class="hero-media">
        <video
          v-if="frontmatter.heroMedia?.video"
          class="hero-media__asset"
          :src="withBase(frontmatter.heroMedia.video)"
          autoplay
          muted
          loop
          playsinline
          preload="metadata"
        ></video>
        <img
          v-else-if="frontmatter.heroMedia?.image"
          class="hero-media__asset"
          :src="withBase(frontmatter.heroMedia.image)"
          :alt="frontmatter.heroMedia.alt || 'Featured work'"
          loading="lazy"
        />
        <div v-else class="hero-media__placeholder" aria-hidden="true"></div>
      </section>
    </section>

    <!-- Full Width Project Hero -->
    <TimeScaleEmbed v-if="isProject && frontmatter.heroComponent === 'TimeScaleEmbed'" />
    <div v-else-if="isProject && frontmatter.heroImage" class="project-hero-fullscreen" :style="{ backgroundImage: `url(${withBase(frontmatter.heroImage)})` }"></div>

    <main class="site-main" :class="{ 'is-home': isHome }">
      <template v-if="isHome">

        <section id="projects" class="project-grid">
          <a
            v-for="project in projects"
            :key="project.title"
            :href="withBase(project.link)"
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
                    :src="withBase(image)"
                    :alt="project.title"
                    loading="lazy"
                  />
                </div>
              </template>
              <img
                v-else-if="project.image"
                class="project-card__media-base"
                :src="withBase(project.image)"
                :alt="project.title"
                loading="lazy"
              />
              <div v-else class="project-card__placeholder" aria-hidden="true"></div>
              <video
                v-if="project.preview && isVideoPreview(project.preview)"
                class="project-card__media-preview"
                :src="withBase(project.preview)"
                muted
                loop
                playsinline
                preload="metadata"
                aria-hidden="true"
              ></video>
              <img
                v-else-if="project.preview"
                class="project-card__media-preview"
                :src="withBase(project.preview)"
                :alt="project.title"
                loading="lazy"
              />
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

             <div class="project-gallery" v-if="galleryImages.length">
               <h3>Gallery</h3>
               <div class="gallery-grid">
                 <img
                   v-for="(image, index) in galleryImages.slice(0, 4)"
                   :key="image"
                   :src="withBase(image)"
                   :alt="`${frontmatter.title} gallery image ${(index as number) + 1}`"
                   loading="lazy"
                   @click="openLightbox(index as number)"
                   class="gallery-image"
                 />
               </div>
             </div>

             <!-- Gallery Lightbox -->
             <Teleport to="body">
              <div v-if="isLightboxOpen" class="gallery-lightbox" @click.self="handleBackdropClick">
                 <button class="lightbox-close" @click="closeLightbox">&times;</button>
                 
                <div class="lightbox-main" @click.self="handleBackdropClick">
                   <button class="lightbox-nav prev" @click.stop="prevImage" aria-label="Previous image">
                     <img :src="withBase('/assets/icons/chevron_w.svg')" alt="" />
                   </button>
                   
                   <div 
                     class="lightbox-image-container" 
                     @click.self="handleBackdropClick"
                     @mousedown="startDrag"
                     @mousemove="onDrag"
                     @mouseup="endDragWithIgnore"
                     @mouseleave="endDragWithIgnore"
                     @touchstart="startDrag"
                     @touchmove="onDrag"
                     @touchend="endDragWithIgnore"
                   >
                     <Transition :name="isDragging ? '' : `slide-${transitionDirection}`">
                       <img 
                         :key="lightboxIndex ?? 0"
                         :src="withBase(galleryImages[lightboxIndex || 0])" 
                         class="lightbox-current-image"
                         :style="{ transform: isDragging ? `translateX(${dragOffset}px)` : '' }"
                         draggable="false"
                         alt=""
                       />
                     </Transition>
                   </div>
                   
                   <button class="lightbox-nav next" @click.stop="nextImage" aria-label="Next image">
                     <img :src="withBase('/assets/icons/chevron_w.svg')" alt="" />
                   </button>
                 </div>
                 
                 <div class="lightbox-thumbnails">
                   <div 
                     v-for="(image, index) in galleryImages" 
                     :key="image"
                     class="lightbox-thumb"
                     :class="{ active: index === lightboxIndex }"
                     @click.stop="() => { transitionDirection = 'jump'; lightboxIndex = index as number; }"
                   >
                     <img :src="withBase(image)" alt="" />
                   </div>
                 </div>
               </div>
             </Teleport>

             <div class="other-projects" v-if="otherProjects.length">
               <h3>Other Projects</h3>
               <div class="other-grid">
                 <a
                   v-for="proj in otherProjects"
                   :key="proj.title"
                   :href="withBase(proj.link)"
                   class="other-card"
                   @mouseenter="handleEnter"
                   @mouseleave="handleLeave"
                 >
                   <div class="other-card__media">
                     <img
                       class="other-card__media-base"
                       :src="withBase(proj.image)"
                       :alt="proj.title"
                       loading="lazy"
                     />
                     <video
                       v-if="proj.preview && isVideoPreview(proj.preview)"
                       class="other-card__media-preview"
                       :src="withBase(proj.preview)"
                       muted
                       loop
                       playsinline
                       preload="metadata"
                       aria-hidden="true"
                     ></video>
                     <img
                       v-else-if="proj.preview"
                       class="other-card__media-preview"
                       :src="withBase(proj.preview)"
                       :alt="proj.title"
                       loading="lazy"
                     />
                   </div>
                   <span class="other-card__title">{{ proj.title }}</span>
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
      <div class="footer-content">
        <a :href="withBase('/')" class="footer-site-title">
          <span class="footer-site-name">{{ siteTitle }}</span>
          <span class="footer-site-divider">|</span>
          <span class="footer-site-role">Portfolio</span>
        </a>

        <div v-if="footerProjects.length" class="home-footer__links">
          <a
            v-for="proj in footerProjects"
            :key="proj.title"
            :href="withBase(proj.link)"
            class="home-footer__link"
          >
            {{ proj.title }}
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
            <img v-if="link.icon" :src="withBase(`/assets/icons/${link.icon}.svg`)" :alt="link.name" class="social-icon" />
            <span v-else>{{ link.name }}</span>
          </a>
        </div>
        <button :class="['footer-toggle','theme-toggle', { 'is-dark': isDark }]" @click="toggleTheme" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <span class="sr-only">{{ isDark ? 'Light' : 'Dark' }}</span>
        </button>
      </div>
    </footer>
  </div>
</template>
