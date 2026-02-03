<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, withBase } from 'vitepress'
import { data as projectsData } from '../projects.data.mjs'

// Filter only projects with images
const projects = projectsData.filter(p => p.image && !p.link.includes('_template'))

const currentIndex = ref(0)
const timer = ref<number | null>(null)
const slideDuration = 5000 // 5 seconds per slide
const progress = ref(0)
let animationFrame: number | null = null
let startTime: number = 0

const currentProject = computed(() => projects[currentIndex.value])

const router = useRouter()

const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % projects.length
  resetTimer()
}

const goToProject = (link: string) => {
  if (!link) return
  // Use router.push for SPA navigation when available, else fallback to full navigation
  try {
    // 'router' from vitepress may not declare 'push' in its type; cast to any for runtime check
    if (router && typeof (router as any).push === 'function') {
      ;(router as any).push(link)
      return
    }
  } catch (e) {
    // fallthrough to full navigation
  }
  window.location.href = withBase(link)
}

const updateProgress = () => {
  if (!timer.value) {
    progress.value = 0
    return
  }
  
  const elapsed = Date.now() - startTime
  progress.value = Math.min((elapsed / slideDuration) * 100, 100)
  
  if (elapsed < slideDuration) {
    animationFrame = requestAnimationFrame(updateProgress)
  } else {
    progress.value = 100
  }
}

const startTimer = () => {
  if (timer.value) return
  
  startTime = Date.now() - (progress.value / 100 * slideDuration) // Resume from current progress
  timer.value = window.setInterval(nextSlide, slideDuration - (progress.value / 100 * slideDuration))
  
  // Actually, standard setInterval is cleaner if we just reset. 
  // Let's just reset for simplicity or handle pause correctly.
  
  // Simple approach:
  clearInterval(timer.value)
  startTime = Date.now()
  timer.value = window.setInterval(() => {
     nextSlide()
     startTime = Date.now()
  }, slideDuration)
  
  updateProgress()
}

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

// Reset timer completely (on slide change)
const resetTimer = () => {
  stopTimer()
  progress.value = 0
  startTimer()
}

// Watch for manual index change to reset timer
watch(currentIndex, () => {
  // If manual change (click), we want to reset the view
})

onMounted(() => {
  if (projects.length > 0) {
    startTimer()
  }
})

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="home-hero" @mouseenter="stopTimer" @mouseleave="startTimer">
    <Transition name="fade" mode="out-in">
      <div 
        :key="currentProject.link" 
        class="hero-slide" 
        :style="{ backgroundImage: `url(${withBase(currentProject.image)})` }"
        @click="goToProject(currentProject.link)"
      >
        <div class="slide-overlay">
          <div class="slide-content">
            <div class="slide-meta">
              <span class="slide-year">{{ currentProject.year }}</span>
              <span class="slide-divider">/</span>
              <span class="slide-label">FEATURED PROJECT</span>
            </div>
            <h1 class="slide-title">{{ currentProject.title }}</h1>
            <p class="slide-desc">{{ currentProject.description }}</p>
            
            <a :href="withBase(currentProject.link)" class="slide-cta" @click.prevent="goToProject(currentProject.link)">
              View Project 
              <span class="arrow">→</span>
            </a>
          </div>
        </div>
      </div>
    </Transition>

    <div class="slide-indicators">
      <button 
        v-for="(project, index) in projects" 
        :key="project.link"
        class="indicator-btn"
        :class="{ active: index === currentIndex }"
        @click.stop="currentIndex = index; resetTimer()"
        :aria-label="`Go to slide ${index + 1}`"
      >
        <span class="indicator-line">
          <span 
            class="indicator-progress" 
            :style="{ width: index === currentIndex ? `${progress}%` : (index < currentIndex ? '100%' : '0%') }"
          ></span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.home-hero {
  position: relative;
  width: 100%;
  height: 80vh; /* Prominent hero height */
  min-height: 600px;
  background-color: var(--site-bg);
  overflow: hidden;
  margin-top: 60px; /* Navbar height */
  border-bottom: 1px solid var(--site-border);
}

.hero-slide {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  position: absolute;
  top: 0;
  left: 0;
  transition: transform 0.5s ease;
}

/* Subtle zoom effect on hover (optional, if we want interactivity) */
.hero-slide:hover {
  transform: scale(1.02);
  /* Transition is applied on the base .hero-slide for smooth animation */
}

/* Dark gradient overlay for text readability */
.slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0.6) 60%,
    rgba(0, 0, 0, 0.9) 100%
  );
  display: flex;
  align-items: flex-end;
  padding: 4rem;
}

.slide-content {
  max-width: 800px;
  color: #fff;
  position: relative;
  z-index: 2;
}

.slide-meta {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
}

.slide-title {
  font-size: 4rem;
  line-height: 1.1;
  font-weight: 700;
  margin: 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.slide-desc {
  font-size: 1.25rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 2rem;
  max-width: 600px;
}

.slide-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
  padding-bottom: 2px;
  transition: all 0.3s ease;
}

.slide-cta:hover {
  border-bottom-color: #fff;
  gap: 0.8rem;
}

.slide-indicators {
  position: absolute;
  bottom: 2rem;
  right: 4rem;
  display: flex;
  gap: 0.5rem;
  z-index: 10;
}

.indicator-btn {
  background: none;
  border: none;
  padding: 10px 0;
  cursor: pointer;
  width: 40px;
  height: 30px; /* Larger hit area */
  display: flex;
  align-items: center;
}

.indicator-line {
  display: block;
  width: 100%;
  height: 2px;
  background-color: rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
  transition: height 0.3s ease;
}

.indicator-btn:hover .indicator-line,
.indicator-btn.active .indicator-line {
  height: 4px;
  background-color: rgba(255, 255, 255, 0.4);
}

.indicator-progress {
  display: block;
  height: 100%;
  background-color: #fff;
  width: 0%;
  /* No transition for progress to make it linear via JS requestAnimationFrame, 
     but we can toggle class for the 'filled' state */
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .home-hero {
    height: 70vh;
  }
  
  .slide-overlay {
    padding: 2rem;
  }
  
  .slide-title {
    font-size: 2.5rem;
  }
  
  .slide-indicators {
    bottom: 1.5rem;
    right: 2rem; 
    /* Maybe move to center on mobile? */
    left: 2rem;
    justify-content: center;
    right: auto;
  }
}
</style>
