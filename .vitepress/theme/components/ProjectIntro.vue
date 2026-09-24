<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{
  video?: string
  image?: string
  stillImage?: string
  alt?: string
  fullVideo?: string
  externalLink?: string
}>()

const isLightboxOpen = ref(false)
const prefersReducedMotion = ref(false)
const mediaTrigger = ref<HTMLElement | null>(null)
const lightboxDialog = ref<HTMLDialogElement | null>(null)
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

const openLightbox = async () => {
  if (props.externalLink || !props.fullVideo || isLightboxOpen.value) return

  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  isLightboxOpen.value = true
  await nextTick()

  const dialog = lightboxDialog.value
  if (!isLightboxOpen.value || !dialog?.isConnected) return
  // Native modal behavior contains focus, including the embedded player,
  // and makes the rest of the page inert while the video is open.
  dialog.showModal()
  closeButton.value?.focus({ preventScroll: true })
}

const closeLightbox = (restoreFocus = true) => {
  if (!isLightboxOpen.value) return
  isLightboxOpen.value = false
  lightboxDialog.value?.close()
  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = ''
  if (restoreFocus) {
    nextTick(() => mediaTrigger.value?.focus({ preventScroll: true }))
  }
}

const handleDialogClose = () => {
  if (!lightboxDialog.value?.open) closeLightbox()
}

const handleDialogKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Tab' || !lightboxDialog.value) return

  const focusable = Array.from(
    lightboxDialog.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), iframe, [href], [tabindex]:not([tabindex="-1"])'
    )
  )
  if (!focusable.length) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === lightboxDialog.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

onBeforeUnmount(() => {
  closeLightbox(false)
})
</script>

<template>
  <div class="project-intro-section">
    <component
      :is="externalLink ? 'a' : fullVideo ? 'button' : 'div'"
      ref="mediaTrigger"
      class="project-main-media" 
      :class="{ 'is-clickable': isClickable }"
      :type="fullVideo && !externalLink ? 'button' : undefined"
      :href="externalLink || undefined"
      :target="externalLink ? '_blank' : undefined"
      :rel="externalLink ? 'noopener noreferrer' : undefined"
      :aria-label="mediaActionLabel"
      :aria-haspopup="fullVideo && !externalLink ? 'dialog' : undefined"
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
      <div v-if="isClickable" class="play-overlay" aria-hidden="true">
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
      <dialog
        ref="lightboxDialog"
        class="lightbox"
        aria-label="Project video"
        @click.self="closeLightbox()"
        @cancel.prevent="closeLightbox()"
        @close="handleDialogClose"
        @keydown="handleDialogKeydown"
      >
        <button ref="closeButton" class="lightbox-close" type="button" aria-label="Close video" @click="closeLightbox()">&times;</button>
        <div class="lightbox-content">
          <iframe 
            v-if="isLightboxOpen && embedUrl"
            :src="embedUrl" 
            title="Project video"
            frameborder="0" 
            allow="autoplay; fullscreen; picture-in-picture" 
            allowfullscreen
          ></iframe>
        </div>
      </dialog>
    </Teleport>
  </div>
</template>

<style scoped>
.project-main-media {
  display: block;
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
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 2000;
  justify-content: center;
  align-items: center;
  cursor: default;
}

.lightbox[open] {
  display: flex;
}

.lightbox::backdrop {
  background: transparent;
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

.project-main-media:hover .play-overlay,
.project-main-media:focus-visible .play-overlay {
  opacity: 1;
}

@media (hover: none), (pointer: coarse) {
  .play-overlay {
    opacity: 1;
  }
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
