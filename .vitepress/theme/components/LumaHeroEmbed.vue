<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    src: string
    title?: string
    darkMode?: boolean | null
    layoutPreset?: string | null
  }>(),
  {
    title: 'Luma embed',
    darkMode: null,
    layoutPreset: null,
  }
)

// Guard against accidental whitespace/newlines in long query URLs.
const embedSrc = computed(() => {
  const cleanedSrc = props.src.replace(/\s+/g, '')
  if (!cleanedSrc) return cleanedSrc

  try {
    const url = new URL(cleanedSrc)

    if (typeof props.darkMode === 'boolean') {
      url.searchParams.set('theme', props.darkMode ? 'dark' : 'light')
    }

    if (props.layoutPreset) {
      url.searchParams.set('preset', props.layoutPreset)
    }

    return url.toString()
  } catch {
    return cleanedSrc
  }
})
</script>

<template>
  <section class="luma-hero">
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
  height: 60vh;
  min-height: 380px;
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
    height: 50vh;
    min-height: 320px;
  }
}
</style>
