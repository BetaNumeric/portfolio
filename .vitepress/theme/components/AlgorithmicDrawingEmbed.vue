<template>
  <ClientOnly>
    <div :class="['algo-hero', { 'force-loader': forceLoader }]" @wheel="handleWheel" @mouseenter="isHovering = true" @mouseleave="isHovering = false">
      <div id="p5_container0"></div>
      <div v-show="isLoading || forceLoader" class="loading-overlay">
        <div class="spinner"></div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { loadScriptOnce } from '../utils/loadScript'

let scriptsPromise: Promise<void> | null = null
const isLoading = ref(true)
const isHovering = ref(false)
const forceLoader = ref(false)
// expose quick test handle on window for debugging from console (guard for SSR)
if (typeof window !== 'undefined') {
  ;(window as any).__Algo_forceLoader = forceLoader
}

let checkSketchLoaded: number | undefined
let loaderTimeout: number | undefined

function mountVendorSketches() {
  const w = window as any
  if (typeof w.__VP_ALGO_MOUNT === 'function') w.__VP_ALGO_MOUNT()
}

const handleWheel = (e: WheelEvent) => {
  if (isHovering.value) {
    e.preventDefault()
  }
}

onMounted(() => {
  // Determine debug flag (use ?forceLoader=1 to force visible loader)
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('forceLoader') === '1') {
      forceLoader.value = true
      console.info('[AlgorithmicDrawingEmbed] forceLoader enabled via query param')
    }
  } catch (e) {
    /* ignore */
  }

  // Ensure vendor scripts are present, then (re)start the global-mode sketch for this hero.
  if (!scriptsPromise) {
    scriptsPromise = (async () => {
      await loadScriptOnce(withBase('/vendor/p5/p5.js'))
      await loadScriptOnce(withBase('/vendor/sketches/algorithmic_drawing.js'))
    })()
  }
  scriptsPromise
    .then(() => mountVendorSketches())
    .catch((e) => {
      console.error('[AlgorithmicDrawingEmbed] Failed to load vendor scripts', e)
      isLoading.value = false
    })

  // Check if sketch has actually rendered content
  checkSketchLoaded = window.setInterval(() => {
    // If forceLoader is on, keep showing loader
    if (forceLoader.value) return

    const container = document.querySelector('#p5_container0')
    const canvas = container ? container.querySelector('canvas') : document.querySelector('canvas') as HTMLCanvasElement

    if (canvas) {
      // Check if canvas has actual content by getting image data
      try {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data
          // Check if there's any non-transparent content
          let hasContent = false
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) {
              hasContent = true
              break
            }
          }
          if (hasContent) {
            isLoading.value = false
            if (checkSketchLoaded) window.clearInterval(checkSketchLoaded)
            console.info('[AlgorithmicDrawingEmbed] sketch rendered, hiding loader')
          }
        } else {
           // webgl context or other fallback
           isLoading.value = false
           if (checkSketchLoaded) window.clearInterval(checkSketchLoaded)
        }
      } catch (e) {
        // If we can't access canvas, just assume it's loading, or if cross-origin issues
        // We might just want to hide loader if canvas exists
         isLoading.value = false
         if (checkSketchLoaded) window.clearInterval(checkSketchLoaded)
      }
    }
  }, 100)

  // Timeout after 10 seconds to be safe (unless forceLoader)
  loaderTimeout = window.setTimeout(() => {
    if (!forceLoader.value) {
      isLoading.value = false
      if (checkSketchLoaded) window.clearInterval(checkSketchLoaded)
      console.info('[AlgorithmicDrawingEmbed] loader timeout, hiding loader')
    } else {
      console.info('[AlgorithmicDrawingEmbed] forceLoader active, keeping loader visible')
    }
  }, 10000)
})

onUnmounted(() => {
  if (checkSketchLoaded) window.clearInterval(checkSketchLoaded)
  if (loaderTimeout) window.clearTimeout(loaderTimeout)

  const w = window as any
  if (typeof w.__VP_ALGO_UNMOUNT === 'function') w.__VP_ALGO_UNMOUNT()
})
</script>

<style scoped>
.algo-hero {
  width: 100%;
  height: 60vh;
  position: relative;
  margin-top: 60px; /* Navbar height */
  overflow: hidden;
  background-color: var(--site-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid var(--site-border);
}

.algo-hero.force-loader .loading-overlay {
  display: flex !important;
}

#p5_container0 {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(canvas) {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--site-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--site-border); /* Light grey */
  border-top: 4px solid var(--site-text); /* Blue */
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
