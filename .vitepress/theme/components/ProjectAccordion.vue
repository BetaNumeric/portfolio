<script setup lang="ts">
import { ref, onMounted, onUpdated, nextTick } from 'vue'

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

const toggle = () => {
  if (props.alwaysOpen) return
  isOpen.value = !isOpen.value
  // If opening, wait for DOM and any lazy loads to start, then re-check images
  if (isOpen.value) {
    nextTick(() => {
      // small delay to let lazy-loading attributes kick in
      setTimeout(markTallImages, 50)
    })
  }
}

function markTallImages() {
  if (!root.value) return
  const imgs: NodeListOf<HTMLImageElement> = root.value.querySelectorAll('.accordion-content img')
  imgs.forEach((img) => {
    const check = (w?: number, h?: number) => {
      const nw = w ?? img.naturalWidth
      const nh = h ?? img.naturalHeight
      // Classify as "tall" when the image is square or taller (height/width >= 1)
      if (nw && nh && nh / nw >= 0.8) {
        img.classList.add('tall-image')
      } else {
        img.classList.remove('tall-image')
      }
    }

    if (img.naturalWidth && img.naturalHeight) {
      check()
      return
    }

    // If the image hasn't provided natural sizes yet, try a few fallbacks:
    // 1) listen for the load event
    const onLoad = () => {
      check()
      img.removeEventListener('load', onLoad)
    }
    img.addEventListener('load', onLoad)

    // 2) create a probing Image to get natural sizes (handles lazy-loading
    // where the element's naturalWidth is not yet populated)
    try {
      const probe = new Image()
      probe.src = (img.currentSrc || img.src) as string
      probe.decode?.().then(() => {
        if (probe.naturalWidth && probe.naturalHeight) check(probe.naturalWidth, probe.naturalHeight)
      }).catch(() => {
        probe.onload = () => check(probe.naturalWidth, probe.naturalHeight)
      })
    } catch (e) {
      // ignore probe failures
    }
  })
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
    <div v-if="!props.alwaysOpen" class="section-trigger" @click="toggle">
       <h2>{{ title }}</h2>
       <img class="chevron" :class="{ 'is-open': isOpen }" src="/assets/icons/chevron_w.svg" alt="Toggle" />
    </div>

    <div class="accordion-content" :class="{ 'is-open': isOpen, 'center-images': props.centerImages }" v-show="isOpen">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.project-accordion {
  margin: 2rem 0; /* Reduced margin since separator is gone */
  padding-bottom: 1rem;
}

.section-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 2rem;
  user-select: none;
}

.section-trigger h2 {
  margin: 0;
  font-size: 1rem; /* Matched to bold body text size */
  font-weight: 700; /* Bold like **text** */
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-right: 0.5rem;
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
