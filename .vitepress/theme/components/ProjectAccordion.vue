<script setup lang="ts">
import { ref, onMounted, onUpdated, nextTick, useId } from 'vue'

const props = defineProps<{
  title?: string
  defaultOpen?: boolean
  /** When true the accordion is always open and no trigger/title is shown */
  alwaysOpen?: boolean
  /** When true, large images are constrained to a smaller centered max width */
  centerImages?: boolean
}>()

const isOpen = ref(props.alwaysOpen ? true : (props.defaultOpen ?? false))
const root = ref<HTMLElement | null>(null)
const contentId = `project-accordion-${useId()}`

const toggle = () => {
  if (props.alwaysOpen) return
  isOpen.value = !isOpen.value
}

const classifyImage = (img: HTMLImageElement) => {
  if (!img.naturalWidth || !img.naturalHeight) return
  img.classList.toggle('tall-image', img.naturalHeight / img.naturalWidth >= 0.8)
}

const handleImageLoad = (event: Event) => {
  if (event.target instanceof HTMLImageElement) classifyImage(event.target)
}

const markTallImages = () => {
  // Classify cached images without fetching media in collapsed sections.
  root.value?.querySelectorAll<HTMLImageElement>('.accordion-content img').forEach(classifyImage)
}

onMounted(() => {
  nextTick(markTallImages)
})

onUpdated(() => {
  nextTick(markTallImages)
})
</script>

<template>
  <div class="project-accordion" ref="root">
    <h2 v-if="!props.alwaysOpen" class="section-heading">
      <button
        class="section-trigger"
        type="button"
        :aria-expanded="isOpen"
        :aria-controls="contentId"
        @click="toggle"
      >
        <span>{{ title }}</span>
        <svg class="chevron" :class="{ 'is-open': isOpen }" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M256,294.1l127-127.1c9.4-9.4,24.6-9.4,33.9,0s9.3,24.6,0,34l-143.9,144c-9.1,9.1-23.7,9.3-33.1.7L95,201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3,7-17c9.4-9.4,24.6-9.4,33.9,0l127.1,127Z" />
        </svg>
      </button>
    </h2>

    <div :id="contentId" class="accordion-content" :class="{ 'is-open': isOpen, 'center-images': props.centerImages }" v-show="isOpen" @load.capture="handleImageLoad">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.project-accordion {
  margin: 2rem 0; /* Reduced margin since separator is gone */
  padding-bottom: 1rem;
}

.section-heading {
  margin: 0 0 2rem;
}

.section-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  user-select: none;
}

.section-trigger span {
  font-size: 1rem; /* Matched to bold body text size */
  font-weight: 700; /* Bold like **text** */
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-trigger .chevron {
  display: inline-block;
  transition: transform 0.3s;
  width: 14px; /* SVG sizing */
  height: 14px;
  transform: rotate(-90deg); /* Point down by default, or right if collapsed? Usually right is default closed. */
}

.section-trigger .chevron.is-open {
  transform: rotate(0deg); /* Point up/open? User said it's pointing down by default. */
}

/* Default behavior: keep native size when small, scale down when needed, and center. */
.accordion-content :deep(img) {
  display: block;
  margin: 2rem auto;
  width: auto;
  max-width: 100%;
}

.accordion-content :deep(video.md-inline-video) {
  display: block;
  margin: 2rem auto;
  width: auto;
  max-width: 100%;
}

/* Optional behavior: constrain larger images to a smaller centered max width. */
.accordion-content.center-images :deep(img) {
  width: auto;
  max-width: min(72svh, 100%);
}

.accordion-content.center-images :deep(video.md-inline-video) {
  width: auto;
  max-width: min(72svh, 100%);
}

@media (max-width: 720px) {
  .accordion-content.center-images :deep(img),
  .accordion-content.center-images :deep(video.md-inline-video) {
    max-width: 100%;
  }
}

/* Images that are detected as tall (portrait) get a smaller fixed width
   so they don't dominate the viewport height. These rules override
   the center-images sizing when applicable. */
.accordion-content :deep(img).tall-image {
  display: block;
  margin: 2rem auto;
  width: auto;
  max-width: min(48svh, 100%);
}

.accordion-content.center-images :deep(img).tall-image {
  /* keep a tighter max width for portrait images in constrained mode */
  max-width: min(48svh, 100%);
}

@media (max-width: 720px) {
  .accordion-content :deep(img).tall-image {
    max-width: 100%;
  }
}
</style>
