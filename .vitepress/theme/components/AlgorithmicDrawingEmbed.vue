<template>
  <ClientOnly>
    <div :class="['algo-hero', { 'force-loader': forceLoader }]" @wheel="handleWheel" @mouseenter="isHovering = true" @mouseleave="isHovering = false">
      <div id="p5_container0"></div>
      <div v-show="isLoading || forceLoader" class="loading-overlay" ref="lottieContainer">
        <div class="spinner"></div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'
// load lottie-web dynamically in onMounted to avoid SSR errors

let scriptsLoaded = false
const isLoading = ref(true)
const isHovering = ref(false)
const forceLoader = ref(false)
// expose quick test handle on window for debugging from console (guard for SSR)
if (typeof window !== 'undefined') {
  ;(window as any).__Algo_forceLoader = forceLoader
}
const lottieContainer = ref<HTMLDivElement | null>(null)

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

  // Load lottie animation
  if (lottieContainer.value) {
    import('lottie-web').then((mod) => {
      const lottie = (mod && (mod.default ?? mod))
      const container = lottieContainer.value
      if (container) {
        lottie.loadAnimation({
          container: container,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: withBase('/assets/lotties/loading-check-mark.json')
        })
        console.info('[AlgorithmicDrawingEmbed] lottie animation initialized')
      }
    }).catch((e) => {
      console.warn('[AlgorithmicDrawingEmbed] failed to load lottie-web', e)
    })
  }

  // Avoid loading scripts multiple times
  if (scriptsLoaded) return
  
  // Check if p5 is already loaded
  if ((window as any).p5) {
    loadSketchScript()
    return
  }
  
  // Load p5.js
  const p5Script = document.createElement('script')
  p5Script.src = 'https://cdn.jsdelivr.net/npm/p5@1.8.0/lib/p5.js'
  p5Script.type = 'text/javascript'
  
  // Load the sketch script after p5.js loads
  p5Script.onload = () => {
    loadSketchScript()
  }
  
  p5Script.onerror = () => {
    console.error('Failed to load p5.js')
  }
  
  document.head.appendChild(p5Script)
  scriptsLoaded = true

  // Check if sketch has actually rendered content
  const checkSketchLoaded = setInterval(() => {
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
            clearInterval(checkSketchLoaded)
            console.info('[AlgorithmicDrawingEmbed] sketch rendered, hiding loader')
          }
        } else {
           // webgl context or other fallback
           isLoading.value = false
           clearInterval(checkSketchLoaded)
        }
      } catch (e) {
        // If we can't access canvas, just assume it's loading, or if cross-origin issues
        // We might just want to hide loader if canvas exists
         isLoading.value = false
         clearInterval(checkSketchLoaded)
      }
    }
  }, 100)

  // Timeout after 10 seconds to be safe (unless forceLoader)
  setTimeout(() => {
    if (!forceLoader.value) {
      isLoading.value = false
      clearInterval(checkSketchLoaded)
      console.info('[AlgorithmicDrawingEmbed] loader timeout, hiding loader')
    } else {
      console.info('[AlgorithmicDrawingEmbed] forceLoader active, keeping loader visible')
    }
  }, 10000)
})

function loadSketchScript() {
  const sketchScript = document.createElement('script')
  sketchScript.src = 'https://q9qpn4.csb.app/sketch.js'
  sketchScript.type = 'text/javascript'
  sketchScript.onerror = () => {
    console.error('Failed to load sketch.js')
    isLoading.value = false
  }
  document.head.appendChild(sketchScript)
}

onUnmounted(() => {
  // Clean up: remove the p5 instance if it exists
  if ((window as any).remove) {
    (window as any).remove()
  }
  // Also try to remove the p5 object if attached to window to allow clean reload
  // but be careful if other pages need it. For now, maybe just remove().
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
  display: none; /* Hidden by default, shown if lottie fails or while lottie loads */
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
