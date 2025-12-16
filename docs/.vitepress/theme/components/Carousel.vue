<template>
  <div
    class="relative w-full overflow-hidden bg-gray-800 text-white"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div
      class="flex duration-500 ease-out"
      :class="transitionEnabled ? 'transition-transform' : 'transition-none'"
      :style="{ transform: `translateX(-${internalIndex * 100}%)` }"
      @transitionend="onTransitionEnd"
    >
      <div
        v-for="(s, i) in extendedSlides"
        :key="i"
        class="w-full flex-shrink-0 relative"
      >
        <a v-if="s.href" :href="s.href" class="block w-full h-64 md:h-96">
          <div
            class="w-full h-full bg-center bg-cover flex items-end"
            :style="{ backgroundImage: s.image ? `url('${s.image}')` : '' }"
          >
            <div class="w-full bg-gradient-to-t from-black/60 to-transparent p-4 md:p-8">
              <h3 class="text-lg md:text-2xl font-semibold">{{ s.title }}</h3>
              <p v-if="s.excerpt" class="text-sm md:text-base text-gray-200 mt-1">{{ s.excerpt }}</p>
            </div>
          </div>
        </a>

        <div v-else class="block w-full h-64 md:h-96">
          <div
            class="w-full h-full bg-center bg-cover flex items-end"
            :style="{ backgroundImage: s.image ? `url('${s.image}')` : '' }"
          >
            <div class="w-full bg-gradient-to-t from-black/60 to-transparent p-4 md:p-8">
              <h3 class="text-lg md:text-2xl font-semibold">{{ s.title }}</h3>
              <p v-if="s.excerpt" class="text-sm md:text-base text-gray-200 mt-1">{{ s.excerpt }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation arrows -->
    <button
      @click="prev"
      class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 hidden md:inline-flex"
      aria-label="Previous"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <button
      @click="next"
      class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 hidden md:inline-flex"
      aria-label="Next"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Mobile tap areas -->
    <div class="md:hidden absolute inset-0 flex">
      <div class="w-1/2 h-full" @click="prev"></div>
      <div class="w-1/2 h-full" @click="next"></div>
    </div>

    <!-- Dots -->
    <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
      <button
        v-for="(s, i) in slides"
        :key="`dot-${i}`"
        @click="goTo(i)"
        :class="['w-3 h-3 rounded-full', activeIndex === i ? 'bg-white' : 'bg-white/40']"
        :aria-label="`Go to slide ${i+1}`"
      ></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export type Slide = {
  title?: string
  image?: string | null
  excerpt?: string
  href?: string
}

const props = withDefaults(
  defineProps<{
  slides: Slide[]
  autoplay?: boolean
  interval?: number
  loop?: boolean
  }>(),
  {
    autoplay: false,
    interval: 4000,
    loop: true,
  }
)

const slides = computed(() => props.slides ?? [])
const autoplay = computed(() => props.autoplay)
const interval = computed(() => props.interval)
const loop = computed(() => props.loop)

const internalIndex = ref(0)
const transitionEnabled = ref(true)
const isSnapping = ref(false)
const paused = ref(false)
let timer: number | null = null

const extendedSlides = computed(() => {
  const base = slides.value
  if (!loop.value || base.length <= 1) return base
  const first = base[0]
  const last = base[base.length - 1]
  return [last, ...base, first]
})

const activeIndex = computed(() => {
  const len = slides.value.length
  if (len === 0) return 0
  if (!loop.value || len <= 1) return Math.min(internalIndex.value, len - 1)
  const idx = (internalIndex.value - 1 + len) % len
  return idx
})

function initIndex() {
  const len = slides.value.length
  if (len === 0) {
    internalIndex.value = 0
    return
  }
  internalIndex.value = loop.value && len > 1 ? 1 : 0
}

function next() {
  const len = slides.value.length
  if (len <= 1) return
  if (isSnapping.value || !transitionEnabled.value) return

  if (!loop.value) {
    internalIndex.value = Math.min(internalIndex.value + 1, len - 1)
    return
  }

  // Loop mode uses extendedSlides indexes: [0..len+1]
  internalIndex.value = Math.min(internalIndex.value + 1, len + 1)
}

function prev() {
  const len = slides.value.length
  if (len <= 1) return
  if (isSnapping.value || !transitionEnabled.value) return

  if (!loop.value) {
    internalIndex.value = Math.max(internalIndex.value - 1, 0)
    return
  }

  // Loop mode uses extendedSlides indexes: [0..len+1]
  internalIndex.value = Math.max(internalIndex.value - 1, 0)
}

function goTo(i: number) {
  const len = slides.value.length
  if (len === 0) return
  if (isSnapping.value || !transitionEnabled.value) return
  if (!loop.value || len <= 1) {
    internalIndex.value = Math.max(0, Math.min(i, len - 1))
    return
  }
  internalIndex.value = Math.max(1, Math.min(i + 1, len))
}

function onTransitionEnd() {
  const len = slides.value.length
  if (!loop.value || len <= 1) return

  // If we're on a cloned slide, snap to the matching real slide with transitions disabled.
  if (internalIndex.value === 0) {
    isSnapping.value = true
    transitionEnabled.value = false
    internalIndex.value = len
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        transitionEnabled.value = true
        isSnapping.value = false
      })
    })
  } else if (internalIndex.value === len + 1) {
    isSnapping.value = true
    transitionEnabled.value = false
    internalIndex.value = 1
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        transitionEnabled.value = true
        isSnapping.value = false
      })
    })
  }
}

function startTimer() {
  stopTimer()
  // VitePress renders components during SSR where `window` doesn't exist.
  if (typeof window === 'undefined') return
  if (!autoplay.value || paused.value || slides.value.length <= 1) return
  timer = window.setInterval(() => {
    next()
  }, interval.value)
}

function stopTimer() {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

function onMouseEnter() {
  paused.value = true
  stopTimer()
}

function onMouseLeave() {
  paused.value = false
  startTimer()
}

watch(
  () => [autoplay.value, interval.value, slides.value.length, loop.value],
  () => {
    initIndex()
    startTimer()
  },
  { immediate: true }
)

onMounted(() => {
  initIndex()
  startTimer()
})

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<style scoped></style>
