<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'
import { data as projectsData } from './projects.data.mjs'
import TimeScaleEmbed from './components/TimeScaleEmbed.vue'
import AlgorithmicDrawingEmbed from './components/AlgorithmicDrawingEmbed.vue'
import LumaHeroEmbed from './components/LumaHeroEmbed.vue'
import { installArrowKeyScroll } from './utils/arrowKeyScroll'
import { installSmoothWheelScroll } from './utils/smoothWheelScroll'

const interactiveHomeHeroUnavailable = ref(false)
const forceSimpleHomeHero = ref(false)

const InteractiveHomeHero = defineAsyncComponent({
  loader: () => import('./components/HomeHero.vue'),
  onError(_error, _retry, fail) {
    interactiveHomeHeroUnavailable.value = true
    fail()
  },
})

// https://vitepress.dev/reference/runtime-api#usedata
const { site, frontmatter } = useData()
const route = useRoute()

const navItems = computed(() => site.value.themeConfig?.nav ?? [])
const socialLinks = computed(() => site.value.themeConfig?.socialLinks ?? [])
const siteTitle = computed(() => site.value.title ?? 'Portfolio')

const normalizePath = (path: string) => {
  const base = site.value.base ?? '/'
  let normalized = path
  if (base !== '/' && normalized.startsWith(base)) {
    normalized = `/${normalized.slice(base.length)}`
  }
  return normalized.replace(/\/$/, '')
}

const currentPath = computed(() => normalizePath(route.path))

const RELATED_PROJECT_COUNT = 3

const getDeterministicSeed = (input: string) => {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }
  return hash
}

const selectRelatedProjects = (salt: string) => {
  const candidates = projectsData.filter((project) => {
    if (!project?.link) return false
    return normalizePath(project.link) !== currentPath.value
  })

  if (!candidates.length) return []

  const offset = getDeterministicSeed(`${currentPath.value}:${salt}`) % candidates.length
  return [...candidates.slice(offset), ...candidates.slice(0, offset)].slice(0, RELATED_PROJECT_COUNT)
}

const footerProjects = computed(() => selectRelatedProjects('footer'))
const isHome = computed(() => frontmatter.value.layout === 'home' || frontmatter.value.home)
const isProject = computed(() => frontmatter.value.layout === 'project')
const showInteractiveHomeHero = computed(() => {
  return isHome.value && !forceSimpleHomeHero.value && !interactiveHomeHeroUnavailable.value
})

const syncHomeHeroPreferenceFromUrl = () => {
  if (typeof window === 'undefined') return
  const wasForcedSimple = forceSimpleHomeHero.value
  forceSimpleHomeHero.value = new URLSearchParams(window.location.search).get('hero') === 'simple'

  if (wasForcedSimple && !forceSimpleHomeHero.value) {
    interactiveHomeHeroUnavailable.value = false
  }
}

const handleInteractiveHomeHeroUnavailable = () => {
  interactiveHomeHeroUnavailable.value = true
}

const projects = computed(() => frontmatter.value.projects ?? projectsData)
type ProjectCard = (typeof projectsData)[number] & {
  cta?: string
  images?: string[]
  tags?: string[]
}

const normalizeProjectTags = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) return []
  return tags
    .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
    .filter((tag): tag is string => tag.length > 0)
}

const activeProjectTag = ref('all')

const availableProjectTags = computed(() => {
  const tagCounts = new Map<string, number>()

  ;(projects.value as ProjectCard[]).forEach((project) => {
    normalizeProjectTags(project.tags).forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    })
  })

  return [...tagCounts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0])
    })
    .map(([tag]) => tag)
})

const projectFilterRef = ref<HTMLElement | null>(null)
const projectFilterTriggerRef = ref<HTMLButtonElement | null>(null)
const projectFilterOpen = ref(false)
const projectFilterHighlightedIndex = ref(0)
const projectFilterOptions = computed(() => [
  { value: 'all', label: 'All Projects' },
  ...availableProjectTags.value.map((tag) => ({ value: tag, label: tag })),
])
const activeProjectTagLabel = computed(() => {
  return projectFilterOptions.value.find((option) => option.value === activeProjectTag.value)?.label ?? 'All Projects'
})

