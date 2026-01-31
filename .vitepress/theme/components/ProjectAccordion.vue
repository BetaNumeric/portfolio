<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title: string
  defaultOpen?: boolean
}>()

const isOpen = ref(props.defaultOpen ?? false)

const toggle = () => {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="project-accordion">
    <div class="section-trigger" @click="toggle">
       <h2>{{ title }}</h2>
       <img class="chevron" :class="{ 'is-open': isOpen }" src="/assets/icons/chevron_w.svg" alt="Toggle" />
    </div>
    
    <div class="accordion-content" :class="{ 'is-open': isOpen }" v-show="isOpen">
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
</style>