<script setup lang="ts">
import { computed } from 'vue'
import type { SourceSwatch, NameIssue } from '@color-frames/contracts'
import SwatchRow from './SwatchRow.vue'
const props = defineProps<{
  swatches: readonly SourceSwatch[]
  issues?: readonly NameIssue[]
  showPath?: boolean
}>()
const issuesById = computed(() => new Map(props.issues?.map(({ id, message }) => [id, message])))
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
        :issue="issuesById.get(swatch.id) ?? ''"
      />
    </ul>
  </section>
</template>