const focusProjectFilterOption = async (index: number) => {
  await nextTick()
  const options = projectFilterRef.value?.querySelectorAll<HTMLButtonElement>('.project-filter__option')
  options?.[index]?.focus()
}

const openProjectFilter = async (focusOption = false) => {
  const selectedIndex = projectFilterOptions.value.findIndex((option) => option.value === activeProjectTag.value)
  projectFilterHighlightedIndex.value = Math.max(selectedIndex, 0)
  projectFilterOpen.value = true
  if (focusOption) await focusProjectFilterOption(projectFilterHighlightedIndex.value)
}

const closeProjectFilter = (restoreTriggerFocus = false) => {
  projectFilterOpen.value = false
  if (restoreTriggerFocus) projectFilterTriggerRef.value?.focus()
}

const toggleProjectFilter = () => {
  if (projectFilterOpen.value) {
    closeProjectFilter()
  } else {
    void openProjectFilter()
  }
}

const selectProjectTag = async (value: string) => {
  activeProjectTag.value = value
  closeProjectFilter(true)
  await nextTick()
  syncProjectCardsWithViewport()
}

const handleProjectFilterTriggerKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && projectFilterOpen.value) {
    event.preventDefault()
    closeProjectFilter()
    return
  }

  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  void openProjectFilter(true)
}

const handleProjectFilterMenuKeydown = (event: KeyboardEvent) => {
  const optionCount = projectFilterOptions.value.length
  if (!optionCount) return

  if (event.key === 'Escape') {
    event.preventDefault()
    closeProjectFilter(true)
    return
  }

  let nextIndex = projectFilterHighlightedIndex.value
  if (event.key === 'ArrowDown') nextIndex = (nextIndex + 1) % optionCount
  else if (event.key === 'ArrowUp') nextIndex = (nextIndex - 1 + optionCount) % optionCount
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = optionCount - 1
  else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    void selectProjectTag(projectFilterOptions.value[nextIndex].value)
    return
  } else {
    return
  }

  event.preventDefault()
  projectFilterHighlightedIndex.value = nextIndex
  void focusProjectFilterOption(nextIndex)
}

const handleProjectFilterFocusOut = (event: FocusEvent) => {
  const nextTarget = event.relatedTarget
  if (nextTarget instanceof Node && projectFilterRef.value?.contains(nextTarget)) return
  closeProjectFilter()
}

const handleProjectFilterOutsidePointer = (event: PointerEvent) => {
  if (!projectFilterOpen.value) return
  const target = event.target
  if (target instanceof Node && projectFilterRef.value?.contains(target)) return
  closeProjectFilter()
}

const filteredProjects = computed(() => {
  if (activeProjectTag.value === 'all') return projects.value as ProjectCard[]

  return (projects.value as ProjectCard[]).filter((project) => {
    return normalizeProjectTags(project.tags).includes(activeProjectTag.value)
  })
})

const defaultHomeGridLayout = computed<'single' | 'two'>(() => {
  const requested = Number(frontmatter.value.projectGridColumns ?? 1)
  return requested === 2 ? 'two' : 'single'
})
const HOME_GRID_LAYOUT_KEY = 'home-project-grid-layout'
const homeGridLayout = ref<'single' | 'two'>(defaultHomeGridLayout.value)

const getSavedHomeGridLayout = (): 'single' | 'two' | null => {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(HOME_GRID_LAYOUT_KEY)
  if (saved === 'single' || saved === 'two') return saved
  return null
}

const resolveHomeGridLayout = (): 'single' | 'two' => {
  return getSavedHomeGridLayout() ?? defaultHomeGridLayout.value
}

const setHomeGridLayout = async (layout: 'single' | 'two') => {
  if (homeGridLayout.value === layout) return
  homeGridLayout.value = layout
  if (typeof window !== 'undefined') {
    localStorage.setItem(HOME_GRID_LAYOUT_KEY, layout)
  }
  await nextTick()
  syncProjectCardsWithViewport()
}
const isHomeTwoColumnCards = computed(() => isHome.value && homeGridLayout.value === 'two')
const otherProjects = computed(() => selectRelatedProjects('other'))

const galleryMedia = computed<string[]>(() => {
  const media = frontmatter.value.gallery
  if (!Array.isArray(media)) return []
  return media.filter((item): item is string => typeof item === 'string' && item.length > 0)
})

