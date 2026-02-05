<template>
  <ClientOnly>
    <div :class="['timescale-hero', { 'force-loader': forceLoader }]" @wheel="handleWheel" @mouseenter="isHovering = true" @mouseleave="isHovering = false">
      <div id="program"></div>
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
  ;(window as any).__TimeScale_forceLoader = forceLoader
}

let checkSketchLoaded: number | undefined
let loaderTimeout: number | undefined
let p5GlobalInstance: any = null

function startGlobalSketch() {
  const w = window as any
  if (w.__VP_VENDOR_P5_GLOBAL?.remove) {
    try { w.__VP_VENDOR_P5_GLOBAL.remove() } catch {}
  }
  if (typeof w.p5 === 'function') {
    p5GlobalInstance = new w.p5()
    w.__VP_VENDOR_P5_GLOBAL = p5GlobalInstance
  }
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
      console.info('[TimeScaleEmbed] forceLoader enabled via query param')
    }
  } catch (e) {
    /* ignore */
  }

  if (!scriptsPromise) {
    scriptsPromise = (async () => {
      await loadScriptOnce(withBase('/vendor/p5/p5.js'))
      await loadScriptOnce(withBase('/vendor/sketches/time_web.js'))
    })()
  }
  scriptsPromise
    .then(() => startGlobalSketch())
    .catch((e) => {
      console.error('[TimeScaleEmbed] Failed to load vendor scripts', e)
      isLoading.value = false
    })

  // Check if sketch has actually rendered content
  checkSketchLoaded = window.setInterval(() => {
    // If forceLoader is on, keep showing loader
    if (forceLoader.value) return

    const canvas = document.querySelector('#program canvas') as HTMLCanvasElement
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
            console.info('[TimeScaleEmbed] sketch rendered, hiding loader')
          }
        }
      } catch (e) {
        // If we can't access canvas, just assume it's loading
      }
    }
  }, 100)

  // Timeout after 10 seconds to be safe (unless forceLoader)
  loaderTimeout = window.setTimeout(() => {
    if (!forceLoader.value) {
      isLoading.value = false
      if (checkSketchLoaded) window.clearInterval(checkSketchLoaded)
      console.info('[TimeScaleEmbed] loader timeout, hiding loader')
    } else {
      console.info('[TimeScaleEmbed] forceLoader active, keeping loader visible')
    }
  }, 30000)
})

onUnmounted(() => {
  if (checkSketchLoaded) window.clearInterval(checkSketchLoaded)
  if (loaderTimeout) window.clearTimeout(loaderTimeout)

  const inst = p5GlobalInstance
  if (p5GlobalInstance?.remove) {
    try { p5GlobalInstance.remove() } catch {}
    p5GlobalInstance = null
  }
  const w = window as any
  if (w.__VP_VENDOR_P5_GLOBAL === inst) {
    w.__VP_VENDOR_P5_GLOBAL = null
  }
  // Clean up: remove the p5 instance if it exists
  if ((window as any).remove) {
    (window as any).remove()
  }
})
</script>

<style scoped>
.timescale-hero {
  width: 100%;
  height: 60vh;
  position: relative;
  margin-top: 60px; /* Navbar height */
}

#program {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  pointer-events: none;
  z-index: 1000; /* Bring on top for debugging */
}

/* Debug helper: show loader when forced via query param */
.timescale-hero.force-loader .loading-overlay {
  display: block;
}

/* Simple fallback spinner */
.spinner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 6px solid rgba(255,255,255,0.2);
  border-top-color: rgba(255,255,255,0.9);
  animation: ts-spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes ts-spin {
  to { transform: rotate(360deg); }
}
</style>

/* Light mode overrides (unscoped so it matches html.light-mode) */
<style>
.light-mode .timescale-hero .spinner {
  border: 6px solid rgba(0,0,0,0.12);
  border-top-color: rgba(0,0,0,0.85);
}
</style>
