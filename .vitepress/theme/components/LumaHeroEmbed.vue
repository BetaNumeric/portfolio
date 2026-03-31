<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()

const props = withDefaults(
  defineProps<{
    src: string
    title?: string
    darkMode?: boolean | string | null
    layoutPreset?: string | null
    height?: string | null
    minHeight?: string | null
    mobileHeight?: string | null
    mobileMinHeight?: string | null
  }>(),
  {
    title: 'Luma embed',
    darkMode: null,
    layoutPreset: null,
    height: null,
    minHeight: null,
    mobileHeight: null,
    mobileMinHeight: null,
  }
)

// Guard against accidental whitespace/newlines in long query URLs.
const embedSrc = computed(() => {
  const cleanedSrc = props.src.replace(/\s+/g, '')
  if (!cleanedSrc) return cleanedSrc

  try {
    const url = new URL(cleanedSrc)

    if (props.darkMode === 'auto') {
      url.searchParams.set('theme', isDark.value ? 'dark' : 'light')
    } else if (typeof props.darkMode === 'boolean') {
      url.searchParams.set('theme', props.darkMode ? 'dark' : 'light')
    } else if (props.darkMode === 'true' || props.darkMode === 'false') {
      url.searchParams.set('theme', props.darkMode === 'true' ? 'dark' : 'light')
    }

    if (props.layoutPreset) {
      url.searchParams.set('preset', props.layoutPreset)
    }

    return url.toString()
  } catch {
    return cleanedSrc
  }
})

const heroStyle = computed(() => {
  return {
    '--luma-hero-height': props.height ?? '60vh',
    '--luma-hero-min-height': props.minHeight ?? '380px',
    '--luma-hero-mobile-height': props.mobileHeight ?? '50vh',
    '--luma-hero-mobile-min-height': props.mobileMinHeight ?? '320px',
  }
})
</script>

<template>
  <section class="luma-hero" :style="heroStyle">
    <iframe
      :src="embedSrc"
      :title="title"
      frameborder="0"
      allowfullscreen
      class="luma-hero__frame"
      style="border: none"
    ></iframe>
  </section>
</template>

<style scoped>
.luma-hero {
  width: 100%;
  height: var(--luma-hero-height);
  min-height: var(--luma-hero-min-height);
  margin-top: 60px; /* keep clear of fixed header */
  border-bottom: 1px solid var(--site-border);
  background: var(--site-bg);
}

.luma-hero__frame {
  display: block;
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .luma-hero {
    height: var(--luma-hero-mobile-height);
    min-height: var(--luma-hero-mobile-min-height);
  }
}
</style>