// Lightbox Logic
const lightboxIndex = ref<number | null>(null)
const isLightboxOpen = computed(() => lightboxIndex.value !== null)
const transitionDirection = ref('next')
const prefersReducedMotion = ref(false)
const lightboxDialog = ref<HTMLElement | null>(null)
const lightboxCloseButton = ref<HTMLButtonElement | null>(null)
let previousBodyOverflow = ''
let lightboxTrigger: HTMLElement | null = null

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

const openLightbox = (index: number, event?: Event) => {
  if (typeof document !== 'undefined' && lightboxIndex.value === null) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    lightboxTrigger = event?.currentTarget as HTMLElement | null
  }
  lightboxIndex.value = index
  window.addEventListener('keydown', handleKeydown)
  nextTick(() => lightboxCloseButton.value?.focus())
}

const closeLightbox = (restoreFocus = true) => {
  if (lightboxIndex.value === null) return
  if (typeof document !== 'undefined') {
    document.body.style.overflow = previousBodyOverflow
  }
  previousBodyOverflow = ''
  lightboxIndex.value = null
  window.removeEventListener('keydown', handleKeydown)
  isDragging.value = false
  dragStartX.value = 0
  dragCurrentX.value = 0
  recentlyDragged.value = false
  const trigger = lightboxTrigger
  lightboxTrigger = null
  if (restoreFocus && trigger?.isConnected) {
    nextTick(() => trigger.focus())
  }
}

const nextImage = () => {
  if (lightboxIndex.value === null || !galleryMedia.value.length) return
  transitionDirection.value = 'next'
  lightboxIndex.value = (lightboxIndex.value + 1) % galleryMedia.value.length
}

const prevImage = () => {
  if (lightboxIndex.value === null || !galleryMedia.value.length) return
  transitionDirection.value = 'prev'
  lightboxIndex.value = (lightboxIndex.value - 1 + galleryMedia.value.length) % galleryMedia.value.length
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    closeLightbox()
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    nextImage()
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prevImage()
  }
  if (e.key === 'Tab' && lightboxDialog.value) {
    const focusable = Array.from(
      lightboxDialog.value.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
    )
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

const videoPreviewPattern = /\.(mp4|webm|mov|m4v|ogv|ogg)(?:$|[?#])/i

const isVideoPreview = (preview?: string) => {
  if (!preview) return false
  return videoPreviewPattern.test(preview)
}

const currentLightboxMedia = computed(() => {
  if (lightboxIndex.value === null) return undefined
  return galleryMedia.value[lightboxIndex.value]
})

const isActive = (link: string) => {
  if (link === '/') return route.path === '/'
  return route.path.startsWith(link)
}

const shouldOpenInNewTab = (link: string) => /^https?:\/\//i.test(link)

const isNavbarHidden = ref(false)
let lastScrollY = 0
let scrollDirection: 'up' | 'down' = 'up'

const resolvedHeroEmbedDarkMode = computed<boolean | null>(() => {
  const requested = frontmatter.value.heroEmbedDarkMode
  if (requested === 'auto') return isDark.value
  return typeof requested === 'boolean' ? requested : null
})

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

// Mobile nav toggle
const mobileNavOpen = ref(false)
const toggleMobileNav = () => {
  mobileNavOpen.value = !mobileNavOpen.value
}

let observer: IntersectionObserver | null = null
let removeArrowKeyScroll: (() => void) | null = null
let removeSmoothWheelScroll: (() => void) | null = null

const collectProjectCards = () => {
  if (typeof document === 'undefined') return []
  const cards = Array.from(document.querySelectorAll('#projects .project-card')) as HTMLElement[]
  return cards
}

const isInViewport = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect()
  return rect.top < window.innerHeight * 0.95 && rect.bottom > 0
}

const syncProjectCardsWithViewport = () => {
  const cards = collectProjectCards()
  cards.forEach((card) => {
    if (isInViewport(card)) {
      card.classList.add('is-visible')
    }
    observer?.observe(card)
  })
}

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  homeGridLayout.value = resolveHomeGridLayout()
  syncHomeHeroPreferenceFromUrl()
  removeArrowKeyScroll = installArrowKeyScroll()
  removeSmoothWheelScroll = installSmoothWheelScroll()
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('popstate', syncHomeHeroPreferenceFromUrl)
  document.addEventListener('pointerdown', handleProjectFilterOutsidePointer)

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

  // Pick up any cards currently in view (and re-observe them) on initial mount.
  syncProjectCardsWithViewport()
})

