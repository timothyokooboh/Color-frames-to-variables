<script setup lang="ts">
import type { SourceSwatch } from '@color-frames/contracts'
import SwatchRow from './SwatchRow.vue'
defineProps<{ swatches: readonly SourceSwatch[] }>()
</script>

<template>
  <section aria-labelledby="swatches-title" class="space-y-3">
    <h2 id="swatches-title" class="text-sm font-semibold">Eligible swatches</h2>
    <ul class="space-y-2">
      <SwatchRow v-for="swatch in swatches" :key="swatch.id" :swatch="swatch" />
    </ul>
  </section>
</template>
