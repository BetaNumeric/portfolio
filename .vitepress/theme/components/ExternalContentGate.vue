<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useRoute, withBase } from 'vitepress'
import {
  cleanExternalUrl,
  externalContentResetVersion,
  getExternalProvider,
  setExternalContentActive,
} from '../utils/externalContent'

const props = withDefaults(defineProps<{
  src: string
  title?: string
  description?: string
  externalLink?: string
}>(), { title: 'External content', description: '', externalLink: '' })

const route = useRoute()
const id = useId()
const isActive = ref(false)
const loadButton = ref<HTMLButtonElement | null>(null)
const unloadButton = ref<HTMLButtonElement | null>(null)
const provider = computed(() => getExternalProvider(props.src))
const externalUrl = computed(() => cleanExternalUrl(props.externalLink || props.src))

const activate = async () => {
  isActive.value = true
  setExternalContentActive(id, true)
  await nextTick()
  unloadButton.value?.focus({ preventScroll: true })
}

const deactivate = async (restoreFocus = false) => {
  isActive.value = false
  setExternalContentActive(id, false)
  if (restoreFocus) {
    await nextTick()
    loadButton.value?.focus({ preventScroll: true })
  }
}

watch([() => props.src, () => route.path, externalContentResetVersion], () => deactivate())
onBeforeUnmount(() => setExternalContentActive(id, false))
</script>

<template>
  <div class="external-content" :class="{ 'external-content--active': isActive }" :data-provider="provider.name">
    <div v-if="!isActive" class="external-content__notice">
      <p class="external-content__title">{{ title }}</p>
      <p :id="`${id}-notice`" class="external-content__description">
        {{ description || `Loading this content connects to ${provider.name}, which receives your IP address and device information and may use cookies or process data outside the EU/EEA.` }}
        Your choice applies to this viewer only. You can withdraw it using “Unload content”.
      </p>
      <div class="external-content__links">
        <a :href="withBase('/datenschutz#externe-inhalte')">Privacy information</a>
        <a v-if="provider.privacyUrl" :href="provider.privacyUrl" target="_blank" rel="noopener noreferrer">{{ provider.name }} privacy policy</a>
      </div>
      <button ref="loadButton" type="button" class="external-content__load" :aria-describedby="`${id}-notice`" @click="activate">
        Load content from {{ provider.name }}
      </button>
      <a :href="externalUrl" class="external-content__external-link" target="_blank" rel="noopener noreferrer">Open in a new tab instead ↗</a>
    </div>
    <template v-else>
      <div class="external-content__toolbar">
        <span>{{ provider.name }}</span>
        <button ref="unloadButton" type="button" class="external-content__unload" @click="deactivate(true)">Unload content</button>
      </div>
      <div class="external-content__viewer"><slot /></div>
    </template>
  </div>
</template>

<style scoped>
.external-content {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--site-text);
}

.external-content__notice {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: clamp(20px, 4vw, 40px);
  text-align: center;
}

.external-content__notice p {
  margin: 0;
  max-width: 600px;
}

.external-content__title { font-size: 1.15rem; font-weight: 500; }
.external-content__description { font-size: 14px; line-height: 1.55; color: var(--site-text-muted); }
.external-content__links { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 20px; font-size: 13px; }
.external-content__links a, .external-content__external-link { text-decoration: underline; text-underline-offset: 3px; }
.external-content__external-link { font-size: 13px; }

.external-content__load {
  padding: 12px 18px;
  border: 1px solid var(--site-border-hover);
  border-radius: 6px;
  background: var(--site-text);
  color: var(--site-bg);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.external-content__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  font-size: 13px;
  flex-shrink: 0;
}

.external-content__unload {
  padding: 4px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.external-content__viewer { flex: 1; min-height: 0; position: relative; }

@media (max-width: 480px) {
  .external-content { min-height: 360px; }
}
</style>
