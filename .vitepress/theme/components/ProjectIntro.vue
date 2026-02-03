<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { withBase } from 'vitepress'
// load lottie-web dynamically to avoid SSR/window errors

const props = defineProps<{
  video?: string
  image?: string
  alt?: string
  fullVideo?: string
  externalLink?: string
}>()

const lottieContainer = ref<HTMLDivElement | null>(null)
const mediaContainer = ref<HTMLDivElement | null>(null)
const showLottie = ref(false)
const isLightboxOpen = ref(false)

const embedUrl = computed(() => {
  if (!props.fullVideo) return ''
  
  const url = props.fullVideo
  
  // YouTube generic
  const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`
  }
  
  // Vimeo generic
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
  }
  
  return url
})

const openLightbox = () => {
  if (props.externalLink) {
    window.open(props.externalLink, '_blank')
  } else if (props.fullVideo) {
    isLightboxOpen.value = true
    // Prevent scrolling when lightbox is open
    document.body.style.overflow = 'hidden'
  }
}

const closeLightbox = () => {
  isLightboxOpen.value = false
  document.body.style.overflow = ''
}

onMounted(() => {
  if (lottieContainer.value) {
    import('lottie-web').then((mod) => {
      const lottie = (mod && (mod.default ?? mod))
      lottie.loadAnimation({
        container: lottieContainer.value,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: withBase('/assets/lotties/play.json')
      })
    }).catch((e) => console.warn('failed to load lottie-web', e))
  }
})

const handleMouseEnter = () => {
  showLottie.value = true
}

const handleMouseLeave = () => {
  showLottie.value = false
}
</script>

<template>
  <div class="project-intro-section">
    <div 
      class="project-main-media" 
      :class="{ 'is-clickable': !!(fullVideo || externalLink) }"
      ref="mediaContainer" 
      @mouseenter="handleMouseEnter" 
      @mouseleave="handleMouseLeave"
      @click="openLightbox"
    >
      <video v-if="video" :src="withBase(video)" autoplay loop muted playsinline></video>
      <img v-else-if="image" :src="withBase(image)" :alt="alt || 'Project media'">
      <div v-if="fullVideo || externalLink" ref="lottieContainer" class="lottie-overlay" :class="{ 'is-visible': showLottie }"></div>
    </div>
    
    <div class="project-intro-text">
       <div class="description-block">
          <slot></slot>
       </div>
    </div>

    <Teleport to="body">
      <div v-if="isLightboxOpen" class="lightbox" @click.self="closeLightbox">
        <button class="lightbox-close" @click="closeLightbox">&times;</button>
        <div class="lightbox-content">
          <iframe 
            v-if="embedUrl" 
            :src="embedUrl" 
            frameborder="0" 
            allow="autoplay; fullscreen; picture-in-picture" 
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.project-main-media {
  transition: transform 0.3s ease;
}

.project-main-media.is-clickable:hover {
  transform: scale(1.02);
}

.project-main-media.is-clickable {
  cursor: pointer;
}

.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: default;
}

.lightbox-content {
  width: 90%;
  max-width: 1280px;
  aspect-ratio: 16/9;
  background: black;
}

.lightbox-content iframe {
  width: 100%;
  height: 100%;
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 30px;
  background: none;
  border: none;
  color: white;
  font-size: 40px;
  font-weight: 300;
  cursor: pointer;
  z-index: 2001;
  line-height: 1;
  padding: 10px;
}

.lightbox-close:hover {
  opacity: 0.7;
}

.lottie-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lottie-overlay.is-visible {
  opacity: 0.7;
}
</style>
