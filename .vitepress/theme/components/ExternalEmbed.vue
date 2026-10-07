<script setup lang="ts">
import { computed } from 'vue'
import ExternalContentGate from './ExternalContentGate.vue'
import { getPrivateEmbedUrl } from '../utils/externalContent'

const props = withDefaults(defineProps<{
  src: string
  title?: string
  allow?: string
  providerSrc?: string
  description?: string
  externalLink?: string
  startMessage?: string
}>(), {
  title: 'External viewer',
  allow: 'autoplay; fullscreen; picture-in-picture; xr-spatial-tracking',
})

const embedSrc = computed(() => getPrivateEmbedUrl(props.src))
const handleLoad = (event: Event) => {
  if (!props.startMessage) return
  const frame = event.target as HTMLIFrameElement
  // Only local helper documents can receive this message.
  frame.contentWindow?.postMessage(props.startMessage, window.location.origin)
}
// YouTube requires the embedding site's origin to identify its player client.
// Other viewers do not receive a referrer from this page.
const referrerPolicy = computed(() => {
  try {
    return new URL(embedSrc.value).hostname === 'www.youtube-nocookie.com'
      ? 'strict-origin-when-cross-origin'
      : 'no-referrer'
  } catch {
    return 'no-referrer'
  }
})
</script>

<template>
  <ExternalContentGate :src="providerSrc || embedSrc" :title="title" :description="description" :external-link="externalLink">
    <iframe :src="embedSrc" :title="title" :allow="allow" allowfullscreen :referrerpolicy="referrerPolicy" class="external-embed__frame" @load="handleLoad"></iframe>
  </ExternalContentGate>
</template>

<style scoped>
.external-embed__frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
