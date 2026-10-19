<script setup lang="ts">
import { withBase } from 'vitepress'
import ExternalEmbed from './ExternalEmbed.vue'
</script>

<template>
  <section class="timescale-hero">
    <ExternalEmbed
      :src="withBase('/embeds/time-scale.html')"
      start-message="start-time-scale"
      title="Time Scale interactive demo"
      provider-src="https://docs.google.com"
      external-link="https://betanumeric.github.io/time/"
      description="Google Sheets, jsDelivr and RawGit may use cookies and process your IP/device data outside the EU/EEA."
      allow=""
    />
  </section>
</template>

<style scoped>
.timescale-hero {
  width: 100%;
  height: 60vh;
  min-height: 400px;
  margin-top: 60px;
  border-bottom: 1px solid var(--site-border);
}
</style>
