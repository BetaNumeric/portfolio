<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'
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
const videoExtensionPattern = /\.(mp4|webm|mov|m4v|ogv|ogg)(?:$|[?#])/i
let previousBodyOverflow = ''

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
  }
}

const closeLightbox = () => {
  isLightboxOpen.value = false
  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = ''
}

onUnmounted(() => {
  closeLightbox()
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
    <div 
      class="project-main-media" 
      :class="{ 'is-clickable': !!(fullVideo || externalLink) }"
      @mouseenter="handleMouseEnter" 
      @mouseleave="handleMouseLeave"
      @click="openLightbox"
    >
      <video
        v-if="mediaVideo"
        :src="withBase(mediaVideo)"
        :poster="mediaPoster ? withBase(mediaPoster) : undefined"
        autoplay
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
