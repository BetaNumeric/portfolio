<template>
  <div
    class="relative w-full overflow-hidden bg-gray-800 text-white"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div
      class="flex transition-transform duration-500 ease-out"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
      ref="track"
    >
      <div
        v-for="(s, i) in slides"
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
        :class="['w-3 h-3 rounded-full', currentIndex === i ? 'bg-white' : 'bg-white/40']"
        :aria-label="`Go to slide ${i+1}`"
      ></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

type Slide = {
  title?: string
  image?: string | null
  excerpt?: string
  href?: string
}

const props = defineProps<{
  slides: Slide[]
  autoplay?: boolean
  interval?: number
  loop?: boolean
}>()

const { slides = [], autoplay = false, interval = 4000, loop = true } = props

const currentIndex = ref(0)
const paused = ref(false)
let timer: number | null = null
const track = ref<HTMLElement | null>(null)

function next() {
  if (currentIndex.value >= slides.length - 1) {
    if (loop) currentIndex.value = 0
  } else {
    currentIndex.value += 1
  }
}

function prev() {
  if (currentIndex.value <= 0) {
    if (loop) currentIndex.value = slides.length - 1
  } else {
    currentIndex.value -= 1
  }
}

function goTo(i: number) {
  currentIndex.value = i
}

function startTimer() {
  stopTimer()
  if (!autoplay || paused.value || slides.length <= 1) return
  timer = window.setInterval(() => {
    next()
  }, interval)
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

watch(() => ({ autoplay, interval, slides: slides.length }), startTimer)

onMounted(() => {
  startTimer()
})

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<style scoped>
/* small helpers if needed */
</style>
