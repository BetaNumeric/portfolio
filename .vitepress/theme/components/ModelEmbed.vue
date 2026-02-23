<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    src: string
    title?: string
    desktopHeight?: string
    mobileHeight?: string
    allow?: string
  }>(),
  {
    title: '3D model embed',
    desktopHeight: '400px',
    mobileHeight: '40vh',
    allow:
      'fullscreen; xr-spatial-tracking; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
  }
)

const frameStyle = computed(() => ({
  '--embed-height-desktop': props.desktopHeight,
  '--embed-height-mobile': props.mobileHeight,
}))
</script>

<template>
  <div class="model-embed" :style="frameStyle">
    <iframe
      :src="src"
      :title="title"
      frameborder="0"
      allowfullscreen
      mozallowfullscreen="true"
      webkitallowfullscreen="true"
      :allow="allow"
      xr-spatial-tracking
      execution-while-out-of-viewport
      execution-while-not-rendered
      web-share
    ></iframe>
  </div>
</template>

<style scoped>
.model-embed {
  width: 100%;
  height: var(--embed-height-desktop);
  margin: 2rem auto;
  border-radius: 8px;
  overflow: hidden;
}

.model-embed iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

@media (max-width: 768px) {
  .model-embed {
    height: var(--embed-height-mobile);
  }
}
</style>