onUnmounted(() => {
  closeLightbox(false)
  removeArrowKeyScroll?.()
  removeArrowKeyScroll = null
  removeSmoothWheelScroll?.()
  removeSmoothWheelScroll = null
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('popstate', syncHomeHeroPreferenceFromUrl)
  document.removeEventListener('pointerdown', handleProjectFilterOutsidePointer)
  observer?.disconnect()
})

const resetProjectCards = () => {
  const cards = collectProjectCards()
  cards.forEach((card) => {
    card.classList.remove('is-visible')
  })
  if (observer) {
    cards.forEach((card) => {
      observer?.observe(card)
    })
  }
}

// Watch for route changes and reset cards when navigating to home
watch(
  () => route.path,
  () => {
    syncHomeHeroPreferenceFromUrl()
    closeProjectFilter()
    closeLightbox()
    mobileNavOpen.value = false
    if (isHome.value) {
      homeGridLayout.value = resolveHomeGridLayout()
    }
    // Use nextTick-like delay to ensure DOM is updated
    setTimeout(() => {
      if (isHome.value) resetProjectCards()
    }, 0)
  }
)

watch(availableProjectTags, (tags) => {
  if (activeProjectTag.value !== 'all' && !tags.includes(activeProjectTag.value)) {
    activeProjectTag.value = 'all'
  }
})

