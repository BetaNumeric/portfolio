<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{
  video?: string
  image?: string
  stillImage?: string
  alt?: string
  fullVideo?: string
  externalLink?: string
}>()

const showIndicator = ref(false)
const isLightboxOpen = ref(false)
const prefersReducedMotion = ref(false)
const mediaTrigger = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const videoExtensionPattern = /\.(mp4|webm|mov|m4v|ogv|ogg)(?:$|[?#])/i
let previousBodyOverflow = ''

const isClickable = computed(() => Boolean(props.fullVideo || props.externalLink))
const mediaActionLabel = computed(() => {
  if (props.externalLink) return 'Open project link in a new tab'
  if (props.fullVideo) return 'Play project video'
  return undefined
})

const isVideoFile = (source?: string) => {
  if (!source) return false
  return videoExtensionPattern.test(source)
}

const mediaVideo = computed(() => {
  if (props.video) return props.video
  if (isVideoFile(props.image)) return props.image
  return undefined
})

const mediaImage = computed(() => {
  if (props.image && !isVideoFile(props.image)) return props.image
  if (props.stillImage && !isVideoFile(props.stillImage)) return props.stillImage
  return undefined
})

const mediaPoster = computed(() => {
  if (props.stillImage && !isVideoFile(props.stillImage)) return props.stillImage
  return undefined
})

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
    window.open(props.externalLink, '_blank', 'noopener,noreferrer')
  } else if (props.fullVideo) {
    isLightboxOpen.value = true
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleLightboxKeydown)
    nextTick(() => closeButton.value?.focus())
  }
}

const closeLightbox = (restoreFocus = true) => {
  if (!isLightboxOpen.value) return
  isLightboxOpen.value = false
  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = ''
  window.removeEventListener('keydown', handleLightboxKeydown)
  if (restoreFocus) {
    nextTick(() => mediaTrigger.value?.focus())
  }
}

const handleLightboxKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  event.preventDefault()
  closeLightbox()
}

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

onUnmounted(() => {
  closeLightbox(false)
})

const handleMouseEnter = () => {
  showIndicator.value = true
}

const handleMouseLeave = () => {
  showIndicator.value = false
}
</script>

<template>
  <div class="project-intro-section">
    <component
      :is="isClickable ? 'button' : 'div'"
      ref="mediaTrigger"
      class="project-main-media" 
      :class="{ 'is-clickable': isClickable }"
      :type="isClickable ? 'button' : undefined"
      :aria-label="mediaActionLabel"
      :aria-haspopup="fullVideo ? 'dialog' : undefined"
      @mouseenter="handleMouseEnter" 
      @mouseleave="handleMouseLeave"
      @click="openLightbox"
    >
      <video
        v-if="mediaVideo"
        :src="withBase(mediaVideo)"
        :poster="mediaPoster ? withBase(mediaPoster) : undefined"
        :autoplay="!prefersReducedMotion"
        loop
        muted
        playsinline
        preload="metadata"
      ></video>
      <img v-else-if="mediaImage" :src="withBase(mediaImage)" :alt="alt || 'Project media'">
      <div v-if="fullVideo || externalLink" class="play-overlay" :class="{ 'is-visible': showIndicator }" aria-hidden="true">
        <div class="play-overlay__badge">
          <span class="play-overlay__icon"></span>
        </div>
      </div>
    </component>
    
    <div class="project-intro-text">
       <div class="description-block">
          <slot></slot>
       </div>
    </div>

    <Teleport to="body">
      <div
        v-if="isLightboxOpen"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Project video"
        @click.self="closeLightbox()"
        @keydown.esc.stop="closeLightbox()"
      >
        <button ref="closeButton" class="lightbox-close" type="button" aria-label="Close video" @click="closeLightbox()">&times;</button>
        <div class="lightbox-content">
          <iframe 
            v-if="embedUrl" 
            :src="embedUrl" 
            title="Project video"
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
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: inherit;
  transition: transform 0.3s ease;
}

.project-main-media.is-clickable:hover {
  transform: scale(1.02);
}

.project-main-media.is-clickable:focus-visible {
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

.play-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.play-overlay.is-visible {
  opacity: 1;
}

.play-overlay__badge {
  width: 96px;
  height: 96px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.24);
}

.play-overlay__icon {
  width: 0;
  height: 0;
  margin-left: 8px;
  border-top: 16px solid transparent;
  border-bottom: 16px solid transparent;
  border-left: 24px solid #ffffff;
}
</style>
