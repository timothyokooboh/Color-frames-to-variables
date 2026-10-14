<script setup lang="ts">
import type { SourceSwatch, NameIssue } from '@color-frames/contracts'
import SwatchRow from './SwatchRow.vue'
defineProps<{
  swatches: readonly SourceSwatch[]
  issues?: readonly NameIssue[]
  showPath?: boolean
}>()
</script>

<template>
  <section aria-labelledby="swatches-title" class="space-y-3">
    <h2 id="swatches-title" class="text-sm font-semibold">Eligible swatches</h2>
    <ul class="space-y-2">
      <SwatchRow
        v-for="swatch in swatches"
        :key="swatch.id"
        :swatch="swatch"
        :show-path="showPath"
        :issue="issues?.find((issue) => issue.id === swatch.id)?.message ?? ''"
      />
    </ul>
  </section>
</template>