watch(activeProjectTag, async () => {
  if (!isHome.value) return
  await nextTick()
  syncProjectCardsWithViewport()
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
        <a class="site-title" :href="withBase('/')">
          <span class="site-title__name">{{ site.title }}</span>
          <span class="site-title__divider">|</span>
          <span class="site-title__role">Portfolio</span>
        </a>
        <nav :class="['site-nav', { 'is-open': mobileNavOpen }]" aria-label="Primary">
          <a v-for="item in navItems" :key="item.link" :href="withBase(item.link)" :class="['site-nav__link', { 'site-nav__link--active': isActive(item.link) }]" :aria-current="isActive(item.link) ? 'page' : undefined" @click="mobileNavOpen = false">
            {{ item.text }}
          </a>
        </nav>
        <button class="nav-toggle" @click="toggleMobileNav" :aria-expanded="mobileNavOpen" aria-label="Toggle navigation">
          <span class="nav-toggle__bar"></span>
          <span class="nav-toggle__bar"></span>
          <span class="nav-toggle__bar"></span>
        </button>
      </div>
      <div class="site-header__actions">
        <div class="site-header__actions-inner">
          <button @click="toggleTheme" :class="['theme-toggle', { 'is-dark': isDark }]" :aria-pressed="!isDark" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
            <span class="sr-only">{{ isDark ? 'Light' : 'Dark' }}</span>
          </button>
        </div>
      </div>
    </header>

    <section v-if="showInteractiveHomeHero" class="interactive-home-hero" aria-label="Featured projects">
      <InteractiveHomeHero @unavailable="handleInteractiveHomeHeroUnavailable" />
    </section>

    <!-- Full Width Project Hero -->
    <TimeScaleEmbed v-if="isProject && frontmatter.heroComponent === 'TimeScaleEmbed'" />
    <AlgorithmicDrawingEmbed v-else-if="isProject && frontmatter.heroComponent === 'AlgorithmicDrawingEmbed'" />
    <LumaHeroEmbed
      v-else-if="isProject && frontmatter.heroComponent === 'LumaHeroEmbed' && frontmatter.heroEmbedUrl"
      :src="frontmatter.heroEmbedUrl"
      :title="frontmatter.heroEmbedTitle || frontmatter.title || 'Luma embed'"
      :dark-mode="resolvedHeroEmbedDarkMode"
      :layout-preset="typeof frontmatter.heroEmbedLayoutPreset === 'string' ? frontmatter.heroEmbedLayoutPreset : null"
      :height="typeof frontmatter.heroEmbedHeight === 'string' ? frontmatter.heroEmbedHeight : null"
      :min-height="typeof frontmatter.heroEmbedMinHeight === 'string' ? frontmatter.heroEmbedMinHeight : null"
      :mobile-height="typeof frontmatter.heroEmbedMobileHeight === 'string' ? frontmatter.heroEmbedMobileHeight : null"
      :mobile-min-height="typeof frontmatter.heroEmbedMobileMinHeight === 'string' ? frontmatter.heroEmbedMobileMinHeight : null"
    />
    <div
      v-else-if="isProject && frontmatter.heroImage"
      class="project-hero-fullscreen"
      :style="{ backgroundImage: `url(${withBase(frontmatter.heroImage)})` }"
    ></div>
    <main class="site-main" :class="{ 'is-home': isHome, 'is-home--interactive': showInteractiveHomeHero }">
      <template v-if="isHome">
        <header v-if="!showInteractiveHomeHero" class="home-intro">
          <p class="home-intro__role">{{ frontmatter.homeRole }}</p>
          <h1>{{ frontmatter.homeHeading || site.title }}</h1>
          <p class="home-intro__text">{{ frontmatter.homeIntro }}</p>
        </header>

        <div class="project-grid-controls" v-if="projects.length > 1">
          <div
            v-if="availableProjectTags.length"
            ref="projectFilterRef"
            class="project-filter"
            @focusout="handleProjectFilterFocusOut"
          >
            <span class="project-filter__label project-filter__label--sr-only">Filter projects by tag</span>
            <button
              ref="projectFilterTriggerRef"
              id="project-tag-filter"
              class="project-filter__trigger"
              type="button"
              aria-label="Filter projects by tag"
              aria-haspopup="listbox"
              :aria-expanded="projectFilterOpen"
              aria-controls="project-tag-options"
              @click="toggleProjectFilter"
              @keydown="handleProjectFilterTriggerKeydown"
            >
              <span>{{ activeProjectTagLabel }}</span>
              <span class="project-filter__chevron" aria-hidden="true"></span>
            </button>
            <div
              v-if="projectFilterOpen"
              id="project-tag-options"
              class="project-filter__menu"
              role="listbox"
              aria-label="Project categories"
              @keydown="handleProjectFilterMenuKeydown"
            >
              <button
                v-for="(option, index) in projectFilterOptions"
                :key="option.value"
                class="project-filter__option"
                :class="{ 'is-selected': option.value === activeProjectTag }"
                type="button"
                role="option"
                :aria-selected="option.value === activeProjectTag"
                :tabindex="projectFilterHighlightedIndex === index ? 0 : -1"
                @mouseenter="projectFilterHighlightedIndex = index"
                @focus="projectFilterHighlightedIndex = index"
                @click="selectProjectTag(option.value)"
              >
                <span>{{ option.label }}</span>
                <span class="project-filter__check" aria-hidden="true">
                  {{ option.value === activeProjectTag ? '✓' : '' }}
                </span>
              </button>
            </div>
          </div>

          <div class="layout-toggle" role="group" aria-label="Project card layout">
            <button
              class="layout-toggle__btn"
              :class="{ 'is-active': homeGridLayout === 'single' }"
              type="button"
              aria-label="Single column layout"
              :aria-pressed="homeGridLayout === 'single'"
              @click="setHomeGridLayout('single')"
            >
              <span class="layout-icon layout-icon--single" aria-hidden="true"></span>
            </button>
            <button
              class="layout-toggle__btn"
              :class="{ 'is-active': homeGridLayout === 'two' }"
              type="button"
              aria-label="Two column layout"
              :aria-pressed="homeGridLayout === 'two'"
              @click="setHomeGridLayout('two')"
            >
              <span class="layout-icon layout-icon--two" aria-hidden="true"></span>
            </button>
          </div>
        </div>

        <section id="projects" :class="['project-grid', { 'project-grid--two-col': isHomeTwoColumnCards }]">
          <a
            v-for="project in filteredProjects"
            :key="project.title"
            :href="withBase(project.link)"
            :class="['project-card', { 'project-card--stacked': isHomeTwoColumnCards }]"
            @mouseenter="handleEnter"
            @mouseleave="handleLeave"
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
        <p v-if="!filteredProjects.length" class="project-grid-empty">
          No projects match the selected tag.
        </p>
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

             <div class="project-gallery" v-if="galleryMedia.length">
               <h3>Gallery</h3>
               <div class="gallery-grid">
                 <button
                   v-for="(media, index) in galleryMedia.slice(0, 4)"
                   :key="`${media}-${index}`"
                   class="gallery-button"
                   type="button"
                   :aria-label="`Open ${frontmatter.title} gallery item ${(index as number) + 1}`"
                   aria-haspopup="dialog"
                   @click="openLightbox(index as number, $event)"
                 >
                   <video
                     v-if="isVideoPreview(media)"
                     :src="withBase(media)"
                     class="gallery-image"
                     :autoplay="!prefersReducedMotion"
                     loop
                     muted
                     playsinline
                     preload="metadata"
                     aria-hidden="true"
                    ></video>
                    <img
                      v-else
                     :src="withBase(media)"
                      :alt="`${frontmatter.title} gallery image ${(index as number) + 1}`"
                      loading="lazy"
                      class="gallery-image"
                    />
                 </button>
               </div>
             </div>

             <!-- Gallery Lightbox -->
             <Teleport to="body">
              <div
                v-if="isLightboxOpen"
                ref="lightboxDialog"
                class="gallery-lightbox"
                role="dialog"
                aria-modal="true"
                :aria-label="`${frontmatter.title} gallery`"
                @click.self="handleBackdropClick"
              >
                 <button ref="lightboxCloseButton" class="lightbox-close" type="button" aria-label="Close gallery" @click="closeLightbox()">&times;</button>
                 
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
                        <video
                          v-if="currentLightboxMedia && isVideoPreview(currentLightboxMedia)"
                          :key="currentLightboxMedia"
                          :src="withBase(currentLightboxMedia)"
                          class="lightbox-current-media"
                          :style="{ transform: isDragging ? `translateX(${dragOffset}px)` : '' }"
                          :autoplay="!prefersReducedMotion"
                          loop
                          muted
                          playsinline
                          preload="metadata"
                          controls
                          aria-label="Gallery video"
                        ></video>
                        <img
                          v-else-if="currentLightboxMedia"
                          :key="currentLightboxMedia"
                          :src="withBase(currentLightboxMedia)"
                          class="lightbox-current-media"
                          :style="{ transform: isDragging ? `translateX(${dragOffset}px)` : '' }"
                          draggable="false"
                          :alt="`${frontmatter.title} gallery image ${(lightboxIndex ?? 0) + 1}`"
                        />
                      </Transition>
                    </div>
                   
                   <button class="lightbox-nav next" @click.stop="nextImage" aria-label="Next image">
                     <img :src="withBase('/assets/icons/chevron_w.svg')" alt="" />
                   </button>
                 </div>
                 
                 <div class="lightbox-thumbnails">
                    <button
                      v-for="(media, index) in galleryMedia"
                      :key="`${media}-${index}`"
                      class="lightbox-thumb"
                      :class="{ active: index === lightboxIndex }"
                      type="button"
                      :aria-label="`Show gallery item ${(index as number) + 1}`"
                      :aria-current="index === lightboxIndex ? 'true' : undefined"
                      @click.stop="() => { transitionDirection = 'jump'; lightboxIndex = index as number; }"
                    >
                      <video
                        v-if="isVideoPreview(media)"
                        :src="withBase(media)"
                        :autoplay="!prefersReducedMotion"
                        loop
                        muted
                        playsinline
                        preload="metadata"
                        aria-hidden="true"
                      ></video>
                      <img v-else :src="withBase(media)" alt="" />
                    </button>
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
            :target="shouldOpenInNewTab(link.link) ? '_blank' : undefined"
            :rel="shouldOpenInNewTab(link.link) ? 'noreferrer' : undefined"
            :aria-label="link.name || link.icon || link.link"
            :title="link.name || link.icon || link.link"
          >
            <img v-if="link.icon" :src="withBase(`/assets/icons/${link.icon}.svg`)" alt="" aria-hidden="true" class="social-icon" />
            <span v-else>{{ link.name }}</span>
          </a>
        </div>
        <button :class="['footer-toggle','theme-toggle', { 'is-dark': isDark }]" @click="toggleTheme" :aria-pressed="!isDark" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <span class="sr-only">{{ isDark ? 'Light' : 'Dark' }}</span>
        </button>
      </div>
    </footer>

  </div>
</template>
