<script setup lang="ts">
import { computed } from 'vue'
import ExternalEmbed from './ExternalEmbed.vue'

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
    <ExternalEmbed
      :src="src"
      :title="title"
      :allow="allow"
    />
  </div>
</template>

<style scoped>
.model-embed {
  width: 100%;
  height: max(360px, var(--embed-height-desktop));
  margin: 2rem auto;
  border-radius: 8px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .model-embed {
    height: max(400px, var(--embed-height-mobile));
  }
}
</style>
